/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview JavaScript for Maze game.
 * @author blocklygames@neil.fraser.name (Neil Fraser)
 */
'use strict';

goog.provide('Maze');

goog.require('Blockly');
goog.require('Blockly.browserEvents');
goog.require('Blockly.FieldDropdown');
goog.require('Blockly.JavaScript');
goog.require('Blockly.Trashcan');
goog.require('Blockly.utils.dom');
goog.require('Blockly.utils.math');
goog.require('Blockly.utils.string');
goog.require('Blockly.VerticalFlyout');
goog.require('Blockly.Xml');
goog.require('BlocklyCode');
goog.require('BlocklyDialogs');
goog.require('BlocklyGames');
goog.require('BlocklyInterface');
goog.require('Maze.Blocks');
goog.require('Maze.html');

BlocklyGames.storageName = 'maze';

var timer;
var submitPressed = false; // for Maze.animate
var NUMBER_OF_ANSWERS = 0; // amout of choices made in divergent task
var LETTERS_USED = []; // which letters have been used
var choiceLevelInputList = []; //input of in choice level

const MAX_BLOCKS = [
  Infinity,
  Infinity,
  Infinity,
  Infinity,
  Infinity,
  Infinity,
  Infinity,
  Infinity,
  Infinity,
  Infinity,
][BlocklyGames.LEVEL - 1];
// Crash type constants.
const CRASH_STOP = 1;
const CRASH_SPIN = 2;
const CRASH_FALL = 3;

const SKINS = [
  // sprite: A 1029x51 set of 21 avatar images.
  // tiles: A 250x200 set of 20 map images.
  // background: An optional 400x450 background image, or false.
  // look: Colour of sonar-like look icon.
  // winSound: List of sounds (in various formats) to play when the player wins.
  // crashSound: List of sounds (in various formats) for player crashes.
  // crashType: Behaviour when player crashes (stop, spin, or fall).
  {
    sprite: 'maze/astro.png',
    tiles: 'maze/tiles_astro.png',
    background: 'maze/bg_astro.jpg',
    // Coma star cluster, photo by George Hatfield, used with permission.
    look: '#fff',
    //winSound: ['maze/win.mp3', 'maze/win.ogg'],
    //crashSound: ['maze/fail_astro.mp3', 'maze/fail_astro.ogg'],
    crashType: CRASH_SPIN,
  },
  {
    sprite: 'maze/bee4.png',
    tiles: 'maze/tiles_bee_4.png',
    marker: 'maze/marker_honey2.png',
    markerBlock: 'maze/marker_honeyblock.png',
    background: 'maze/bg_bee.png',
    look: '#000',
    //winSound: ['maze/win.mp3', 'maze/win.ogg'],
    //crashSound: ['maze/fail_astro.mp3', 'maze/fail_astro.ogg'],
    crashType: CRASH_FALL,
  },
  {
    sprite: 'maze/pegman.png',
    tiles: 'maze/tiles_pegman.png',
    background: false,
    look: '#000',
    //winSound: ['maze/win.mp3', 'maze/win.ogg'],
    //crashSound: ['maze/fail_pegman.mp3', 'maze/fail_pegman.ogg'],
    crashType: CRASH_STOP,
  },
  {
    sprite: 'maze/panda.png',
    tiles: 'maze/tiles_panda.png',
    background: 'maze/bg_panda.jpg',
    // Spring canopy, photo by Rupert Fleetingly, CC licensed for reuse.
    look: '#000',
    winSound: ['maze/win.mp3', 'maze/win.ogg'],
    crashSound: ['maze/fail_panda.mp3', 'maze/fail_panda.ogg'],
    crashType: CRASH_FALL,
  },
];
const SKIN_ID = BlocklyGames.getIntegerParamFromUrl('skin', 0, SKINS.length - 1);
const SKIN = SKINS[SKIN_ID];
const IS_KIDS_VERSION = Boolean(SKIN_ID); // if true, its the 1-2graders version

/**
 * The types of squares in the maze, which is represented
 * as a 2D array of SquareType values.
 * @enum {number}
 */
const SquareType = {
  WALL: 0,
  OPEN: 1,
  START: 2,
  FINISH: 3,
};

// The maze square constants defined above are inlined here
// for ease of reading and writing the static mazes.
const map = [
  // Item 1. Training 1 - Normal Perspective
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 3, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 2, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Item 2. Training 2 - No-For-Loop
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 2, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Item 3. Training 3 - For-Loop
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 2, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Item 4. Training 4 - Switched Perspective
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 2, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 3, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Item 5. Intro 1 - Astronaut looking EAST
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 2, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 3, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Item 6. Intro 2 - For-Loop and Switched Perspective
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 2, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 3, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Item 7. Divergent Task 1
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 3, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 2, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Item 8. Divergent Task 2
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 3, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 2, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Item 9. Divergent Task 3
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 3, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 2, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Item 10. Divergent Task 4
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 3, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 2, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Item 11. Divergent Task 5
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 3, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 2, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Item 12. Multiple Choice wrt Divergent Task 1 -> special level!
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 3, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 2, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Divergent Task 2 MISSING TODO?
  // Item 13. No only L not R allowed
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 2, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
][BlocklyGames.LEVEL - 1];

/**
 * Measure maze dimensions and set sizes.
 * ROWS: Number of tiles down.
 * COLS: Number of tiles across.
 * SQUARE_SIZE: Pixel height and width of each maze square (i.e. tile).
 */
const ROWS = map.length;
const COLS = map[0].length;
const SQUARE_SIZE = 50;
const PEGMAN_HEIGHT = 52;
const PEGMAN_WIDTH = 49;

const MAZE_WIDTH = SQUARE_SIZE * COLS;
const MAZE_HEIGHT = SQUARE_SIZE * ROWS;
const PATH_WIDTH = SQUARE_SIZE / 3;

/**
 * Constants for cardinal directions.  Subsequent code assumes these are
 * in the range 0..3 and that opposites have an absolute difference of 2.
 * @enum {number}
 */
const DirectionType = {
  NORTH: 0,
  EAST: 1,
  SOUTH: 2,
  WEST: 3,
};

/**
 * Outcomes of running the user program.
 */
