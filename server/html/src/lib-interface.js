/**
 * @license
 * Copyright 2013 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Common support code for games that embed Blockly.
 * @author blocklygames@neil.fraser.name (Neil Fraser)
 */
'use strict';

goog.provide('BlocklyInterface');

goog.require('Blockly');
goog.require('Blockly.ContextMenuItems');
goog.require('Blockly.geras.Renderer');
goog.require('Blockly.ShortcutItems');
goog.require('Blockly.Xml');
goog.require('BlocklyGames');
goog.require('BlocklyStorage');
goog.require('Blockly.Warning');

/**
 * Blockly's main workspace.
 * @type Blockly.WorkspaceSvg
 */
BlocklyInterface.workspace = null;

/**
 * Text editor (used as an alternative to Blockly in advanced apps).
 * @type Object
 */
BlocklyInterface.editor = null;

/**
 * Is the blocks editor disabled due to the JS editor having control?
 * @type boolean
 */
BlocklyInterface.blocksDisabled = false;

/**
 * User's code (XML or JS) from the editor (Blockly or ACE) from previous
 * execution.
 * @type string
 */
BlocklyInterface.executedCode = '';

/**
 * Additional parameter to append when moving to next level.
 * @type string
 */
BlocklyInterface.nextLevelParam = '';

/**
 * Common startup tasks for all apps.
 * @param {string} title Text for the page title.
 */
BlocklyInterface.init = function (title) {
  BlocklyGames.init(title);

  // Disable the link button if page isn't backed by App Engine storage.
  const linkButton = BlocklyGames.getElementById('linkButton');
  if (linkButton) {
    if (!BlocklyGames.IS_HTML) {
      BlocklyStorage.getCode = BlocklyInterface.getCode;
      BlocklyStorage.setCode = BlocklyInterface.setCode;
      BlocklyGames.bindClick(linkButton, BlocklyStorage.link);
    } else {
      linkButton.style.display = 'none';
    }
  }

  const languageMenu = BlocklyGames.getElementById('languageMenu');
  if (languageMenu) {
    languageMenu.addEventListener('change', BlocklyInterface.changeLanguage, true);
  }
};

/**
 * Load blocks saved on App Engine Storage or in session/local storage.
 * @param {string} defaultXml Text representation of default blocks.
 * @param {boolean|!Function} inherit If true or a function, load blocks from
 *     previous level.  If a function, call it to modify the inherited blocks.
 */
BlocklyInterface.loadBlocks = function (defaultXml, inherit) {
  if (!BlocklyGames.IS_HTML && window.location.hash.length > 1) {
    // An href with #key triggers an AJAX call to retrieve saved blocks.
    BlocklyStorage.retrieveXml(BlocklyGames.storageName, window.location.hash.substring(1));
    return;
  }

  // Language switching stores the blocks during the reload.
  let loadOnce;
  try {
    loadOnce = window.sessionStorage.loadOnceBlocks;
  } catch (e) {
    // Firefox sometimes throws a SecurityError when accessing sessionStorage.
    // Restarting Firefox fixes this, so it looks like a bug.
  }
  if (loadOnce) {
    delete window.sessionStorage.loadOnceBlocks;
  }

  const savedLevel = BlocklyGames.loadFromLocalStorage(
    BlocklyGames.storageName,
    BlocklyGames.userCode,
    BlocklyGames.LEVEL
  );
  let inherited =
    inherit && BlocklyGames.loadFromLocalStorage(BlocklyGames.storageName, BlocklyGames.userCode, BlocklyGames.LEVEL - 1);
  if (inherited && typeof inherit === 'function') {
    inherited = inherit(inherited);
  }

  const restore = loadOnce || savedLevel || inherited || defaultXml;
  if (restore) {
    BlocklyInterface.setCode(restore);
  }
};

/**
 * Set the given code (XML or JS) to the editor (Blockly or ACE).
 * @param {string} code XML or JS code.
 */
