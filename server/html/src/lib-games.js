/**
 * @license
 * Copyright 2013 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Common support code for all games and the index.
 * @author blocklygames@neil.fraser.name (Neil Fraser)
 */
'use strict';

goog.provide('BlocklyGames');

goog.require('Blockly.Msg');
goog.require('Blockly.Warning');

/**
 * Lookup for names of languages.  Keys should be in ISO 639 format.
 * @private
 */
BlocklyGames.LANGUAGE_NAME_ = {
  de: 'Deutsch',
  en: 'English',
};

/**
 * List of RTL languages.
 * @private
 */
BlocklyGames.LANGUAGE_RTL_ = [/*'ace',*/ 'ar', 'fa', 'he', /*'mzn', 'ps',*/ 'ur'];

/**
 * User's language (e.g. "en").
 * @type string
 */
BlocklyGames.LANG = window['BlocklyGamesLang'];

/**
 * List of languages supported by this app.  Values should be in ISO 639 format.
 * @type !Array<string>
 * @private
 */
BlocklyGames.LANGUAGES_ = window['BlocklyGamesLanguages'];

/**
 * Is the current language (BlocklyGames.LANG) an RTL language?
 * @type boolean
 */
BlocklyGames.IS_RTL = BlocklyGames.LANGUAGE_RTL_.includes(BlocklyGames.LANG);

/**
 * Is the site being served as raw HTML files, as opposed to on App Engine.
 * @type boolean
 */
BlocklyGames.IS_HTML = /\.html$/.test(window.location.pathname);

/**
 * 'document.getElementById' can't be compressed by the compiler,
 * so centralize all such calls here.  Saves 1-2 KB per game.
 */
BlocklyGames.getElementById = document.getElementById.bind(document);

/**
 * Report client-side errors back to the server.
 * @param {!ErrorEvent} event Error event.
 * @private
 */
BlocklyGames.errorReporter_ = function (event) {
  try {
    //if (Math.random() > 0.5) return;
    // 3rd party script errors (likely plugins) have no useful info.
    if (!event.lineno && !event.colno) return;
    // Rate-limit the reports to once every 10 seconds.
    const now = Date.now();
    if (BlocklyGames.errorReporter_.lastHit_ + 10 * 1000 > now) return;
    BlocklyGames.errorReporter_.lastHit_ = now;
    const req = new XMLHttpRequest();
    // Try to use the experimental 'event.error.stack',
    // otherwise, use standard properties.
    const report =
      (event.error && event.error.stack) ||
      `${event.message} ${event.filename} ${event.lineno}:${event.colno}`;
    const params =
      'error=' + encodeURIComponent(report.trim()) + '&url=' + encodeURIComponent(window.location);
    req.open('POST', '/scripts/errorReporter.py');
    req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    req.send(params);
    console.log('Error reported.');
  } catch (e) {
    // Error in error reporter.  Do NOT recursively call the error reporter.
    console.log(event.error);
  }
};
BlocklyGames.errorReporter_.lastHit_ = 0;
if (!BlocklyGames.IS_HTML) {
  window.addEventListener('error', BlocklyGames.errorReporter_);
}

/**
 * Extracts a parameter from the URL.
 * If the parameter is absent default_value is returned.
 * @param {string} name The name of the parameter.
 * @param {string} defaultValue Value to return if parameter not found.
 * @returns {string} The parameter value or the default value if not found.
 */
BlocklyGames.getStringParamFromUrl = function (name, defaultValue) {
  const val = window.location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
  return val ? decodeURIComponent(val[1].replace(/\+/g, '%20')) : defaultValue;
};

/**
 * Extracts an integer parameter from the URL.
 * If the parameter is absent or less than min_value, min_value is
 * returned.  If it is greater than max_value, max_value is returned.
 * @param {string} name The name of the parameter.
 * @param {number} minValue The minimum legal value.
 * @param {number} maxValue The maximum legal value.
 * @returns {number} A number in the range [min_value, max_value].
 */
BlocklyGames.getIntegerParamFromUrl = function (name, minValue, maxValue) {
  const val = Math.floor(Number(BlocklyGames.getStringParamFromUrl(name, 'NaN')));
  return isNaN(val) ? minValue : Math.max(minValue, Math.min(val, maxValue));
};