const ResultType = {
  UNSET: 0,
  SUCCESS: 1,
  FAILURE: -1,
  TIMEOUT: 2,
  ERROR: -2,
};

/**
 * Result of last execution.
 */
let result = ResultType.UNSET;

/**
 * Starting direction.
 */
let startDirection = [
  DirectionType.NORTH, // Item 1
  DirectionType.NORTH, // Item 2
  DirectionType.NORTH, // Item 3
  DirectionType.WEST, // Item 4
  DirectionType.EAST, // Item 5
  DirectionType.SOUTH, // Item 6
  DirectionType.NORTH, // Item 7
  DirectionType.NORTH, // Item 8
  DirectionType.NORTH, // Item 9
  DirectionType.NORTH, // Item 10
  DirectionType.NORTH, // Item 11
  DirectionType.NORTH, // Item 12
  DirectionType.NORTH, // Item 13
][BlocklyGames.LEVEL - 1];
/**
 * PIDs of animation tasks currently executing.
 * @type !Array<number>
 */
const pidList = [];

// Map each possible shape to a sprite.
// Input: Binary string representing Centre/North/West/South/East squares.
// Output: [x, y] coordinates of each tile's sprite in tiles.png.
const tile_SHAPES = {
  10010: [4, 0], // Dead ends
  10001: [3, 3],
  11000: [0, 1],
  10100: [0, 2],
  11010: [4, 1], // Vertical
  10101: [3, 2], // Horizontal
  10110: [0, 0], // Elbows
  10011: [2, 0],
  11001: [4, 2],
  11100: [2, 3],
  11110: [1, 1], // Junctions
  10111: [1, 0],
  11011: [2, 1],
  11101: [1, 2],
  11111: [2, 2], // Cross
  null0: [4, 3], // Empty
  null1: [3, 0],
  null2: [3, 1],
  null3: [0, 3],
  null4: [1, 3],
};

/**
 * Milliseconds between each animation frame.
 */
let stepSpeed;

let start_;
let finish_;
let pegmanX;
let pegmanY;
let pegmanD;

/**
 * Log of Pegman's moves.  Recorded during execution, played back for animation.
 * @type !Array<!Array<string>>
 */
const log = [];

/**
 * Create and layout all the nodes for the path, scenery, Pegman, and goal.
 */
function drawMap() {
  const svg = BlocklyGames.getElementById('svgMaze');
  const scale = Math.max(ROWS, COLS) * SQUARE_SIZE;
  svg.setAttribute('viewBox', '0 0 ' + scale + ' ' + scale);

  // Draw the outer square.
  Blockly.utils.dom.createSvgElement(
    'rect',
    {
      height: MAZE_HEIGHT,
      width: MAZE_WIDTH,
      fill: '#F1EEE7',
      'stroke-width': 1,
      stroke: '#CCB',
    },
    svg
  );

  if (SKIN.background) {
    const tile = Blockly.utils.dom.createSvgElement(
      'image',
      {
        height: MAZE_HEIGHT,
        width: MAZE_WIDTH,
        x: 0,
        y: 0,
      },
      svg
    );
    tile.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href', SKIN.background);
  }

  // Draw the tiles making up the maze map.

  // Return a value of '0' if the specified square is wall or out of bounds,
  // '1' otherwise (empty, start, finish).
  const normalize = function (x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
      return '0';
    }
    return map[y][x] === SquareType.WALL ? '0' : '1';
  };

  // Compute and draw the tile for each square.
  let tileId = 0;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      // Compute the tile shape.
      let tileShape =
        normalize(x, y) +
        normalize(x, y - 1) + // North.
        normalize(x + 1, y) + // West.
        normalize(x, y + 1) + // South.
        normalize(x - 1, y); // East.

      // Draw the tile.
      if (!tile_SHAPES[tileShape]) {
        // Empty square.  Use null0 for large areas, with null1-4 for borders.
        // Add some randomness to avoid large empty spaces.
        if (tileShape === '00000' && Math.random() > 0.3) {
          tileShape = 'null0';
        } else {
          tileShape = 'null' + Math.floor(1 + Math.random() * 4);
        }
      }
      const left = tile_SHAPES[tileShape][0];
      const top = tile_SHAPES[tileShape][1];
      // Tile's clipPath element.
      const tileClip = Blockly.utils.dom.createSvgElement(
        'clipPath',
        {
          id: 'tileClipPath' + tileId,
        },
        svg
      );
      Blockly.utils.dom.createSvgElement(
        'rect',
        {
          height: SQUARE_SIZE,
          width: SQUARE_SIZE,
          x: x * SQUARE_SIZE,
          y: y * SQUARE_SIZE,
        },
        tileClip
      );
      // Tile sprite.
      const tile = Blockly.utils.dom.createSvgElement(
        'image',
        {
          height: SQUARE_SIZE * 4,
          width: SQUARE_SIZE * 5,
          'clip-path': 'url(#tileClipPath' + tileId + ')',
          x: (x - left) * SQUARE_SIZE,
          y: (y - top) * SQUARE_SIZE,
        },
        svg
      );
      tile.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href', SKIN.tiles);
      tileId++;
    }
  }

  // Add finish marker.
  const finishMarker = Blockly.utils.dom.createSvgElement(
    'image',
    {
      id: 'finish',
      height: 34,
      width: 20,
    },
    svg
  );
  finishMarker.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href', 'maze/marker.png');

  // Pegman's clipPath element, whose (x, y) is reset by displayPegman
  const pegmanClip = Blockly.utils.dom.createSvgElement(
    'clipPath',
    {
      id: 'pegmanClipPath',
    },
    svg
  );
  Blockly.utils.dom.createSvgElement(
    'rect',
    {
      id: 'clipRect',
      height: PEGMAN_HEIGHT,
      width: PEGMAN_WIDTH,
    },
    pegmanClip
  );

  // Add Pegman.
  const pegmanIcon = Blockly.utils.dom.createSvgElement(
    'image',
    {
      id: 'pegman',
      height: PEGMAN_HEIGHT,
      width: PEGMAN_WIDTH * 21, // 49 * 21 = 1029
      'clip-path': 'url(#pegmanClipPath)',
    },
    svg
  );
  pegmanIcon.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href', SKIN.sprite);
}

var numberOfAnswers = 0;
var letters_used;

