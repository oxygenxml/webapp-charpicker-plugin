/**
 * After new characters have been inserted, add them to the recent characters grid.
 * Make sure recent characters are the expected length. Trim if longer.
 * @param {Array<String>} newCharacters The characters which were inserted.
 */
function addNewRecentCharacters(newCharacters) {
  var characters = newCharacters.concat(getUsedChars());
  goog.array.removeDuplicates(characters);
  characters = characters.slice(0, maxRecentChars);
  setRecentChars(characters);
}

/**
 * Migrate characters used by the user, since before the option to set default characters.
 * @param {Array<String>} initialDefaultRecentChars The default character list.
 * @param {Array<String>} currentRecentChars The current character list, found in the old storage item.
 * @returns {Array<String>} List of actually used characters from the old list.
 */
function getUsedCharsMigration(initialDefaultRecentChars, currentRecentChars) {
  var charsToSave = [];
  if (currentRecentChars.length && !goog.array.equals(initialDefaultRecentChars, currentRecentChars)) {
    var i;
    var indexInDefaults;
    var indexesInDefaults = [];
    // Make a list with indexes from default character list for each current character.
    goog.array.forEach(currentRecentChars, function (c) {
      indexesInDefaults.push(initialDefaultRecentChars.indexOf(c));
    });
    for (i = 0; i < currentRecentChars.length; i++) {
      indexInDefaults = indexesInDefaults.indexOf(i);
      var c = currentRecentChars[i];
      // If the character is new, save it. (was not in default list)
      if (indexInDefaults === -1) {
        charsToSave.push(c);
      } else {
        // If the character was in the default list, make sure it is not the start of the "padding".
        var slice = indexesInDefaults.slice(i);
        if (slice.indexOf(-1) !== -1 || !goog.array.isSorted(slice, null, true)) {
          charsToSave.push(c);
        } else {
          // If there are no new characters in the slice and the list is sorted,
          // then this is very likely the default padding part, can be replaced safely.
          break;
        }
      }
    }
  }
  return charsToSave;
}

/**
 * Get the default recent characters set by the user, if any were set.
 * @returns {Array} The array of default recent characters set by the user.
 */
function getUserSelectedDefaults () {
  var userSelectedDefaults = [];
  try {
    userSelectedDefaults = JSON.parse(sync.options.PluginsOptions.getClientOption('charp.recently.used.characters'));
    if (goog.isArray(userSelectedDefaults)) {
      var userSelectedDefaultsTemp = [];
      goog.array.forEach(userSelectedDefaults, function (e) {
        userSelectedDefaultsTemp.push(String.fromCharCode(e));
      });
      userSelectedDefaults = userSelectedDefaultsTemp;
    }
  } catch (e) {
    console.error('Failed to parse default recently used characters', e);
  }
  return userSelectedDefaults;
}

/**
 * Add the new characters to the list of recent characters.
 * @param {Array<String>} characters The characters to set as recent characters.
 */
function setRecentChars(characters) {
  if (localStorageUsable) {
    try {
      localStorage.setItem(usedCharsItemName, JSON.stringify(characters));
    } catch (e) {
      console.warn(e);
    }
  }
}

/**
 * Get the default recent characters which are used as padding to the actual recently used characters.
 */
function getDefaultRecentChars() {
  return getUserSelectedDefaults().concat(defaultRecentCharacters);
}

/**
 * Get the full recent characters list. Includes default characters padding.
 * @returns {Array<String>} The full list of recently used characters.
 */
function getRecentChars() {
  var recentChars = [];
  try {
    var usedChars = localStorage.getItem(usedCharsItemName);
    if (usedChars) {
      recentChars = JSON.parse(usedChars);
    }
    // If no used characters are detected, migration may be needed.
    if (recentChars.length === 0) {
      var oldRecentChars = localStorage.getItem(recentCharsItemName);
      if (oldRecentChars) {
        oldRecentChars = JSON.parse(oldRecentChars);
      }
      recentChars = getUsedCharsMigration(defaultRecentCharacters, oldRecentChars);
      // If migration yielded used characters, save them to the new storage item for next time.
      if (recentChars.length) {
        addNewRecentCharacters(recentChars);
      }
    }
  } catch (e) {
    console.warn(e);
  }

  // Fill recent chars with default characters if needed.
  if (recentChars.length < maxRecentChars) {
    recentChars = recentChars.concat(getDefaultRecentChars());
  }
  recentChars = recentChars.slice(0, maxRecentChars);
  return recentChars;
}

/**
 * Return the list with only used characters.
 * @returns {Array<String>}
 */
function getUsedChars () {
  var usedChars = [];
  try {
    usedChars = JSON.parse(localStorage.getItem(usedCharsItemName));
  } catch (e) {
    console.warn(e);
  }
  return usedChars;
}