BlocklyInterface.setCode = function (code) {
  if (BlocklyInterface.editor) {
    // Text editor.
    BlocklyInterface.editor['setValue'](code, -1);
  } else {
    // Blockly editor.
    const xml = Blockly.Xml.textToDom(code);
    // Clear the workspace to avoid merge.
    BlocklyInterface.workspace.clear();
    Blockly.Xml.domToWorkspace(xml, BlocklyInterface.workspace);
    BlocklyInterface.workspace.clearUndo();
  }
};

/**
 *  Set Code for maze choice
 */

/**
 * Load blocks saved on App Engine Storage or in session/local storage.
 * @param {string} defaultXml Text representation of default blocks.
 * @param {boolean|!Function} inherit If true or a function, load blocks from
 * @param {string} codeNumber Number / Letter of the Code choice
 *     previous level.  If a function, call it to modify the inherited blocks.
 */
BlocklyInterface.loadMazeChoice = function (defaultXml, inherit, codeNumber) {
  if (!BlocklyGames.IS_HTML && window.location.hash.length > 1) {
    // An href with #key triggers an AJAX call to retrieve saved blocks.
    BlocklyStorage.retrieveXml(window.location.hash.substring(1));
    return;
  }

  // Language switching stores the blocks during the reload.
  var loadOnce = null;
  try {
    loadOnce = window.sessionStorage.loadOnceBlocks;
  } catch (e) {
    // Firefox sometimes throws a SecurityError when accessing sessionStorage.
    // Restarting Firefox fixes this, so it looks like a bug.
  }
  if (loadOnce) {
    delete window.sessionStorage.loadOnceBlocks;
  }

  var restore = defaultXml;
  if (restore) {
    BlocklyInterface.setMazeChoice(restore, codeNumber);
  }
};

/**
 * Decode an XML DOM and create blocks on the workspace. Position the new
 * blocks immediately below prior blocks, aligned by their starting edge.
 * @param {!Element} xml The XML DOM.
 * @param {!Blockly.Workspace} workspace The workspace to add to.
 * @return {!Array<string>} An array containing new block IDs.
 */
BlocklyInterface.appendToWorkspace = function (xml, workspace, warningText) {
  var bbox; // Bounding box of the current blocks.
  // First check if we have a workspaceSvg, otherwise the blocks have no shape
  // and the position does not matter.
  if (Object.prototype.hasOwnProperty.call(workspace, 'scale')) {
    bbox = workspace.getBlocksBoundingBox();
  }
  // Load the new blocks into the workspace and get the IDs of the new blocks.
  var newBlockIds = Blockly.Xml.domToWorkspace(xml, workspace);
  if (bbox && bbox.top != bbox.bottom) {
    // check if any previous block
    var offsetY = 0; // offset to add to y of the new block
    var offsetX = 0;
    var topY = bbox.top; // top position
    var rightX = bbox.right; // x of bounding box
    // Check position of the new blocks.
    var newLeftX = Infinity; // x of top left corner
    var newRightX = -Infinity; // x of top right corner
    var newY = Infinity; // y of top corner
    var xSeparation = 30;
    for (var i = 0; i < newBlockIds.length; i++) {
      var blockXY = workspace.getBlockById(newBlockIds[i]).getRelativeToSurfaceXY();
      if (blockXY.y < newY) {
        newY = blockXY.y;
      }
      if (blockXY.x < newLeftX) {
        // if we left align also on x
        newLeftX = blockXY.x;
      }
      if (blockXY.x > newRightX) {
        // if we right align also on x
        newRightX = blockXY.x;
      }
    }
    offsetX = rightX + newRightX + xSeparation;
    offsetY = topY;
    for (var i = 0; i < newBlockIds.length; i++) {
      var block = workspace.getBlockById(newBlockIds[i]);
      block.moveBy(offsetX, 40);
    }
  } else {
    var block = workspace.getBlockById(newBlockIds);
    block.moveBy(0, 40);
  }
  var block = workspace.getBlockById(newBlockIds);
  block.setWarningText(warningText);
  block.warning.setVisible(true);
  return newBlockIds;
};

/**
 * Set the given maze choice code (XML or JS) to the editor (Blockly or ACE).
 * @param {string} code XML or JS code.
 */