// This is the Data object used for saving stuff to mysql
// Save all submitted plays
// TODO put into Blockly Interface and abstract this code for other functions
function saveWorkspace() {
  var xmlText = BlocklyInterface.getCode();
  var encoded = BlocklyInterface.encodeXml(xmlText);
  return encoded;
}

// TODO: do that but with mysql
// object with data for each level
var levelData = {
  level: BlocklyGames.LEVEL, // level number
  submissionType: 'null', // how was the game submitted "submit", "skip", "hiddenSkip"
  playPressedCount: 0, // amount of play button clicked (Submit button is not counted -> would be this+1)
  time: '0', // time needed to solve level
  finalCode: { mazeLog: [], code: '', resultType: 0, timestamp: '' }, // final code encoded + result type
  allSubmitted: { mazeLog: [], code: [], resultType: [], timestamp: [] }, // all code subitted thourgh play button with result type
};

var choiceLevelData = {
  level: BlocklyGames.LEVEL,
  submissionType: 'null', // "submit", "timeout"
  time: '0',
  prio1: '',
  prio2: '',
};

function startTimer() {
  var tick = function () {
    var min = String(Math.trunc(time / 60)).padStart(2, 0);
    var sec = String(time % 60).padStart(2, 0);
    levelData['time'] = min + ':' + sec;
    choiceLevelData['time'] = min + ':' + sec;
    time++;
  };
  // Set time to 5 minutes
  var time = 0;

  // Call the timer every second
  tick();
  timer = setInterval(tick, 1000);
}

function countdown(elementName, minutes, seconds) {
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
      saveChoiceData();
      switchLevel();
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
}

/**
 * Initialize Blockly and the maze.  Called on page load.
 */
function init() {
  Maze.Blocks.init();

  // Add skin parameter when moving to next level.
  BlocklyInterface.nextLevelParam = '&skin=' + SKIN_ID;

  // Render the HTML.
  document.body.innerHTML = Maze.html.start({
    lang: BlocklyGames.LANG,
    level: BlocklyGames.LEVEL,
    maxLevel: BlocklyGames.MAX_LEVEL,
    skin: SKIN_ID,
    html: BlocklyGames.IS_HTML,
    isKids: IS_KIDS_VERSION,
  });

  BlocklyInterface.init(BlocklyGames.getMsg('Games.maze', true));

  const rtl = BlocklyGames.IS_RTL;
  const blocklyDiv = BlocklyGames.getElementById('blockly');
  const visualization = BlocklyGames.getElementById('visualization');
  const onresize = function (_e) {
    const top = visualization.offsetTop;
    blocklyDiv.style.top = Math.max(10, top - window.pageYOffset) + 'px';
    blocklyDiv.style.left = rtl ? '10px' : '420px';
    blocklyDiv.style.width = window.innerWidth - 440 + 'px';
  };
  window.addEventListener('scroll', function () {
    onresize(null);
    Blockly.svgResize(BlocklyInterface.workspace);
  });
  window.addEventListener('resize', onresize);
  onresize(null);

  var scale = 1.0;
  // Scale kids and youth version differently
  if (IS_KIDS_VERSION) {
    // kids version
    scale = 1.0;
  } else {
    // youth version
    scale = 0.8;
  }

  const options = {
    maxBlocks: MAX_BLOCKS,
    rtl: rtl,
    trashcan: true,
    zoom: { startScale: scale },
  };
  if (BlocklyGames.LEVEL === BlocklyGames.CHOICE_LEVEL) {
    options.readOnly = true;
  }
  BlocklyInterface.injectBlockly(options);

  //BlocklyInterface.workspace.getAudioManager().load(SKIN.winSound, 'win');
  //BlocklyInterface.workspace.getAudioManager().load(SKIN.crashSound, 'fail');
  // Not really needed, there are no user-defined functions or variables.
  Blockly.JavaScript.addReservedWords(
    'moveForward,moveBackward,' +
      'turnRight,turnLeft,isPathForward,isPathRight,isPathBackward,isPathLeft'
  );

  drawMap();

  // Locate the start and finish squares.
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === SquareType.START) {
        start_ = { x, y };
      } else if (map[y][x] === SquareType.FINISH) {
        finish_ = { x, y };
      }
    }
  }

  reset(true);
  BlocklyInterface.workspace.addChangeListener(updateCapacity);

  document.body.addEventListener('mousemove', updatePegSpin_, true);

  if (BlocklyGames.LEVEL != 12) {
    BlocklyGames.bindClick('runButton', runButtonClick);
    BlocklyGames.bindClick('resetButton', resetButtonClick);
  }

  BlocklyGames.bindClick('submitButton', submitButtonClick);

  if ([5, 6, 9, 10, 11].includes(BlocklyGames.LEVEL)) {
    BlocklyGames.bindClick('skipButton', skipButtonClick);
  }

  if ([7, 8].includes(BlocklyGames.LEVEL)) {
    var hiddenskipbutton = document.getElementById('hiddenskipButton');
    hiddenskipbutton.style.display = 'inline';
    BlocklyGames.bindClick('hiddenskipButton', hiddenSkipButtonClick);
  }

  if (BlocklyGames.LEVEL === BlocklyGames.CHOICE_LEVEL) {
    var letters = ['1', '2', '3', '4', '5'];
    var lettersUsed = [];
    for (var level = BlocklyGames.DIVERGENT_1; level < BlocklyGames.DIVERGENT_1 + 5; level++) {
      var code = BlocklyGames.loadFromLocalStorage(BlocklyGames.storageName, level);
      if (code) {
        var xml = Blockly.Xml.textToDom(code);
        if (xml.childElementCount != 0) {
          var letter = letters[numberOfAnswers];
          BlocklyInterface.loadMazeChoice(code, false, letter);
          numberOfAnswers += 1;
          lettersUsed.push(letter);
        }
      }
    }

    if (numberOfAnswers == 0) {
      var el = document.getElementById('both-groups');
      el.style.display = 'none';
      var el = document.getElementById('submitButton');
      el.style.display = 'none';

      choiceLevelData.submissionType = 'skipped level 7 and 8';
      saveChoiceData();
      alert(
        'Da Lösungen für Level 7 und 8 übersprungen wurden, \n wirst Du direkt zu Level 13 weitergeleitet.'
      );
      BlocklyInterface.nextLevel();
    } else if (numberOfAnswers == 1) {
      var el = document.getElementById('input-group2');
      el.style.display = 'none';
      var input = document.getElementById('choiceLevelInput1');
      input.value = letters_used[0];
      setTimeout(BlocklyDialogs.stop, 100);
    } else {
      setTimeout(BlocklyDialogs.stop, 100);
    }
  } else {
    var defaultXml = '';
    if (BlocklyGames.LEVEL === 1) {
      if (IS_KIDS_VERSION) {
        defaultXml =
          '<xml>' +
          '<block ' +
          'type="maze_moveForwardKids" x="70" y="70">' +
          '<next>' +
          '<block ' +
          'type="maze_moveForwardKids" >' +
          '<next>' +
          '<block ' +
          'type="maze_turn_rightKids" >' +
          '<next>' +
          '<block ' +
          'type="maze_moveForwardKids" >' +
          '</block>' +
          '</next>' +
          '</block>' +
          '</next>' +
          '</block>' +
          '</next>' +
          '</block>' +
          '</xml>';
      } else {
        defaultXml =
          '<xml>' +
          '<block ' +
          'type="maze_moveForward" x="70" y="70">' +
          '<next>' +
          '<block ' +
          'type="maze_moveForward" >' +
          '<next>' +
          '<block ' +
          'type="maze_turn" ><field name="DIR">turnRight</field>' +
          '<next>' +
          '<block ' +
          'type="maze_moveForward" >' +
          '</block>' +
          '</next>' +
          '</block>' +
          '</next>' +
          '</block>' +
          '</next>' +
          '</block>' +
          '</xml>';
      }
      BlocklyInterface.loadBlocks(defaultXml, false);
    } else {
      BlocklyInterface.loadBlocks(defaultXml, false);
    }

    // Add the spinning Pegman icon to the done dialog.
    // <img id="pegSpin" src="common/1x1.gif">
    const buttonDiv = BlocklyGames.getElementById('dialogDoneButtons');
    const pegSpin = document.createElement('img');
    pegSpin.id = 'pegSpin';
    pegSpin.src = 'common/1x1.gif';
    pegSpin.style.backgroundImage = 'url(' + SKIN.sprite + ')';
    buttonDiv.parentNode.insertBefore(pegSpin, buttonDiv);

    // Lazy-load the JavaScript interpreter.
    BlocklyCode.importInterpreter();
    // Lazy-load the syntax-highlighting.
    BlocklyCode.importPrettify();

    // show dialogs or start timer
    if ([2, 3, 4, 5, 7, 13].includes(BlocklyGames.LEVEL)) {
      setTimeout(BlocklyDialogs.stop, 100);
    } else {
      //put timer
      if (timer) clearInterval(timer);
      startTimer();
    }
  }
}