/**
 * Name of app ('maze', 'bird', ...) for use in local storage.
 * @type string
 */
BlocklyGames.storageName;

/**
 * User Code for the specific session.
 * @type string
 */
BlocklyGames.userCode;

/**
 * Game version.
 * @type number (0: youth, 1: children)
 */
BlocklyGames.skinID;

/**
 * Maximum number of levels.
 */
BlocklyGames.MAX_LEVEL = 13;

/**
 * special Levels
 */
BlocklyGames.CHOICE_LEVEL = 12;
BlocklyGames.DIVERGENT_1 = 7;

BlocklyGames.loadStartTime = function () {
  var startTime = window.localStorage['BlocklyGamesStartTime'];
  return startTime;
};

/**
 * User's level (e.g. 5).
 * @type number
 */
BlocklyGames.LEVEL = BlocklyGames.getIntegerParamFromUrl('level', 1, BlocklyGames.MAX_LEVEL);

/**
 * Common startup tasks for all apps.
 * @param {string} title Text for the page title.
 */
BlocklyGames.init = function (title) {
  document.title = BlocklyGames.getMsg('Games.name', true) + (title && ' : ') + title;

  // Set the HTML's language and direction.
  document.dir = BlocklyGames.IS_RTL ? 'rtl' : 'ltr';
  document.head.parentElement.setAttribute('lang', BlocklyGames.LANG);

  // Populate the language selection menu.
  const languageMenu = BlocklyGames.getElementById('languageMenu');
  if (languageMenu) {
    // Sort languages alphabetically.
    const languages = [];
    for (const lang of BlocklyGames.LANGUAGES_) {
      languages.push([BlocklyGames.LANGUAGE_NAME_[lang], lang]);
    }
    const comp = function (a, b) {
      // Sort based on first argument ('English', 'Русский', '简体字', etc).
      if (a[0] > b[0]) return 1;
      if (a[0] < b[0]) return -1;
      return 0;
    };
    languages.sort(comp);
    languageMenu.options.length = 0;
    for (const [name, iso639] of languages) {
      const option = new Option(name, iso639);
      if (iso639 === BlocklyGames.LANG) {
        option.selected = true;
      }
      languageMenu.options.add(option);
    }
    if (languageMenu.options.length <= 1) {
      // No choices.  Hide the language menu.
      languageMenu.style.display = 'none';
    }
  }

  // Highlight levels that have been completed.
  for (let i = 1; i <= BlocklyGames.MAX_LEVEL; i++) {
    const link = BlocklyGames.getElementById('level' + i);
    const done = !!BlocklyGames.loadFromLocalStorage(
      BlocklyGames.storageName,
      BlocklyGames.userCode,
      i
    );
    if (link && done) {
      link.className += ' level_done';
    }
  }

  // Fixes viewport for small screens.
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport && screen.availWidth < 725) {
    viewport.setAttribute('content', 'width=725, initial-scale=.35, user-scalable=no');
  }
};

/**
 * Once the page is fully loaded, move the messages to their expected locations,
 * then call the game's init function.
 * @param {!Function} init Initialization function to call.
 */
BlocklyGames.callWhenLoaded = function (init) {
  function go() {
    if (!window['BlocklyGamesMsg']) {
      // Messages haven't arrived yet.  Try again later.
      setTimeout(go, 99);
      return;
    }
    if (window['BlocklyMsg']) {
      Blockly.Msg = window['BlocklyMsg'];
    }
    init();
  }

  window.addEventListener('load', go);
};

/**
 * Reload with a different language.
 */
BlocklyGames.changeLanguage = function () {
  const languageMenu = BlocklyGames.getElementById('languageMenu');
  const newLang = encodeURIComponent(languageMenu.options[languageMenu.selectedIndex].value);
  let search = window.location.search;
  if (search.length <= 1) {
    search = '?lang=' + newLang;
  } else if (/[?&]lang=[^&]*/.test(search)) {
    search = search.replace(/([?&]lang=)[^&]*/, '$1' + newLang);
  } else {
    search = search.replace(/\?/, '?lang=' + newLang + '&');
  }

  window.location =
    window.location.protocol + '//' + window.location.host + window.location.pathname + search;
};