BlocklyInterface.setMazeChoice = function (code, codeNumber) {
  if (BlocklyInterface.editor) {
    // Text editor.
    BlocklyInterface.editor['setValue'](code, -1);
  } else {
    // Blockly editor.
    var xml = Blockly.Xml.textToDom(code);
    // Clear the workspace to avoid merge.
    //BlocklyInterface.workspace.clear();
    const blockId = BlocklyInterface.appendToWorkspace(xml, BlocklyInterface.workspace, codeNumber);
    BlocklyInterface.workspace.clearUndo();
  }
};

/**
 * Get the user's code (XML or JS) from the editor (Blockly or ACE).
 * @returns {string} XML or JS code.
 */
BlocklyInterface.getCode = function () {
  let text;
  if (BlocklyInterface.blocksDisabled) {
    // Text editor.
    text = BlocklyInterface.editor['getValue']();
  } else {
    // Blockly editor.
    const xml = Blockly.Xml.workspaceToDom(BlocklyInterface.workspace, true);
    // Remove x/y coordinates from XML if there's only one block stack.
    // There's no reason to store this, removing it helps with anonymity.
    if (BlocklyInterface.workspace.getTopBlocks(false).length === 1 && xml.querySelector) {
      const block = xml.querySelector('block');
      if (block) {
        block.removeAttribute('x');
        block.removeAttribute('y');
      }
    }
    text = Blockly.Xml.domToText(xml);
  }
  return text;
};

/**
 * Monitor the block or JS editor.  If a change is made that changes the code,
 * clear the key from the URL.
 */
BlocklyInterface.codeChanged = function () {
  if (
    BlocklyStorage.startCode !== null &&
    BlocklyStorage.startCode !== BlocklyInterface.getCode()
  ) {
    window.location.hash = '';
    BlocklyStorage.startCode = null;
  }
};

/**
 * Inject Blockly workspace into page.
 * @param {!Object} options Dictionary of Blockly options.
 */
BlocklyInterface.injectBlockly = function (options) {
  const toolbox = BlocklyGames.getElementById('toolbox');
  if (toolbox) {
    options['toolbox'] = toolbox;
  }
  options['media'] = 'third-party/blockly/media/';
  options['oneBasedIndex'] = false;
  BlocklyInterface.workspace = Blockly.inject('blockly', options);
  BlocklyInterface.workspace.addChangeListener(BlocklyInterface.codeChanged);
};

/**
 * Save the blocks/JS for this level to persistent client-side storage.
 */
BlocklyInterface.saveSkipToLocalStorage = function (level) {
  // MSIE 11 does not support localStorage on file:// URLs.
  if (typeof Blockly == undefined || !window.localStorage) {
    return;
  }
  // TODO: should skipped be marked as skipped in user interface?
  //var name = BlocklyGames.storageName + level;
  //window.localStorage[name] = BlocklyInterface.executedCode;
};

/**
 * Save the blocks/JS for this level to persistent client-side storage.
 */
BlocklyInterface.saveToLocalStorage = function () {
  // MSIE 11 does not support localStorage on file:// URLs.
  if (!window.localStorage) {
    return;
  }
  const name = BlocklyGames.storageName + BlocklyGames.userCode + BlocklyGames.LEVEL;
  window.localStorage[name] = BlocklyInterface.executedCode;
};

/**
 * Save choice level data to local storage
 */
BlocklyInterface.saveChoiceLevelToLocalStorage = function (choiceLevelData) {
  var name = BlocklyGames.storageName + BlocklyGames.userCode + BlocklyGames.LEVEL;
  window.localStorage[name] = choiceLevelData; // save choiceLevelData to local storage
};

/**
 * Encode and decode special characters of XML for saving in MYSQL
 */
var xml_special_to_escaped_one_map = {
  '&': '&amp;',
  '"': '&quot;',
  '<': '&lt;',
  '>': '&gt;',
};

var escaped_one_to_xml_special_map = {
  '&amp;': '&',
  '&quot;': '"',
  '&lt;': '<',
  '&gt;': '>',
};