/**
 * Reset the maze to the start position and kill any pending animation tasks.
 * @param {boolean} first True if an opening animation is to be played.
 */
function reset(first) {
  // Kill all tasks.
  pidList.forEach(clearTimeout);
  pidList.length = 0;

  // Move Pegman into position.
  pegmanX = start_.x;
  pegmanY = start_.y;

  if (first) {
    // Opening animation.
    pegmanD = startDirection + 1;
    scheduleFinish(false);
    pidList.push(
      setTimeout(function () {
        stepSpeed = 100;
        schedule([pegmanX, pegmanY, pegmanD * 4], [pegmanX, pegmanY, pegmanD * 4 - 4]);
        pegmanD++;
      }, stepSpeed * 5)
    );
  } else {
    pegmanD = startDirection;
    displayPegman(pegmanX, pegmanY, pegmanD * 4);
  }

  // Move the finish icon into position.
  const finishIcon = BlocklyGames.getElementById('finish');
  finishIcon.setAttribute(
    'x',
    SQUARE_SIZE * (finish_.x + 0.5) - finishIcon.getAttribute('width') / 2
  );
  finishIcon.setAttribute('y', SQUARE_SIZE * (finish_.y + 0.6) - finishIcon.getAttribute('height'));

  // Make 'look' icon invisible and promote to top.
  const lookIcon = BlocklyGames.getElementById('look');
  lookIcon.style.display = 'none';
  lookIcon.parentNode.appendChild(lookIcon);
  const paths = lookIcon.getElementsByTagName('path');
  for (const path of paths) {
    path.setAttribute('stroke', SKIN.look);
  }
}

/**
 * Click the run button.  Start the program.
 * @param {!Event} e Mouse or touch event.
 */
function runButtonClick(e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  BlocklyDialogs.hideDialog(false);
  // Only allow a single top block on level 1.
  const runButton = BlocklyGames.getElementById('runButton');
  const resetButton = BlocklyGames.getElementById('resetButton');
  // Ensure that Reset button is at least as wide as Run button.
  if (!resetButton.style.minWidth) {
    resetButton.style.minWidth = runButton.offsetWidth + 'px';
  }
  runButton.style.display = 'none';
  resetButton.style.display = 'inline';
  reset(false);
  execute();

  // save results
  var textLog = [];
  for (var i = 0; i < log.length; i++) {
    textLog.push(log[i][0]);
  }
  levelData.allSubmitted.mazeLog.push(textLog);
  var encoded = [saveWorkspace()];
  levelData.allSubmitted.code.push(encoded);
  levelData.allSubmitted.resultType.push(result);
  levelData.allSubmitted.timestamp.push(new Date().toISOString());
  levelData.playPressedCount += 1;

  console.log(levelData);
}

/**
 * Updates the document's 'capacity' element with a message
 * indicating how many more blocks are permitted.  The capacity
 * is retrieved from BlocklyInterface.workspace.remainingCapacity().
 */
