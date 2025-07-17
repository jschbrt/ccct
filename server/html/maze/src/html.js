/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview HTML for Maze game.
 * @author blocklygames@neil.fraser.name (Neil Fraser)
 */
'use strict';

goog.provide('Maze.html');

goog.require('BlocklyGames');
goog.require('BlocklyGames.html');
goog.require('BlocklyInterface');

/**
 * Web page structure.
 * @param {!Object} ij Injected options (e.g. level, skin, kids).
 * @returns {string} HTML.
 */
Maze.html.start = function (ij) {
  // Header bar: title, next-level link, pegman button
  const header = BlocklyGames.html.headerBar(
    ij,
    BlocklyGames.getMsg('Games.maze', true),
    BlocklyInterface.nextLevelParam,
    /* hasLinkButton */ true,
    /* hasHelpButton */ false,
    `<p id="adminButtons">
      <button id="hiddenskipbutton">
        <img src="common/skipw.png" class="skip"> Skip
      </button>
      <button class="secondary" id="clearData"></button>
    </p>
    ` 
  );

  // Level‐specific button row: run, reset, skip, submit
  // introduce a skip button for divergent thinking tasks
  let buttons = ``;
  if ([5, 6, 9, 10, 11].includes(ij.level)) {
    buttons += `
    <table id="table" width="450">
      <tr>
        <td id="buttonTable">
          <button id="runButton" class="primary"
                  title="${BlocklyGames.getMsg('Maze.runTooltip', true)}">
            <img src="common/1x1.gif" class="run icon21">
            ${BlocklyGames.getMsg('Games.runProgram', true)}
          </button>
          <button id="resetButton" class="primary"
                  title="${BlocklyGames.getMsg('Maze.resetTooltip', true)}">
            <img src="common/1x1.gif" class="stop icon21">
            ${BlocklyGames.getMsg('Games.resetProgram', true)}
          </button>
          <button id="skipButton" class="primary"
                  title="Überspringt die Level ohne eine Lösung abzugeben.">
            <img src="common/skipw.png" class="skip"> Überspringen
          </button>
          <button id="submitButton" class="primary"
                  title="${BlocklyGames.getMsg('Games.submitTooltip', true)}">
            <img src="common/submit2.png" class="submit">${BlocklyGames.getMsg(
              'Games.submitProgram',
              true
            )}
          </button>
        </td>
      </tr>
    </table>`;
  } else if (ij.level == 12) {
    buttons = `
    <div id='both-groups'>
    <div id="input-group1">
      <div id='gold'>&#9733;</div>
      <input id='choiceLevelInput1' type="input" maxlength="1" size="1">
    </div>
    <div id="input-group2">
      <div id='silver'>&#9733;</div>
      <input id='choiceLevelInput2' type="input" maxlength="1" size="1">
    </div>
    </div>
    <table id="table" width="450">
      <tr>
        <td id="buttonTableSpecial">
          <button id="submitButton" class="primary"  title="${BlocklyGames.getMsg(
            'Games.submitTooltip',
            true
          )}">
          <img src="common/submit2.png" class="submit"> ${BlocklyGames.getMsg(
            'Games.submitProgram',
            true
          )}
          </button>
        </td>
      </tr>
    </table>`;
  } else {
    buttons = `
    <table id="table" width="450">
      <tr>
        <td id="buttonTable">
          <button id="runButton" class="primary"
                  title="${BlocklyGames.getMsg('Maze.runTooltip', true)}">
            <img src="common/1x1.gif" class="run icon21">
            ${BlocklyGames.getMsg('Games.runProgram', true)}
          </button>
          <button id="resetButton" class="primary"
                  title="${BlocklyGames.getMsg('Maze.resetTooltip', true)}">
            <img src="common/1x1.gif" class="stop icon21">
            ${BlocklyGames.getMsg('Games.resetProgram', true)}
          </button>
          <button id="submitButton" class="primary"
                  title="${BlocklyGames.getMsg('Games.submitTooltip', true)}">
            <img src="common/submit2.png" class="submit"> ${BlocklyGames.getMsg(
              'Games.submitProgram',
              true
            )}
          </button>
        </td>
      </tr>
    </table>`;
  }

  return `
${header}

<div id="visualization">
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1"
       id="svgMaze" width="400px" height="400px">
    <g id="look">
      <path d="M 0,-15 a 15 15 0 0 1 15 15" />
      <path d="M 0,-35 a 35 35 0 0 1 35 35" />
      <path d="M 0,-55 a 55 55 0 0 1 55 55" />
    </g>
  </svg>
  <div id="timeBubble" style='display: none'>
      <div id="time"></div>
  </div>
  <div id="capacityBubble">
    <div id="capacity"></div>
  </div>
</div>

<div id="commandDiv">
  ${buttons}
</div>
${ij.level === 12 ? '' : Maze.html.toolbox_(ij.level, ij.isKids)}
<div id="blockly"></div>

${BlocklyGames.html.dialog()}
${BlocklyGames.html.storageDialog()}

${BlocklyGames.html.doneDialog()}
${BlocklyGames.html.abortDialog()}
${BlocklyGames.html.stopDialog()}
${BlocklyGames.html.stopDialogVisible()}

${Maze.html.helpDialogs_()}
`;
};

/**
 * Toolbox markup for each level.
 * @param {number} level Level number.
 * @returns {string} XML string.
 * @private
 */
