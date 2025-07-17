/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Common HTML snippets.
 * @author blocklygames@neil.fraser.name (Neil Fraser)
 */
'use strict';

goog.provide('BlocklyGames.html');

goog.require('Blockly.Msg');
goog.require('BlocklyGames');


const beeMsg = 
{
a:
"Level 1 bis 4 sind zum Üben.\nHilf der Biene zum Honig!\nNimm die bunten Blöcke und baue den Weg.\nDu hast für diese Levels insgesamt 10 Minuten Zeit.\nDrück auf „Testen“.\nDann siehst du, ob es klappt.\nDrück auf „Abgeben“, wenn es fertig ist.\nViel Spaß! 🐝🍯",
b:
"Level 5 und 6 sind ein bisschen schwerer.\nDer Weg ist nicht so einfach.\nHilf der Biene!\nGib ihr die richtigen Blöcke.\nSo findet sie den Weg zum Honig.\nDu hast für diese Levels insgesamt 6 Minuten Zeit.\nDrück auf „Testen“, um zu schauen.\nDrück auf „Abgeben“, wenn es fertig ist.\nDu schaffst das! 🐝🍯",
c:
"Level 7 bis 11\nDas Labyrinth bleibt gleich.\nAber der Weg ändert sich!\nBringe die Biene jedes Mal anders zum Honig.\nProbiere in jedem Level einen neuen Weg!\nNimm die bunten Blöcke.\nDu hast für diese Levels insgesamt 10 Minuten Zeit.\nDrück auf „Testen“.\nDann auf „Abgeben“.\nViel Glück! 🐝🍯",
d:
"Level 12\nDu hast viele Lösungen gemacht.\nJetzt sag uns:\nWelche Lösung findest du am besten?\nWelche ist auch gut?\nSchreib die Nummer in die Kästchen:\n🟨 Gold = die beste Lösung\n⬜ Silber = die zweitbeste Lösung\nDu hast für dieses Level 2 Minuten Zeit.\nDanke! 😊🐝",
e:
"Level 13 – das letzte Level!\nDie Biene will zum Honig.\nAber: Es gibt nur wenige Blöcke!\nKannst du trotzdem den Weg finden?\nDenk gut nach und probier es aus!\nDu hast für dieses Level 4 Minuten Zeit.\nViel Glück! 🐝🍯🌟"
}

const astroMsg = 
{
a:
"Level 1 bis 4 sind zum Üben.\nHilf der Astronautin zum Raumschiff!\nNimm die bunten Blöcke und baue den Weg.\nDu hast für diese Levels insgesamt 10 Minuten Zeit.\nDrück auf „Testen“.\nDann siehst du, ob es klappt.\nDrück auf „Abgeben“, wenn es fertig ist.\nViel Spaß! 🚀",
b:
"Level 5 und 6 sind ein bisschen schwerer.\nDer Weg ist nicht so einfach.\nHilf der Astronautin!\nGib ihr die richtigen Blöcke.\nSo findet sie den Weg zum Raumschiff.\nDu hast für diese Levels insgesamt 6 Minuten Zeit.\nDrück auf „Testen“, um zu schauen.\nDrück auf „Abgeben“, wenn es fertig ist.\nDu schaffst das! 🚀",
c:
"Level 7 bis 11\nDas Labyrinth bleibt gleich.\nAber der Weg ändert sich!\nBringe die Astronautin jedes Mal anders zum Raumschiff.\nProbiere in jedem Level einen neuen Weg!\nNimm die bunten Blöcke.\nDu hast für diese Levels insgesamt 10 Minuten Zeit.\nDrück auf „Testen“.\nDann auf „Abgeben“.\nViel Glück! 🚀",
d:
"Level 12\nDu hast viele Lösungen gemacht.\nJetzt sag uns:\nWelche Lösung findest du am besten?\nWelche ist auch gut?\nSchreib die Nummer in die Kästchen:\n🟨 Gold = die beste Lösung\n⬜ Silber = die zweitbeste Lösung\nDu hast für dieses Level 2 Minuten Zeit.\nDanke! 😊🚀",
e:
"Level 13 – das letzte Level!\nDie Astronautin will zum Raumschiff.\nAber: Es gibt nur wenige Blöcke!\nKannst du trotzdem den Weg finden?\nDenk gut nach und probier es aus!\nDu hast für dieses Level 4 Minuten Zeit.\nViel Glück! 🚀🌟"
}