function updateCapacity() {
  const cap = BlocklyInterface.workspace.remainingCapacity();
  const p = BlocklyGames.getElementById('capacity');
  if (cap === Infinity) {
    p.style.display = 'none';
  } else {
    p.style.display = 'inline';
    p.innerHTML = '';
    const capSpan = document.createElement('span');
    capSpan.className = 'capacityNumber';
    capSpan.appendChild(document.createTextNode(Number(cap)));
    // Safe from HTML injection due to createTextNode below.
    let msg;
    if (cap === 0) {
      msg = BlocklyGames.getMsg('Maze.capacity0', false);
    } else if (cap === 1) {
      msg = BlocklyGames.getMsg('Maze.capacity1', false);
    } else {
      msg = BlocklyGames.getMsg('Maze.capacity2', false);
    }
    const parts = msg.split(/%\d/);
    for (let i = 0; i < parts.length; i++) {
      p.appendChild(document.createTextNode(parts[i]));
      if (i !== parts.length - 1) {
        p.appendChild(capSpan.cloneNode(true));
      }
    }
  }
}

// Effort for Skip Button
function skipButtonClick(e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  BlocklyDialogs.hideDialog(false);

  reset(false);
  execute('skip');
  levelData.submissionType = 'skip';
  saveData();

  BlocklyInterface.skipLevel(BlocklyGames.LEVEL);
}

// Effort for Skip Button
function hiddenSkipButtonClick(e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  BlocklyDialogs.hideDialog(false);

  reset(false);
  execute();
  levelData.submissionType = 'hiddenSkip';
  saveData();

  BlocklyInterface.skipLevel(BlocklyGames.LEVEL);
}

/**
 * Move to the next level
 */
function switchLevel() {
  if (BlocklyGames.LEVEL == 13) {
    setTimeout(BlocklyDialogs.finish, 1000);
  } else {
    setTimeout(BlocklyInterface.nextLevel, 2000);
  }
}

/**
 * Submits the level data to xapi
 * @param {event} e
 * @returns
 */
function submitButtonClick(e) {
  // save time
  clearInterval(timer);

  if (BlocklyGames.LEVEL == BlocklyGames.CHOICE_LEVEL) {
    submitChoiceLevel(e);
  } else {
    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
      return;
    }
    BlocklyDialogs.hideDialog(false);

    // set true so that in Maze.animate no congratulations is displayed
    submitPressed = true;
    levelData.submissionType = 'submit'; // add submitPressed

    // Check if blocks have been selected.
    if (BlocklyGames.LEVEL != 13) {
      if (BlocklyInterface.workspace.getTopBlocks(false).length == 0) {
        //Maze.levelHelp(); TODO: maybe use Maze.levelHelp() instead of alert?
        alert('Bitte wähle ein paar Blöcke vor der Abgabe aus.');
        return;
      }
    }
    // hide buttons
    var runButton = document.getElementById('runButton');
    var resetButton = document.getElementById('resetButton');
    var submitButton = document.getElementById('submitButton');
    // Ensure that Reset button is at least as wide as Run button.
    if (!resetButton.style.minWidth) {
      resetButton.style.minWidth = runButton.offsetWidth + 'px';
    }
    runButton.style.display = 'none'; //changed from none
    resetButton.style.display = 'none';
    submitButton.style.display = 'none';

    if ([(5, 6, 9, 10, 11)].includes(BlocklyGames.LEVEL)) {
      // change level 1 to 9
      var skipButton = document.getElementById('skipButton');
      skipButton.style.display = 'none';
    }

    reset(false);
    execute('submit');
    saveData();
  }
}

function saveChoiceData() {
  // save prios
  for (var i = 0; i < choiceLevelInputList.length; i++) {
    choiceLevelData['prio' + (i + 1)] = choiceLevelInputList[i];
  }

  console.log(choiceLevelData);

  BlocklyInterface.saveChoiceLevelToLocalStorage(choiceLevelData);
  var json = JSON.stringify(choiceLevelData);
  // TODO: write upload code
  // BlocklyInterface.uploadToServer(BlocklyGames.loadUserCode(), BlocklyGames.LEVEL, json);
  // input boolean to validate that its a submission with actual input
  //Maze.choiceLevelData[0].prio1 = window.localStorage.getItem()    TODO: add sabing mechanism for prios
}

function saveData() {
  // save result
  // convert the saved code to xmldom to text to encode
  //var code = BlocklyGames.loadFromLocalStorage(BlocklyGames.storageName, BlocklyGames.LEVEL);

  var textLog = [];
  if (log) {
    for (var i = 0; i < log.length; i++) {
      textLog.push(log[i][0]);
    }
    levelData.finalCode.mazeLog.push(textLog);
  }
  var encoded = saveWorkspace();
  levelData.finalCode.code = encoded;
  levelData.finalCode.resultType = result;
  levelData.finalCode.timestamp = new Date().toISOString();

  console.log(levelData);
  var json = JSON.stringify(levelData);
  //TODO write upload function BlocklyInterface.uploadToServer(BlocklyGames.loadUserCode(), BlocklyGames.LEVEL, json);

  if (BlocklyGames.LEVEL == 13) {
    let startTime = new Date(BlocklyGames.loadStartTime());
    let endTime = new Date();
    let minutes = (endTime - startTime) / (1000 * 60);
    minutes = minutes.toFixed(2);
    BlocklyInterface.addTimeDiff(BlocklyGames.loadUserCode(), minutes);
  }
}

function submitChoiceLevel(e) {
  var submitButton = document.getElementById('submitButton');
  //var input = false; set a variable to true false depending on if real content was submitted
  var already_alerted = false;
  var isClean = false;
  for (var i = 0; i < numberOfAnswers; i++) {
    var choiceLevelInput = document.getElementById('choiceLevelInput' + (i + 1)).value; // return value of input box
    choiceLevelInput = choiceLevelInput.toUpperCase();
    choiceLevelInputList[i] = choiceLevelInput;
    if (already_alerted) {
      break;
    }
    if (choiceLevelInput === '') {
      isClean = false;
      alert('Bitte fülle alle Felder aus.');
      already_alerted = true;
    } else if (LETTERS_USED.includes(choiceLevelInput)) {
      // if it is NOT clean
      isClean = false;
      alert('Verwende bitte nur die aufgelisteten Zahlen.');
      already_alerted = true;
    } else {
      isClean = true;
    }
  }

  function hasDuplicates(array) {
    var valuesSoFar = Object.create(null);
    for (var i = 0; i < array.length; ++i) {
      var value = array[i];
      if (value in valuesSoFar) {
        return true;
      }
      valuesSoFar[value] = true;
    }
    return false;
  }

  if (hasDuplicates(choiceLevelInputList)) {
    isClean = false;
    if (!already_alerted) {
      alert('Verwende bitte keinen Zahlen doppelt.');
    }
  }

  if (isClean) {
    submitButton.style.display = 'none';
    saveChoiceData();
    switchLevel();
  }
}