Maze.html.toolbox_ = function (level, isKids) {
  let xml = ``;

  if (isKids) {
    xml += `<block type="maze_moveForwardKids"></block>`;
    if (level == 13) {
      xml += `<block type="maze_turn_leftKids"></block>`;
    } else {
      xml += `<block type="maze_turn_leftKids"></block>
      <block type="maze_turn_rightKids"></block>`;
    }
    if ([3, 6, 7, 8, 9, 10, 11].includes(level)) {
      xml += `<block type="controls_repeat_extKids"></block>
      <block type="maze_foreverKids"></block>`;
    }
  } else {
    xml += `<block type="maze_moveForward"></block>`;
    if (level == 13) {
      xml += `<block type="maze_turn_left"></block>`;
    } else {
      xml += `<block type="maze_turn"><field name="DIR">turnLeft</field></block>
      <block type="maze_turn"><field name="DIR">turnRight</field></block>`;
    }
    if ([3, 6, 7, 8, 9, 10, 11].includes(level)) {
      xml += `<block type="controls_repeat_ext"></block>
      <block type="maze_forever"></block>`;
    }
  }

  return `
<xml id="toolbox" xmlns="https://developers.google.com/blockly/xml">
${xml}
</xml>`;
};

/**
 * All help/dialog content (hidden by default).
 * @returns {string} HTML.
 * @private
 */
Maze.html.helpDialogs_ = function () {
  return `
<div id="dialogHelpStack" class="dialogHiddenContent">
  <table>
    <tr>
      <td><img src="common/help.png"></td>
      <td>&nbsp;</td>
      <td>${BlocklyGames.getMsg('Maze.helpStack', true)}</td>
      <td valign="top">
        <img src="maze/help_stack.png" class="mirrorImg" height="63" width="136">
      </td>
    </tr>
  </table>
</div>

<div id="dialogHelpOneTopBlock" class="dialogHiddenContent">
  <table>
    <tr>
      <td><img src="common/help.png"></td>
      <td>&nbsp;</td>
      <td>
        ${BlocklyGames.getMsg('Maze.helpOneTopBlock', true)}
        <div id="sampleOneTopBlock" class="readonly"></div>
      </td>
    </tr>
  </table>
</div>

<div id="dialogHelpRun" class="dialogHiddenContent">
  <table>
    <tr>
      <td>${BlocklyGames.getMsg('Maze.helpRun', true)}</td>
      <td rowspan="2"><img src="common/help.png"></td>
    </tr>
    <tr>
      <td>
        <div>
          <img src="maze/help_run.png" class="mirrorImg" height="27" width="141">
        </div>
      </td>
    </tr>
  </table>
</div>

<div id="dialogHelpReset" class="dialogHiddenContent">
  <table>
    <tr>
      <td>${BlocklyGames.getMsg('Maze.helpReset', true)}</td>
      <td rowspan="2"><img src="common/help.png"></td>
    </tr>
    <tr>
      <td>
        <div>
          <img src="maze/help_run.png" class="mirrorImg" height="27" width="141">
        </div>
      </td>
    </tr>
  </table>
</div>

<div id="dialogHelpRepeat" class="dialogHiddenContent">
  <table>
    <tr>
      <td><img src="maze/help_up.png"></td>
      <td>${BlocklyGames.getMsg('Maze.helpRepeat', true)}</td>
      <td><img src="common/help.png"></td>
    </tr>
  </table>
</div>

<div id="dialogHelpCapacity" class="dialogHiddenContent">
  <table>
    <tr>
      <td><img src="common/help.png"></td>
      <td>&nbsp;</td>
      <td>${BlocklyGames.getMsg('Maze.helpCapacity', true)}</td>
    </tr>
  </table>
</div>

<div id="dialogHelpRepeatMany" class="dialogHiddenContent">
  <table>
    <tr>
      <td><img src="maze/help_up.png"></td>
      <td>${BlocklyGames.getMsg('Maze.helpRepeatMany', true)}</td>
      <td><img src="common/help.png"></td>
    </tr>
  </table>
</div>

<div id="dialogHelpSkins" class="dialogHiddenContent">
  <table>
    <tr>
      <td><img src="common/help.png"></td>
      <td width="95%">${BlocklyGames.getMsg('Maze.helpSkins', true)}</td>
      <td><img src="maze/help_up.png"></td>
    </tr>
  </table>
</div>

<div id="dialogHelpIf" class="dialogHiddenContent">
  <table>
    <tr>
      <td><img src="maze/help_up.png"></td>
      <td>${BlocklyGames.getMsg('Maze.helpIf', true)}</td>
      <td><img src="common/help.png"></td>
    </tr>
  </table>
</div>

<div id="dialogHelpMenu" class="dialogHiddenContent">
  <table>
    <tr>
      <td><img src="maze/help_up.png"></td>
      <td id="helpMenuText">${BlocklyGames.getMsg('Maze.helpMenu', true)}</td>
      <td><img src="common/help.png"></td>
    </tr>
  </table>
</div>

<div id="dialogHelpIfElse" class="dialogHiddenContent">
  <table>
    <tr>
      <td><img src="maze/help_down.png"></td>
      <td>${BlocklyGames.getMsg('Maze.helpIfElse', true)}</td>
      <td><img src="common/help.png"></td>
    </tr>
  </table>
</div>

<div id="dialogHelpWallFollow" class="dialogHiddenContent">
  <table>
    <tr>
      <td><img src="common/help.png"></td>
      <td>
        ${BlocklyGames.getMsg('Maze.helpWallFollow', true)}
        ${BlocklyGames.html.ok()}
      </td>
    </tr>
  </table>
</div>
`;
};