//TODO: 

/**
 * Top toolbar for page
 * @param {!Object} ij Injected options.
 * @param {string} appName Name of application.
 * @param {string} levelLinkSuffix Any extra parameters for links.
 * @param {boolean} hasLinkButton Whether the page has a link button.
 * @param {boolean} hasHelpButton Whether the page has a help button.
 * @param {string} farLeftHtml Additional content to add to farLeft toolbar.
 * @returns {string} HTML.
 */
BlocklyGames.html.headerBar = function (
  ij,
  appName,
  levelLinkSuffix,
  hasLinkButton,
  hasHelpButton,
  farLeftHtml
) {
  let linkButton = '';
  if (hasLinkButton) {
    linkButton = `
&nbsp;
<button id="linkButton" title="${BlocklyGames.getMsg('Games.linkTooltip', true)}">
  <img src="common/1x1.gif" class="link icon21">
</button>
`;
  }
  let helpButton = '';
  if (hasHelpButton) {
    helpButton = `
&nbsp;
<button id="helpButton">${BlocklyGames.getMsg('Games.help', true)}</button>
`;
  }
  if (farLeftHtml) {
    farLeftHtml = ' &nbsp; ' + farLeftHtml;
  }
  return `
<table width="100%">
  <tr>
    <td>
      <h1>
        ${BlocklyGames.html.titleSpan_(ij, appName)}
        ${ij.level ? BlocklyGames.html.levelLinks_(ij, levelLinkSuffix) : ''}
      </h1>
    </td>
    <td id="header_cta" class="farSide">
      <select id="languageMenu"></select>
      ${linkButton}
      ${helpButton}
      ${farLeftHtml}
    </td>
  </tr>
</table>
`;
};

/**
 * Print the title span (Blockly Games : AppName).
 * @param {!Object} ij Injected options.
 * @param {string} appName Name of application.
 * @returns {string} HTML.
 * @private
 */
BlocklyGames.html.titleSpan_ = function (ij, appName) {
  return `
<span id="title">
  ${BlocklyGames.getMsg('Games.name', true)}
`;
};

/**
 * List of links to other levels.
 * @param {!Object} ij Injected options.
 * @param {string} suffix Any extra parameters for links.
 * @returns {string} HTML.
 * @private
 */
BlocklyGames.html.levelLinks_ = function (ij, suffix) {
  let html = ' &nbsp ';
  for (let i = 1; i <= ij.maxLevel; i++) {
    let url = `?lang=${ij.lang}&level=${i}`;
    if (suffix) {
      url += '&' + suffix;
    }
    html += ' ';
    if (i === ij.level) {
      html += `<span class="level_number level_done" id="level${i}">${i}</span>`;
    } else if (i === ij.maxLevel) {
      html += `<a class="level_number" id="level${i}" href="${url}">${i}</a>`;
    } else {
      html += `<a class="level_dot" id="level${i}" href="${url}"></a>`;
    }
  }
  return html;
};

/**
 * Dialogs.
 * @returns {string} HTML.
 */
BlocklyGames.html.dialog = function () {
  return `
<div id="dialogShadow" class="dialogAnimate"></div>
<div id="dialogBorder"></div>
<div id="dialog"></div>
`;
};

/**
 * Done dialog.
 * @returns {string} HTML.
 */
BlocklyGames.html.doneDialog = function () {
  return `
    <div id="dialogDone" class="dialogHiddenContent">
    <div style="font-size: large; margin: 1em; color: purple;">{{msg meaning="Games.congratulations" desc="alert - This is displayed when the user solves the level.\n{lb}{lb}Identical|Congratulation{rb}{rb}"}}Congratulations!{{/msg}}</div>
    <div id="finalImageDiv">
      <img id="finalImage">
      <div id="dialogDoneText" style="font-size: large; margin: 1em;">Vielen Dank für deine Teilnahme. </br> Das hast Du super gemacht.</div>
    </div>
    <div id="dialogDoneButtons" class="farSide" style="padding: 1ex 3ex 0">
      <button id="doneOk" class="secondary">
        {{msg meaning="Games.dialogOk" desc="IBID"}}OK{{/msg}}
      </button>
    </div>
  </div>
<div id="dialogDone" class="dialogHiddenContent">
  <div class="large">${BlocklyGames.getMsg('Games.congratulations', true)}</div>
  <div id="finalImageDiv">
  <img id="finalImage">
  <div id="dialogDoneText" style="font-size: large; margin: 1em;">Vielen Dank für deine Teilnahme. </br> Das hast Du super gemacht.</div>
    </div>
  <div id="dialogDoneButtons" class="farSide farSideButtons">
    <button class="addHideHandler">${BlocklyGames.esc(Blockly.Msg['DIALOG_CANCEL'])}</button>
    <button id="doneOk" class="secondary">${BlocklyGames.esc(Blockly.Msg['DIALOG_OK'])}</button>
  </div>
</div>
`;
};