/**
 * Click the reset button.  Reset the maze.
 * @param {!Event} e Mouse or touch event.
 */
function resetButtonClick(e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  const runButton = BlocklyGames.getElementById('runButton');
  runButton.style.display = 'inline';
  BlocklyGames.getElementById('resetButton').style.display = 'none';
  BlocklyInterface.workspace.highlightBlock(null);
  reset(false);
  //levelHelp();
}

/**
 * Inject the Maze API into a JavaScript interpreter.
 * @param {!Interpreter} interpreter The JS-Interpreter.
 * @param {!Interpreter.Object} globalObject Global object.
 */
function initInterpreter(interpreter, globalObject) {
  // API
  let wrapper;
  wrapper = function (id) {
    move(0, id);
  };
  wrap('moveForward');

  wrapper = function (id) {
    move(2, id);
  };
  wrap('moveBackward');

  wrapper = function (id) {
    turn(0, id);
  };
  wrap('turnLeft');

  wrapper = function (id) {
    turn(1, id);
  };
  wrap('turnRight');

  wrapper = function (id) {
    return isPath(0, id);
  };
  wrap('isPathForward');

  wrapper = function (id) {
    return isPath(1, id);
  };
  wrap('isPathRight');

  wrapper = function (id) {
    return isPath(2, id);
  };
  wrap('isPathBackward');

  wrapper = function (id) {
    return isPath(3, id);
  };
  wrap('isPathLeft');

  wrapper = function () {
    return notDone();
  };
  wrap('notDone');

  function wrap(name) {
    interpreter.setProperty(globalObject, name, interpreter.createNativeFunction(wrapper, false));
  }
}

/**
 * Execute the user's code.  Heaven help us...
 */
function execute() {
  if (!('Interpreter' in window)) {
    // Interpreter lazy loads and hasn't arrived yet.  Try again later.
    setTimeout(execute, 99);
    return;
  }

  log.length = 0;
  Blockly.selected && Blockly.selected.unselect();
  const code = BlocklyCode.getJsCode();
  BlocklyCode.executedJsCode = code;
  BlocklyInterface.executedCode = BlocklyInterface.getCode();
  result = ResultType.UNSET;
  const interpreter = new Interpreter(code, initInterpreter);

  // Try running the user's code.  There are four possible outcomes:
  // 1. If pegman reaches the finish [SUCCESS], true is thrown.
  // 2. If the program is terminated due to running too long [TIMEOUT],
  //    false is thrown.
  // 3. If another error occurs [ERROR], that error is thrown.
  // 4. If the program ended normally but without solving the maze [FAILURE],
  //    no error or exception is thrown.
  try {
    let ticks = 10000; // 10k ticks runs Pegman for about 8 minutes.
    while (interpreter.step()) {
      if (ticks-- === 0) {
        throw Infinity;
      }
    }
    result = notDone() ? ResultType.FAILURE : ResultType.SUCCESS;
  } catch (e) {
    // A boolean is thrown for normal termination.
    // Abnormal termination is a user error.
    if (e === Infinity) {
      result = ResultType.TIMEOUT;
    } else if (e === false) {
      result = ResultType.ERROR;
    } else {
      // Syntax error, can't happen.
      result = ResultType.ERROR;
      alert(e);
    }
  }

  // Fast animation if execution is successful.  Slow otherwise.
  if (result === ResultType.SUCCESS) {
    stepSpeed = 50;
    log.push(['finish', null]);
  } else {
    stepSpeed = 100;
    log.push(['end', null]);
  }

  // log now contains a transcript of all the user's actions.
  // Reset the maze and animate the transcript.
  reset(false);
  pidList.push(setTimeout(animate, 100));
}

/**
 * Iterate through the recorded path and animate pegman's actions.
 */
function animate() {
  const action = log.shift();
  if (!action) {
    BlocklyCode.highlight(null);
    //levelHelp();
    return;
  }
  BlocklyCode.highlight(action[1]);

  switch (action[0]) {
    case 'north':
      schedule([pegmanX, pegmanY, pegmanD * 4], [pegmanX, pegmanY - 1, pegmanD * 4]);
      pegmanY--;
      break;
    case 'east':
      schedule([pegmanX, pegmanY, pegmanD * 4], [pegmanX + 1, pegmanY, pegmanD * 4]);
      pegmanX++;
      break;
    case 'south':
      schedule([pegmanX, pegmanY, pegmanD * 4], [pegmanX, pegmanY + 1, pegmanD * 4]);
      pegmanY++;
      break;
    case 'west':
      schedule([pegmanX, pegmanY, pegmanD * 4], [pegmanX - 1, pegmanY, pegmanD * 4]);
      pegmanX--;
      break;
    case 'look_north':
      scheduleLook(DirectionType.NORTH);
      break;
    case 'look_east':
      scheduleLook(DirectionType.EAST);
      break;
    case 'look_south':
      scheduleLook(DirectionType.SOUTH);
      break;
    case 'look_west':
      scheduleLook(DirectionType.WEST);
      break;
    case 'fail_forward':
      scheduleFail(true);
      break;
    case 'fail_backward':
      scheduleFail(false);
      break;
    case 'left':
      schedule([pegmanX, pegmanY, pegmanD * 4], [pegmanX, pegmanY, pegmanD * 4 - 4]);
      pegmanD = constrainDirection4(pegmanD - 1);
      break;
    case 'right':
      schedule([pegmanX, pegmanY, pegmanD * 4], [pegmanX, pegmanY, pegmanD * 4 + 4]);
      pegmanD = constrainDirection4(pegmanD + 1);
      break;
    case 'end':
      if (submitPressed) {
        BlocklyInterface.saveToLocalStorage();
        switchLevel();
      }
      break;
    case 'finish':
      scheduleFinish(false);
      if (submitPressed) {
        BlocklyInterface.saveToLocalStorage();
        switchLevel();
      }
      break;
  }

  pidList.push(setTimeout(animate, stepSpeed * 5));
}