/**
 * Attempt to fetch the saved blocks for a level.
 * May be used to simply determine if a level is complete.
 * @param {string} name Name of app (maze, bird, ...).
 * @param {string} userCode Identifier of the specific user (default)
 * @param {number} level Level (1-13).
 * @returns {string|undefined} Serialized XML, or undefined.
 */
BlocklyGames.loadFromLocalStorage = function (name, userCode, level) {
  let xml;
  try {
    xml = window.localStorage[name + userCode + level];
  } catch (e) {
    // Firefox sometimes throws a SecurityError when accessing localStorage.
    // Restarting Firefox fixes this, so it looks like a bug.
  }
  return xml;
};

/**
 * Bind a function to a button's click event.
 * On touch-enabled browsers, ontouchend is treated as equivalent to onclick.
 * @param {Element|string} el Button element or ID thereof.
 * @param {!Function} func Event handler to bind.
 */
BlocklyGames.bindClick = function (el, func) {
  if (!el) {
    throw TypeError('Element not found: ' + el);
  }
  if (typeof el === 'string') {
    el = BlocklyGames.getElementById(el);
  }
  el.addEventListener('click', func, true);
  function touchFunc(e) {
    // Prevent code from being executed twice on touchscreens.
    e.preventDefault();
    func(e);
  }
  el.addEventListener('touchend', touchFunc, true);
};

/**
 * Normalizes an angle to be in range [0-360]. Angles outside this range will
 * be normalized to be the equivalent angle with that range.
 * @param {number} angle Angle in degrees.
 * @returns {number} Standardized angle.
 */
BlocklyGames.normalizeAngle = function (angle) {
  angle %= 360;
  if (angle < 0) {
    angle += 360;
  }
  return angle;
};

/**
 * Get a message from the language pack loaded into BlocklyGamesMsg.
 * @param {string} name Name of message (e.g. 'Index.startOver').
 * @param {boolean} escape Perform HTML escaping, if true.
 * @returns {string} Message string (e.g. 'Want to start over?').
 */
BlocklyGames.getMsg = function (name, escape) {
  let msg = window['BlocklyGamesMsg'][name];
  if (msg === undefined) {
    msg = `[Unknown message: ${name}]`;
  }
  return escape ? BlocklyGames.esc(msg) : msg;
};

/**
 * Escape HTML to make the text safe.
 * @param {string} text Unsafe text, possibly with HTML tags.
 * @returns {string} Safe text, with <>&'" escaped.
 */
BlocklyGames.esc = function (text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

BlocklyGames.timer;

BlocklyGames.startTimer = function () {
  var tick = function () {
    var min = String(Math.trunc(time / 60)).padStart(2, 0);
    var sec = String(time % 60).padStart(2, 0);
    levelData['time'] = min + ':' + sec;
    choiceLevelData['time'] = min + ':' + sec;
    time++;
  };
  var time = 0;

  // Call the timer every second
  tick();
  BlocklyGames.timer = setInterval(tick, 1000);
};

BlocklyGames.countdown = function (elementName, minutes, seconds) {
  var element, endTime, hours, mins, msLeft, time;
  element;
  function twoDigits(n) {
    return n <= 9 ? '0' + n : n;
  }

  function updateTimer() {
    msLeft = endTime - +new Date();
    if (msLeft < 1000) {
      element.innerHTML = '0:00';
      choiceLevelData.submissionType = 'timeout';
      for (var i = 0; i < NUMBER_OF_ANSWERS; i++) {
        var choiceLevelInput = document.getElementById('choiceLevelInput' + (i + 1)).value; // return value of input box
        choiceLevelInput = choiceLevelInput.toUpperCase();
        choiceLevelInputList[i] = choiceLevelInput;
      }
      if (BlocklyGames.LEVEL != BlocklyGames.CHOICE_LEVEL) {saveData();}
      //ToDo: record skip statement
      switchLevel();
      let statement  = generateTimeoutStatement();
      sendStatement(statement);
    } else {
      time = new Date(msLeft);
      hours = time.getUTCHours();
      mins = time.getUTCMinutes();
      element.innerHTML =
        (hours ? hours + ':' + twoDigits(mins) : mins) + ':' + twoDigits(time.getUTCSeconds());
      setTimeout(updateTimer, time.getUTCMilliseconds() + 500);
    }
  }

  element = document.getElementById(elementName);
  endTime = +new Date() + 1000 * (60 * minutes + seconds) + 500;
  updateTimer();
};