/**
 * Stop dialog
 * TODO: add skin and level parameters
 */
BlocklyGames.html.stopDialog = function () {
// rewrite to give a message according to the level either from beeMsg or astroMsg depending on the skin
  let msg = '';
  let skin = 0; // default skin
  // get skin from url parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('skin')) {
    skin = parseInt(urlParams.get('skin'), 10);
  } else {
    skin = 0; // default skin
  } 
  const level = parseInt(urlParams.get('level'), 10) || 1; // default level is 1
  if (skin === 1) {
    if (level === 1) {
      msg = beeMsg.a;
    } else if (level === 5) {
      msg = beeMsg.b;
    } else if (level === 7) {
      msg = beeMsg.c;
    } else if (level === 12) {
      msg = beeMsg.d;
    } else if (level === 13) {
      msg = beeMsg.e;
    }
  } else if (skin === 0) {
    if (level === 1) {
      msg = astroMsg.a;
    } else if (level === 5) {
      msg = astroMsg.b;
    } else if (level === 7) {
      msg = astroMsg.c;
    } else if (level === 12) {
      msg = astroMsg.d;
    } else if (level === 13) {
      msg = astroMsg.e;
    }
  } else {
    msg = 'Unbekanntes Level';
  }

  return `
  <div id="dialogStop" class="dialogHiddenContent">
    <div id="stopMessageDiv">
      <div id="dialogStopText2">${msg}</div>
    </div>
    <div id="dialogStopButtons" class="center" style="padding: 1ex 3ex 0">
      <button id="stopOK" class="stop">Weiter</button>
    </div>
  </div>
  `;
};

/**
 * Stop dialog visible
 */
BlocklyGames.html.stopDialogVisible = function () {
  return `
  <div id="dialogStopVisible" class="dialogHiddenContent">
    <div id="stopImageDiv">
    <img id="stopImage" src="common/stop.png">
      <div id="dialogStopText2">Es geht erst dann weiter, </br> wenn Du dazu aufgefordert wirst.</div>
    </div>
    <div id="dialogStopButtonsVisible" class="center" style="padding: 1ex 3ex 0">
      <button id="stopOKVisible" class="stop">Weiter</button>
    </div>
  </div>
  `;
};

/**
 * Abort dialog.
 * @returns {string} HTML.
 */
BlocklyGames.html.abortDialog = function () {
  return `
<div id="dialogAbort" class="dialogHiddenContent">
  <div id="abortImageDiv">
    <img id="abortImage" src="common/stop.png">
      <div id="dialogAbortText2">Da keine Ergebnisse vorliegen, </br> musst Du dieses Level Ü.</div>
  </div>
    <div id="dialogAbortButtons" class="center" style="padding: 1ex 3ex 0">
      <button id="abortOK" class="stop">Weiter</button>
    </div>
</div>
`;
};

/**
 * Storage dialog.
 * @returns {string} HTML.
 */
BlocklyGames.html.storageDialog = function () {
  return `
<div id="dialogStorage" class="dialogHiddenContent">
  <div id="containerStorage"></div>
  ${BlocklyGames.html.ok()}
</div>
`;
};

/**
 * OK button for dialogs.
 * @returns {string} HTML.
 */
BlocklyGames.html.ok = function () {
  return `
<div class="farSide farSideButtons">
  <button class="secondary addHideHandler">${BlocklyGames.esc(Blockly.Msg['DIALOG_OK'])}</button>
</div>
`;
};