/**
 * Point the congratulations Pegman to face the mouse.
 * @param {Event} e Mouse move event.
 * @private
 */
function updatePegSpin_(e) {
  if (BlocklyGames.getElementById('dialogDone').className === 'dialogHiddenContent') {
    return;
  }
  const pegSpin = BlocklyGames.getElementById('pegSpin');
  const bBox = BlocklyDialogs.getBBox(pegSpin);
  const x = bBox.x + bBox.width / 2 - window.pageXOffset;
  const y = bBox.y + bBox.height / 2 - window.pageYOffset;
  const dx = e.clientX - x;
  const dy = e.clientY - y;
  let angle = Blockly.utils.math.toDegrees(Math.atan(dy / dx));
  // 0: North, 90: East, 180: South, 270: West.
  if (dx > 0) {
    angle += 90;
  } else {
    angle += 270;
  }
  // Divide into 16 quads.
  let quad = Math.round((angle / 360) * 16);
  if (quad === 16) {
    quad = 15;
  }
  // Display correct Pegman sprite.
  pegSpin.style.backgroundPosition = -quad * PEGMAN_WIDTH + 'px 0px';
}

/**
 * Schedule the animations for a move or turn.
 * @param {!Array<number>} startPos X, Y and direction starting points.
 * @param {!Array<number>} endPos X, Y and direction ending points.
 */
function schedule(startPos, endPos) {
  const deltas = [
    (endPos[0] - startPos[0]) / 4,
    (endPos[1] - startPos[1]) / 4,
    (endPos[2] - startPos[2]) / 4,
  ];
  displayPegman(
    startPos[0] + deltas[0],
    startPos[1] + deltas[1],
    constrainDirection16(startPos[2] + deltas[2])
  );
  pidList.push(
    setTimeout(function () {
      displayPegman(
        startPos[0] + deltas[0] * 2,
        startPos[1] + deltas[1] * 2,
        constrainDirection16(startPos[2] + deltas[2] * 2)
      );
    }, stepSpeed)
  );
  pidList.push(
    setTimeout(function () {
      displayPegman(
        startPos[0] + deltas[0] * 3,
        startPos[1] + deltas[1] * 3,
        constrainDirection16(startPos[2] + deltas[2] * 3)
      );
    }, stepSpeed * 2)
  );
  pidList.push(
    setTimeout(function () {
      displayPegman(endPos[0], endPos[1], constrainDirection16(endPos[2]));
    }, stepSpeed * 3)
  );
}

/**
 * Schedule the animations and sounds for a failed move.
 * @param {boolean} forward True if forward, false if backward.
 */
function scheduleFail(forward) {
  let deltaX = 0;
  let deltaY = 0;
  switch (pegmanD) {
    case DirectionType.NORTH:
      deltaY = -1;
      break;
    case DirectionType.EAST:
      deltaX = 1;
      break;
    case DirectionType.SOUTH:
      deltaY = 1;
      break;
    case DirectionType.WEST:
      deltaX = -1;
      break;
  }
  if (!forward) {
    deltaX = -deltaX;
    deltaY = -deltaY;
  }
  if (SKIN.crashType === CRASH_STOP) {
    // Bounce bounce.
    deltaX /= 4;
    deltaY /= 4;
    const direction16 = constrainDirection16(pegmanD * 4);
    displayPegman(pegmanX + deltaX, pegmanY + deltaY, direction16);
    BlocklyInterface.workspace.getAudioManager().play('fail', 0.5);
    pidList.push(
      setTimeout(function () {
        displayPegman(pegmanX, pegmanY, direction16);
      }, stepSpeed)
    );
    pidList.push(
      setTimeout(function () {
        displayPegman(pegmanX + deltaX, pegmanY + deltaY, direction16);
        BlocklyInterface.workspace.getAudioManager().play('fail', 0.5);
      }, stepSpeed * 2)
    );
    pidList.push(
      setTimeout(function () {
        displayPegman(pegmanX, pegmanY, direction16);
      }, stepSpeed * 3)
    );
  } else {
    // Add a small random delta away from the grid.
    const deltaZ = (Math.random() - 0.5) * 10;
    const deltaD = (Math.random() - 0.5) / 2;
    deltaX += (Math.random() - 0.5) / 4;
    deltaY += (Math.random() - 0.5) / 4;
    deltaX /= 8;
    deltaY /= 8;
    let acceleration = 0;
    if (SKIN.crashType === CRASH_FALL) {
      acceleration = 0.01;
    }
    pidList.push(
      setTimeout(function () {
        BlocklyInterface.workspace.getAudioManager().play('fail', 0.5);
      }, stepSpeed * 2)
    );
    const setPosition = function (n) {
      return function () {
        const direction16 = constrainDirection16(pegmanD * 4 + deltaD * n);
        displayPegman(pegmanX + deltaX * n, pegmanY + deltaY * n, direction16, deltaZ * n);
        deltaY += acceleration;
      };
    };
    // 100 frames should get Pegman offscreen.
    for (let i = 1; i < 100; i++) {
      pidList.push(setTimeout(setPosition(i), (stepSpeed * i) / 2));
    }
  }
}

/**
 * Schedule the animations and sound for a victory dance.
 * @param {boolean} sound Play the victory sound.
 */
function scheduleFinish(sound) {
  const direction16 = constrainDirection16(pegmanD * 4);
  displayPegman(pegmanX, pegmanY, 16);
  if (sound) {
    BlocklyInterface.workspace.getAudioManager().play('win', 0.5);
  }
  stepSpeed = 150; // Slow down victory animation a bit.
  pidList.push(
    setTimeout(function () {
      displayPegman(pegmanX, pegmanY, 18);
    }, stepSpeed)
  );
  pidList.push(
    setTimeout(function () {
      displayPegman(pegmanX, pegmanY, 16);
    }, stepSpeed * 2)
  );
  pidList.push(
    setTimeout(function () {
      displayPegman(pegmanX, pegmanY, direction16);
    }, stepSpeed * 3)
  );
}

/**
 * Display Pegman at the specified location, facing the specified direction.
 * @param {number} x Horizontal grid (or fraction thereof).
 * @param {number} y Vertical grid (or fraction thereof).
 * @param {number} d Direction (0 - 15) or dance (16 - 17).
 * @param {number=} opt_angle Optional angle (in degrees) to rotate Pegman.
 */