BlocklyInterface.encodeXml = function (string) {
  return string.replace(/([\&"<>])/g, function (str, item) {
    return xml_special_to_escaped_one_map[item];
  });
};

BlocklyInterface.decodeXml = function (string) {
  return string.replace(/(&quot;|&lt;|&gt;|&amp;)/g, function (str, item) {
    return escaped_one_to_xml_special_map[item];
  });
};

/**
 * Go to the index page.
 */
BlocklyInterface.indexPage = function () {
  window.location = (BlocklyGames.IS_HTML ? 'index.html' : './') + '?lang=' + BlocklyGames.LANG;
};

/**
 * Save the blocks/code for a one-time reload.
 */
BlocklyInterface.saveToSessionStorage = function () {
  // Store the blocks for the duration of the reload.
  // MSIE 11 does not support sessionStorage on file:// URLs.
  if (window.sessionStorage) {
    window.sessionStorage.loadOnceBlocks = BlocklyInterface.getCode();
  }
};

/**
 * Save the blocks and reload with a different language.
 */
BlocklyInterface.changeLanguage = function () {
  BlocklyInterface.saveToSessionStorage();
  BlocklyGames.changeLanguage();
};

/**
 * Go to the next level.
 */
BlocklyInterface.nextLevel = function () {
  if (BlocklyGames.LEVEL < BlocklyGames.MAX_LEVEL) {
    window.location =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      '?lang=' +
      BlocklyGames.LANG +
      '&level=' +
      (BlocklyGames.LEVEL + 1) +
      BlocklyInterface.nextLevelParam + 
      '&user=' +
      BlocklyGames.userCode;
  } else {
    BlocklyDialogs.finish();
  }
};

BlocklyInterface.skipLevel = function (level) {
  if (level == 5 || level == 6) {
    BlocklyInterface.saveSkipToLocalStorage(i);
    window.location =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      '?lang=' +
      BlocklyGames.LANG +
      '&level=' +
      (level + 1);
  } else {
    for (var i = level; i < 12; i++) {
      BlocklyInterface.saveSkipToLocalStorage(i);
    }
    window.location =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      '?lang=' +
      BlocklyGames.LANG +
      '&level=' +
      12;
  }
};

/**
 * Inject readonly Blockly.  Only inserts once.
 * @param {string} id ID of div to be injected into.
 * @param {string|!Array<string>} xml XML string(s) describing blocks.
 */
BlocklyInterface.injectReadonly = function (id, xml) {
  const div = BlocklyGames.getElementById(id);
  if (!div.firstChild) {
    const workspace = Blockly.inject(div, { rtl: BlocklyGames.IS_RTL, readOnly: true });
    if (typeof xml !== 'string') {
      xml = xml.join('');
    }
    Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), workspace);
  }
};

/**
 * Determine if this event is unwanted.
 * @param {!Event} e Mouse or touch event.
 * @returns {boolean} True if spam.
 */
BlocklyInterface.eventSpam = function (e) {
  // Touch screens can generate 'touchend' followed shortly thereafter by
  // 'click'.  For now, just look for this very specific combination.
  // Some devices have both mice and touch, but assume the two won't occur
  // within two seconds of each other.
  const touchMouseTime = 2000;
  if (
    e.type === 'click' &&
    BlocklyInterface.eventSpam.previousType_ === 'touchend' &&
    BlocklyInterface.eventSpam.previousDate_ + touchMouseTime > Date.now()
  ) {
    e.preventDefault();
    e.stopPropagation();
    return true;
  }
  // Users double-click or double-tap accidentally.
  const doubleClickTime = 400;
  if (
    BlocklyInterface.eventSpam.previousType_ === e.type &&
    BlocklyInterface.eventSpam.previousDate_ + doubleClickTime > Date.now()
  ) {
    e.preventDefault();
    e.stopPropagation();
    return true;
  }
  BlocklyInterface.eventSpam.previousType_ = e.type;
  BlocklyInterface.eventSpam.previousDate_ = Date.now();
  return false;
};

BlocklyInterface.eventSpam.previousType_ = null;
BlocklyInterface.eventSpam.previousDate_ = 0;