function displayPegman(x, y, d, opt_angle) {
  const pegmanIcon = BlocklyGames.getElementById('pegman');
  pegmanIcon.setAttribute('x', x * SQUARE_SIZE - d * PEGMAN_WIDTH + 1);
  pegmanIcon.setAttribute('y', SQUARE_SIZE * (y + 0.5) - PEGMAN_HEIGHT / 2 - 8);
  if (opt_angle) {
    pegmanIcon.setAttribute(
      'transform',
      'rotate(' +
        opt_angle +
        ', ' +
        (x * SQUARE_SIZE + SQUARE_SIZE / 2) +
        ', ' +
        (y * SQUARE_SIZE + SQUARE_SIZE / 2) +
        ')'
    );
  } else {
    pegmanIcon.setAttribute('transform', 'rotate(0, 0, 0)');
  }

  const clipRect = BlocklyGames.getElementById('clipRect');
  clipRect.setAttribute('x', x * SQUARE_SIZE + 1);
  clipRect.setAttribute('y', pegmanIcon.getAttribute('y'));
}

/**
 * Display the look icon at Pegman's current location,
 * in the specified direction.
 * @param {!DirectionType} d Direction (0 - 3).
 */
function scheduleLook(d) {
  let x = pegmanX;
  let y = pegmanY;
  switch (d) {
    case DirectionType.NORTH:
      x += 0.5;
      break;
    case DirectionType.EAST:
      x += 1;
      y += 0.5;
      break;
    case DirectionType.SOUTH:
      x += 0.5;
      y += 1;
      break;
    case DirectionType.WEST:
      y += 0.5;
      break;
  }
  x *= SQUARE_SIZE;
  y *= SQUARE_SIZE;
  const deg = d * 90 - 45;

  const lookIcon = BlocklyGames.getElementById('look');
  lookIcon.setAttribute(
    'transform',
    'translate(' + x + ', ' + y + ') ' + 'rotate(' + deg + ' 0 0) scale(.4)'
  );
  const paths = lookIcon.getElementsByTagName('path');
  lookIcon.style.display = 'inline';
  for (let i = 0; i < paths.length; i++) {
    scheduleLookStep(paths[i], stepSpeed * i);
  }
}

/**
 * Schedule one of the 'look' icon's waves to appear, then disappear.
 * @param {!Element} path Element to make appear.
 * @param {number} delay Milliseconds to wait before making wave appear.
 */
function scheduleLookStep(path, delay) {
  pidList.push(
    setTimeout(function () {
      path.style.display = 'inline';
      setTimeout(function () {
        path.style.display = 'none';
      }, stepSpeed * 2);
    }, delay)
  );
}

/**
 * Keep the direction within 0-3, wrapping at both ends.
 * @param {number} d Potentially out-of-bounds direction value.
 * @returns {number} Legal direction value.
 */
function constrainDirection4(d) {
  d = Math.round(d) % 4;
  if (d < 0) {
    d += 4;
  }
  return d;
}

/**
 * Keep the direction within 0-15, wrapping at both ends.
 * @param {number} d Potentially out-of-bounds direction value.
 * @returns {number} Legal direction value.
 */
function constrainDirection16(d) {
  d = Math.round(d) % 16;
  if (d < 0) {
    d += 16;
  }
  return d;
}

// Core functions.

/**
 * Attempt to move pegman forward or backward.
 * @param {number} direction Direction to move (0 = forward, 2 = backward).
 * @param {string} id ID of block that triggered this action.
 * @throws {true} If the end of the maze is reached.
 * @throws {false} If Pegman collides with a wall.
 */
function move(direction, id) {
  if (!isPath(direction, null)) {
    log.push(['fail_' + (direction ? 'backward' : 'forward'), id]);
    throw false;
  }
  // If moving backward, flip the effective direction.
  const effectiveDirection = pegmanD + direction;
  let command;
  switch (constrainDirection4(effectiveDirection)) {
    case DirectionType.NORTH:
      pegmanY--;
      command = 'north';
      break;
    case DirectionType.EAST:
      pegmanX++;
      command = 'east';
      break;
    case DirectionType.SOUTH:
      pegmanY++;
      command = 'south';
      break;
    case DirectionType.WEST:
      pegmanX--;
      command = 'west';
      break;
  }
  log.push([command, id]);
}

/**
 * Turn pegman left or right.
 * @param {number} direction Direction to turn (0 = left, 1 = right).
 * @param {string} id ID of block that triggered this action.
 */
function turn(direction, id) {
  if (direction) {
    // Right turn (clockwise).
    pegmanD++;
    log.push(['right', id]);
  } else {
    // Left turn (counterclockwise).
    pegmanD--;
    log.push(['left', id]);
  }
  pegmanD = constrainDirection4(pegmanD);
}

/**
 * Is there a path next to pegman?
 * @param {number} direction Direction to look
 *     (0 = forward, 1 = right, 2 = backward, 3 = left).
 * @param {?string} id ID of block that triggered this action.
 *     Null if called as a helper function in move().
 * @returns {boolean} True if there is a path.
 */
function isPath(direction, id) {
  const effectiveDirection = pegmanD + direction;
  let square, command;
  switch (constrainDirection4(effectiveDirection)) {
    case DirectionType.NORTH:
      square = map[pegmanY - 1] && map[pegmanY - 1][pegmanX];
      command = 'look_north';
      break;
    case DirectionType.EAST:
      square = map[pegmanY][pegmanX + 1];
      command = 'look_east';
      break;
    case DirectionType.SOUTH:
      square = map[pegmanY + 1] && map[pegmanY + 1][pegmanX];
      command = 'look_south';
      break;
    case DirectionType.WEST:
      square = map[pegmanY][pegmanX - 1];
      command = 'look_west';
      break;
  }
  if (id) {
    log.push([command, id]);
  }
  return square !== SquareType.WALL && square !== undefined;
}

/**
 * Is the player at the finish marker?
 * @returns {boolean} True if not done, false if done.
 */
function notDone() {
  return pegmanX !== finish_.x || pegmanY !== finish_.y;
}

BlocklyGames.callWhenLoaded(init);
