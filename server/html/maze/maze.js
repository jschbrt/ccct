/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview JavaScript for Maze game.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Maze');

goog.require('Blockly.FieldDropdown');
goog.require('Blockly.Trashcan');
goog.require('Blockly.utils.dom');
goog.require('Blockly.utils.math');
goog.require('Blockly.utils.string');
goog.require('Blockly.VerticalFlyout');
goog.require('BlocklyDialogs');
goog.require('BlocklyGames');
goog.require('BlocklyInterface');
goog.require('Maze.Blocks');
goog.require('Maze.soy');

BlocklyGames.NAME = 'maze';

// define number of levels the game has
/**
 * Item 1. Training 1 - Normal Perspective
 * Item 2. Training 2 - No-For-Loop
 * Item 3. Training 3 - For-Loop
 * Item 4. Training 4 - Switched Perspective
 * Item 5. Intro 1 - Astronaut looking EAST
 * Item 6. Intro 2 - For-Loop and Switched Perspective
 * Item 7. Divergent Task 1
 * Item 8. MULTIPLE CHOICE wrt Divergent Task 1
 * Item 9. No only L not R allowed
 */

// BlocklyGames.MAX_LEVEL = 9; ->  defined in lib-games.js
// you have to change manually 
// BlocklyInterface.nextLevel AND
// right level skin for loop AND
// instructions code at the bottom

/**
 * Go to the next level.  Add skin parameter.
 * @suppress {duplicate}
 */

Maze.timer;

Maze.IS_KIDS_VERSION = BlocklyGames.isKidsVersion(); // if true, its the 1-2graders version

Maze.submitPressed = false; // for Maze.animate

Maze.NUMBER_OF_ANSWERS = 0; // amout of choices made in divergent task

Maze.LETTERS_USED = []; // which letters have been used

Maze.choiceLevelInputList = []; //input of in choice level

// Define Block Restriction per item
// Infinity for no restrictions
Maze.MAX_BLOCKS = [undefined, // Level 0.
    Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity
][BlocklyGames.LEVEL];

// Crash type constants.
Maze.CRASH_STOP = 1;
Maze.CRASH_SPIN = 2;
Maze.CRASH_FALL = 3;

Maze.SKINS = [
    // sprite: A 1029x51 set of 21 avatar images.
    // tiles: A 250x200 set of 20 map images.
    // marker: A 20x34 goal image.
    // background: An optional 400x450 background image, or false.
    // look: Colour of sonar-like look icon.
    // winSound: List of sounds (in various formats) to play when the player wins.
    // crashSound: List of sounds (in various formats) for player crashes.
    // crashType: Behaviour when player crashes (stop, spin, or fall).

    // changed first sprite to astronaut

    {
        sprite: 'maze/astro.png',
        spriteDialog: 'maze/astro.png',
        avatar: 'maze/astro.png',
        tiles: 'maze/tiles_astro2.png',
        marker: 'maze/rocket_marker.png',
        markerBlock: 'maze/rocket_marker.png',
        background: 'maze/bg_astro2.png',
        look: '#fff',
        crashType: Maze.CRASH_SPIN
    }, {
        sprite: 'maze/zombie.png',
        avatar: 'maze/zombie.png',
        tiles: 'maze/tiles_zombie.png',
        marker: 'maze/marker_flower.png',
        background: 'maze/bg_zombie.png',
        // Coma star cluster, photo by George Hatfield, used with permission.
        look: '#fff',
        winSound: ['maze/win_zombie.mp3', 'maze/win_zombie.ogg'],
        crashSound: ['maze/fail_zombie.mp3', 'maze/fail_zombie.ogg'],
        crashType: Maze.CRASH_STOP
    },
    {
        sprite: 'maze/bee4.png',
        spriteDialog: 'maze/bee3.png',
        avatar: 'maze/static_bee2.png',
        tiles: 'maze/tiles_bee_4.png',
        marker: 'maze/marker_honey2.png',
        markerBlock: 'maze/marker_honeyblock.png',
        background: 'maze/bg_bee.png',
        look: '#000',
        crashType: Maze.CRASH_FALL
    }
];

if(Maze.IS_KIDS_VERSION==1){
    Maze.SKIN_ID = 2;
}
else{
    Maze.SKIN_ID = 0;
}
Maze.SKIN = Maze.SKINS[Maze.SKIN_ID];

/**
 * Milliseconds between each animation frame.
 */
Maze.stepSpeed;
//test
/**
 * The types of squares in the maze, which is represented
 * as a 2D array of SquareType values.
 * @enum {number}
 */
Maze.SquareType = {
    WALL: 0,
    OPEN: 1,
    START: 2,
    FINISH: 3,
    OBSTACLE: 4,
    LOOP: 5
};

// The maze square constants defined above are inlined here
// for ease of reading and writing the static mazes.
Maze.map = [
    // Item 0.
    undefined,
    // Item 1. Training 1 - Normal Perspective
    [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 3, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 2, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
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
        [0, 0, 0, 0, 0, 0, 0, 0]
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
        [0, 0, 0, 0, 0, 0, 0, 0]
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
        [0, 0, 0, 0, 0, 0, 0, 0]
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
        [0, 0, 0, 0, 0, 0, 0, 0]
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
        [0, 0, 0, 0, 0, 0, 0, 0]
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
        [0, 0, 0, 0, 0, 0, 0, 0]
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
        [0, 0, 0, 0, 0, 0, 0, 0]
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
        [0, 0, 0, 0, 0, 0, 0, 0]
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
        [0, 0, 0, 0, 0, 0, 0, 0]
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
        [0, 0, 0, 0, 0, 0, 0, 0]
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
        [0, 0, 0, 0, 0, 0, 0, 0]
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
        [0, 0, 0, 0, 0, 0, 0, 0]
    ]
][BlocklyGames.LEVEL];

/**
 * Measure maze dimensions and set sizes.
 * ROWS: Number of tiles down.
 * COLS: Number of tiles across.
 * SQUARE_SIZE: Pixel height and width of each maze square (i.e. tile).
 */
Maze.ROWS = Maze.map.length;
Maze.COLS = Maze.map[0].length;
Maze.SQUARE_SIZE = 50;
Maze.PEGMAN_HEIGHT = 52;
Maze.PEGMAN_WIDTH = 49;

Maze.MAZE_WIDTH = Maze.SQUARE_SIZE * Maze.COLS;
Maze.MAZE_HEIGHT = Maze.SQUARE_SIZE * Maze.ROWS;
Maze.PATH_WIDTH = Maze.SQUARE_SIZE / 3;

// This is the Data object used for saving stuff to mysql
// Save all submitted plays
// TODO put into Blockly Interface and abstract this code for other functions
Maze.saveWorkspace = function() {   
    var xmlText = BlocklyInterface.getCode();
    var encoded = BlocklyInterface.encodeXml(xmlText);
    return encoded;
}
        
// TODO: do that but with mysql
// object with data for each level
Maze.levelData = {
    level: BlocklyGames.LEVEL,          // level number 
    submissionType: "null",                  // how was the game submitted "submit", "skip", "hiddenSkip"
    playPressedCount: 0,                       // amount of play button clicked (Submit button is not counted -> would be this+1)
    time: "0",                          // time needed to solve level
    finalCode : {mazeLog: [], code: "", resultType: 0, timestamp: ""},  // final code encoded + result type
    allSubmitted: {mazeLog: [], code: [], resultType: [], timestamp: []}, // all code subitted thourgh play button with result type
}

Maze.choiceLevelData = {
    level: BlocklyGames.LEVEL,
    submissionType: "null",  // "submit", "timeout"
    time: "0",
    prio1: "",
    prio2: ""
}

/**
 * Constants for cardinal directions.  Subsequent code assumes these are
 * in the range 0..3 and that opposites have an absolute difference of 2.
 * @enum {number}
 */
Maze.DirectionType = {
    NORTH: 0,
    EAST: 1,
    SOUTH: 2,
    WEST: 3
};

/**
 * Outcomes of running the user program.
 */
Maze.ResultType = {
    UNSET: 0,
    SUCCESS: 1,
    FAILURE: -1,
    TIMEOUT: 2,
    ERROR: -2
};

/**
 * Result of last execution.
 */
Maze.result = Maze.ResultType.UNSET;

/**
 * Starting direction defined for each level
 */
Maze.startDirection = [undefined, // Item 0
    Maze.DirectionType.NORTH,  // Item 1
    Maze.DirectionType.NORTH,  // Item 2
    Maze.DirectionType.NORTH,  // Item 3
    Maze.DirectionType.WEST,   // Item 4
    Maze.DirectionType.EAST,   // Item 5
    Maze.DirectionType.SOUTH,  // Item 6
    Maze.DirectionType.NORTH,  // Item 7
    Maze.DirectionType.NORTH,  // Item 8
    Maze.DirectionType.NORTH,  // Item 9
    Maze.DirectionType.NORTH,  // Item 10
    Maze.DirectionType.NORTH,  // Item 11
    Maze.DirectionType.NORTH,  // Item 12
    Maze.DirectionType.NORTH   // Item 13
][BlocklyGames.LEVEL]


/**
 * PIDs of animation tasks currently executing.
 */
Maze.pidList = [];

// Map each possible shape to a sprite.
// Input: Binary string representing Centre/North/West/South/East squares.
// Output: [x, y] coordinates of each tile's sprite in tiles.png.
Maze.tile_SHAPES = {
    '10010': [4, 0], // Dead ends
    '10001': [3, 3],
    '11000': [0, 1],
    '10100': [0, 2],
    '11010': [4, 1], // Vertical
    '10101': [3, 2], // Horizontal
    '10110': [0, 0], // Elbows
    '10011': [2, 0],
    '11001': [4, 2],
    '11100': [2, 3],
    '11110': [1, 1], // Junctions
    '10111': [1, 0],
    '11011': [2, 1],
    '11101': [1, 2],
    '11111': [2, 2], // Cross
    'null0': [4, 3], // Empty
    'null1': [3, 0],
    'null2': [3, 1],
    'null3': [0, 3],
    'null4': [1, 3]
};

/**
 * Create and layout all the nodes for the path, scenery, Pegman, and goal.
 */
Maze.drawMap = function() {
    var svg = document.getElementById('svgMaze');
    var scale = Math.max(Maze.ROWS, Maze.COLS) * Maze.SQUARE_SIZE;
    svg.setAttribute('viewBox', '0 0 ' + scale + ' ' + scale);

    // Draw the outer square.
    Blockly.utils.dom.createSvgElement('rect', {
        'height': Maze.MAZE_HEIGHT,
        'width': Maze.MAZE_WIDTH,
        'fill': '#F1EEE7',
        'stroke-width': 1,
        'stroke': '#CCB'
    }, svg);

    if (Maze.SKIN.background) {
        var tile = Blockly.utils.dom.createSvgElement('image', {
            'height': Maze.MAZE_HEIGHT,
            'width': Maze.MAZE_WIDTH,
            'x': 0,
            'y': 0
        }, svg);
        tile.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
            Maze.SKIN.background);
    }

    // Draw the tiles making up the maze map.

    // Return a value of '0' if the specified square is wall or out of bounds,
    // '1' otherwise (empty, start, finish).
    var normalize = function(x, y) {
        if (x < 0 || x >= Maze.COLS || y < 0 || y >= Maze.ROWS) {
            return '0';
        }
        return (Maze.map[y][x] == Maze.SquareType.WALL) ? '0' : '1';
    };

    // Compute and draw the tile for each square.
    var tileId = 0;
    for (var y = 0; y < Maze.ROWS; y++) {
        for (var x = 0; x < Maze.COLS; x++) {
            // Compute the tile shape.
            var tileShape = normalize(x, y) +
                normalize(x, y - 1) + // North.
                normalize(x + 1, y) + // West.
                normalize(x, y + 1) + // South.
                normalize(x - 1, y); // East.

            // Draw the tile.
            if (!Maze.tile_SHAPES[tileShape]) {
                // Empty square.  Use null0 for large areas, with null1-4 for borders.
                // Add some randomness to avoid large empty spaces.
                if (tileShape == '00000' && Math.random() > 0.3) {
                    tileShape = 'null0';
                } else {
                    tileShape = 'null' + Math.floor(1 + Math.random() * 4);
                }
            }
            var left = Maze.tile_SHAPES[tileShape][0];
            var top = Maze.tile_SHAPES[tileShape][1];
            // Tile's clipPath element.
            var tileClip = Blockly.utils.dom.createSvgElement('clipPath', {
                'id': 'tileClipPath' + tileId
            }, svg);
            Blockly.utils.dom.createSvgElement('rect', {
                'height': Maze.SQUARE_SIZE,
                'width': Maze.SQUARE_SIZE,
                'x': x * Maze.SQUARE_SIZE,
                'y': y * Maze.SQUARE_SIZE
            }, tileClip);
            // Tile sprite.
            var tile = Blockly.utils.dom.createSvgElement('image', {
                'height': Maze.SQUARE_SIZE * 4,
                'width': Maze.SQUARE_SIZE * 5,
                'clip-path': 'url(#tileClipPath' + tileId + ')',
                'x': (x - left) * Maze.SQUARE_SIZE,
                'y': (y - top) * Maze.SQUARE_SIZE
            }, svg);
            tile.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
                Maze.SKIN.tiles);
            tileId++;
        }
    }

    // Add finish marker.
    var finishMarker = Blockly.utils.dom.createSvgElement('image', {
        'id': 'finish',
        'height':44, //34,20
        'width': 30
    }, svg);
    finishMarker.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
        Maze.SKIN.marker);

    // Pegman's clipPath element, whose (x, y) is reset by Maze.displayPegman
    var pegmanClip = Blockly.utils.dom.createSvgElement('clipPath', {
        'id': 'pegmanClipPath'
    }, svg);
    Blockly.utils.dom.createSvgElement('rect', {
        'id': 'clipRect',
        'height': Maze.PEGMAN_HEIGHT,
        'width': Maze.PEGMAN_WIDTH
    }, pegmanClip);

    // Add Pegman.
    var pegmanIcon = Blockly.utils.dom.createSvgElement('image', {
        'id': 'pegman',
        'height': Maze.PEGMAN_HEIGHT,
        'width': Maze.PEGMAN_WIDTH * 21, // 49 * 21 = 1029
        'clip-path': 'url(#pegmanClipPath)'
    }, svg);
    pegmanIcon.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
        Maze.SKIN.sprite);
};

// Timer first attempt
Maze.startTimer = function() {
    var tick = function() {
        var min = String(Math.trunc(time / 60)).padStart(2, 0);
        var sec = String(time % 60).padStart(2, 0);
        Maze.levelData['time'] = min + ":" + sec;
        Maze.choiceLevelData['time'] = min + ':' + sec;
        time++;
    };
    // Set time to 5 minutes
    var time = 0;

    // Call the timer every second
    tick();
    Maze.timer = setInterval(tick, 1000);
}

Maze.countdown =function( elementName, minutes, seconds ){
    var element, endTime, hours, mins, msLeft, time;
    element
    function twoDigits( n )
    {
        return (n <= 9 ? "0" + n : n);
    }

    function updateTimer()
    {
        msLeft = endTime - (+new Date);
        if ( msLeft < 1000 ) {
            element.innerHTML = "0:00";
            Maze.choiceLevelData.submissionType = 'timeout';
            for (var i = 0; i < Maze.NUMBER_OF_ANSWERS; i++) {
                var choiceLevelInput = document.getElementById('choiceLevelInput' + (i+1)).value; // return value of input box
                choiceLevelInput = choiceLevelInput.toUpperCase();
                Maze.choiceLevelInputList[i] = choiceLevelInput;
            }
            Maze.saveChoiceData();
            Maze.switchLevel();
        } else {
            time = new Date( msLeft );
            hours = time.getUTCHours();
            mins = time.getUTCMinutes();
            element.innerHTML = (hours ? hours + ':' + twoDigits( mins ) : mins) + ':' + twoDigits( time.getUTCSeconds() );
            setTimeout( updateTimer, time.getUTCMilliseconds() + 500 );
        }
    }

    element = document.getElementById( elementName );
    endTime = (+new Date) + 1000 * (60*minutes + seconds) + 500;
    updateTimer();
}

/**
 * Initialize Blockly and the maze.  Called on page load.
 */
Maze.init = function() {

    // Render the Soy template.
    document.body.innerHTML = Maze.soy.start({}, null, {
        lang: BlocklyGames.LANG,
        level: BlocklyGames.LEVEL,
        kids : Maze.IS_KIDS_VERSION,
        maxLevel: BlocklyGames.MAX_LEVEL,
        skin: Maze.SKIN_ID,
        html: BlocklyGames.IS_HTML
    });

    BlocklyInterface.init();

    // Setup the Pegman menu.
    var pegmanImg = document.querySelector('#pegmanButton>img');
    pegmanImg.style.backgroundImage = 'url(' + Maze.SKIN.avatar + ')';
    var pegmanMenu = document.getElementById('pegmanMenu');
    var handlerFactory = function(n) {
        return function() {
            Maze.changePegman(n);

        };
    };
    for (var i = 0; i < Maze.SKINS.length; i++) {
        if (i == Maze.SKIN_ID) {
            continue;
        }
        var div = document.createElement('div');
        var img = document.createElement('img');
        img.src = 'common/1x1.gif';
        img.style.backgroundImage = 'url(' + Maze.SKINS[i].avatar + ')';
        div.appendChild(img);
        pegmanMenu.appendChild(div);
        Blockly.bindEvent_(div, 'mousedown', null, handlerFactory(i));
    }
    Blockly.bindEvent_(window, 'resize', null, Maze.hidePegmanMenu);
    var pegmanButton = document.getElementById('pegmanButton');
    Blockly.bindEvent_(pegmanButton, 'mousedown', null, Maze.showPegmanMenu);
    var pegmanButtonArrow = document.getElementById('pegmanButtonArrow');
    var arrow = document.createTextNode(Blockly.FieldDropdown.ARROW_CHAR);
    pegmanButtonArrow.appendChild(arrow);

    var rtl = BlocklyGames.isRtl();
    var blocklyDiv = document.getElementById('blockly');
    var visualization = document.getElementById('visualization');
    var onresize = function(e) {
        var top = visualization.offsetTop;
        blocklyDiv.style.top = Math.max(10, top - window.pageYOffset) + 'px';
        blocklyDiv.style.left = rtl ? '10px' : '460px';
        blocklyDiv.style.width = (window.innerWidth - 480) + 'px';
        blocklyDiv.style.bottom = '30px';
    };
    window.addEventListener('scroll', function() {
        onresize(null);
        Blockly.svgResize(BlocklyInterface.workspace);
    });
    window.addEventListener('resize', onresize);
    onresize(null);

    // Scale the workspace so level 1 = 1.3, and level 10 = 1.0.
    // έβγαλα από το zoom   { 'startScale': scale }
    if (Maze.IS_KIDS_VERSION == 1){
        var scale = 1.0;  // adding scale is needed to trigger the viewport event to show blocks left text
    }
    else {
        var scale = 0.8;  // adding scale is needed to trigger the viewport event to show blocks left text
    }
    BlocklyInterface.injectBlockly({
        'maxBlocks': Maze.MAX_BLOCKS,
        'rtl': rtl,
        'trashcan': true,
        'zoom': {'startScale': scale}
    });

    // Not really needed, there are no user-defined functions or variables.
    Blockly.JavaScript.addReservedWords('moveForward,moveBackward,' +
        'turnRight,turnLeft,isPathForward,isPathRight,isPathBackward,isPathLeft');

    Maze.drawMap();

    if (BlocklyGames.LEVEL == 1) {
        if (Maze.IS_KIDS_VERSION == 1){
            var defaultXml =
            '<xml>' +
            '<block ' + 'type="maze_moveForwardKids" x="70" y="70">' +
            '<next>' +
            '<block ' + 'type="maze_moveForwardKids" >' +
            '<next>' +
            '<block ' + 'type="maze_turn_rightKids" >' +
            '<next>' +
            '<block ' + 'type="maze_moveForwardKids" >' + '</block>' +
            '</next>' + //τέλος 5ου block
            '</block>' +
            '</next>' + //τέλος 4ου block
            '</block>' +
            '</next>' + //τέλος 3ου block
            '</block>' + // τέλος πρώτου block 
            '</xml>';
        }
        else{
            var defaultXml =
            '<xml>' +
            '<block ' + 'type="maze_moveForward" x="70" y="70">' +
            '<next>' +
            '<block ' + 'type="maze_moveForward" >' +
            '<next>' +
            '<block ' + 'type="maze_turn" ><field name="DIR">turnRight</field>'+
            '<next>' +
            '<block ' + 'type="maze_moveForward" >' + '</block>' +
            '</next>' + //τέλος 5ου block
            '</block>' +
            '</next>' + //τέλος 4ου block
            '</block>' +
            '</next>' + //τέλος 3ου block
            '</block>' + // τέλος πρώτου block 
            '</xml>';
        }        
        BlocklyInterface.setCode(defaultXml);
    }
    else{
        BlocklyInterface.loadBlocks(false);
    }
    // Locate the start and finish squares.
    for (var y = 0; y < Maze.ROWS; y++) {
        for (var x = 0; x < Maze.COLS; x++) {
            if (Maze.map[y][x] == Maze.SquareType.START) {
                Maze.start_ = { x: x, y: y };
                // Next IF ELSE creates closed route
            } else if (Maze.map[y][x] == Maze.SquareType.LOOP) {
                Maze.start_ = { x: x, y: y };
                Maze.finish_ = { x: x, y: y };
            } else if (Maze.map[y][x] == Maze.SquareType.FINISH) {
                Maze.finish_ = { x: x, y: y };
            } else if (Maze.map[y][x] == Maze.SquareType.OBSTACLE) {
                Maze.result = Maze.ResultType.FAILURE;
            }
        }
    }

    Maze.reset(true);
    BlocklyInterface.workspace.addChangeListener(function() { Maze.updateCapacity(); });
    BlocklyInterface.workspace.addChangeListener(BlocklyInterface.disconnectedBlocks); 

    document.body.addEventListener('mousemove', Maze.updatePegSpin_, true);

    BlocklyGames.bindClick('runButton', Maze.runButtonClick);
    BlocklyGames.bindClick('resetButton', Maze.resetButtonClick);
    //submit button
    BlocklyGames.bindClick('submitButton', Maze.submitButtonClick);

    if (BlocklyGames.LEVEL == 5 || BlocklyGames.LEVEL == 6 || BlocklyGames.LEVEL == 9 || BlocklyGames.LEVEL == 10 || BlocklyGames.LEVEL == 11) {
        BlocklyGames.bindClick('skipButton', Maze.skipButtonClick);
    }

    if (BlocklyGames.LEVEL == 7 || BlocklyGames.LEVEL == 8) {
        var hiddenskipbutton = document.getElementById('hiddenskipButton');
        hiddenskipbutton.style.display = 'inline';
        BlocklyGames.bindClick('hiddenskipButton', Maze.hiddenSkipButtonClick);
    }


    //======================================================================================================
    // We wait 5 seconds for Maze Level Help
    //All other levels get interactive help.  But wait 5 seconds for the
    // user to think a bit before they are told what to do.
    setTimeout(function() {
        BlocklyInterface.workspace.addChangeListener(Maze.levelHelp);
        Maze.levelHelp();
    }, 2000);

    if(BlocklyGames.LEVEL == 13){
        var finalImage = document.getElementById('finalImage');
        if(Maze.IS_KIDS_VERSION==1){
            finalImage.src = 'images/bee.gif';
            finalImage.style.textAlign = 'center';

        }
        else{
            finalImage.src = 'images/rocket.png';
            finalImage.style.width = '40%';
            finalImage.style.marginTop = '-176px';
        }
    }

    var buttonDiv = document.getElementById('dialogStopButtons');
    var pegSpin = document.createElement('img');
    pegSpin.id = 'pegSpinStop';
    pegSpin.src = 'common/1x1.gif';
    pegSpin.style.backgroundImage = 'url(' + Maze.SKIN.spriteDialog + ')';
    buttonDiv.parentNode.insertBefore(pegSpin, buttonDiv);

    // Lazy-load the JavaScript interpreter.
    BlocklyInterface.importInterpreter();
    // Lazy-load the syntax-highlighting.
    BlocklyInterface.importPrettify();

    // show dialogs or start timer
    if (BlocklyGames.LEVEL == 5 || BlocklyGames.LEVEL == 7 || BlocklyGames.LEVEL == 13){
        setTimeout(BlocklyDialogs.stop, 100)
    }
    else if (BlocklyGames.LEVEL == 2 || BlocklyGames.LEVEL == 3 || BlocklyGames.LEVEL == 4){
        setTimeout(BlocklyDialogs.stop, 100)
    }
    else{
        //put timer 
        if (Maze.timer) clearInterval(Maze.timer);
        Maze.startTimer();
    }
};

/**
 * Maze.ChoiceLevel initialization sequence -> all prio fields and blocks are created
 */
Maze.initChoice = function() {

    // Render the Soy template.
    document.body.innerHTML = Maze.soy.start({}, null, {
        lang: BlocklyGames.LANG,
        level: BlocklyGames.LEVEL,
        maxLevel: BlocklyGames.MAX_LEVEL,
        skin: Maze.SKIN_ID,
        html: BlocklyGames.IS_HTML
    });

    BlocklyInterface.init();

    // Setup the Pegman menu.
    var pegmanImg = document.querySelector('#pegmanButton>img');
    pegmanImg.style.backgroundImage = 'url(' + Maze.SKIN.avatar + ')';
    var pegmanMenu = document.getElementById('pegmanMenu');
    var handlerFactory = function(n) {
        return function() {
            Maze.changePegman(n);

        };
    };
    for (var i = 0; i < Maze.SKINS.length; i++) {
        if (i == Maze.SKIN_ID) {
            continue;
        }
        var div = document.createElement('div');
        var img = document.createElement('img');
        img.src = 'common/1x1.gif';
        img.style.backgroundImage = 'url(' + Maze.SKINS[i].avatar + ')';
        div.appendChild(img);
        pegmanMenu.appendChild(div);
        Blockly.bindEvent_(div, 'mousedown', null, handlerFactory(i));
    }
    Blockly.bindEvent_(window, 'resize', null, Maze.hidePegmanMenu);
    var pegmanButton = document.getElementById('pegmanButton');
    Blockly.bindEvent_(pegmanButton, 'mousedown', null, Maze.showPegmanMenu);
    var pegmanButtonArrow = document.getElementById('pegmanButtonArrow');
    var arrow = document.createTextNode(Blockly.FieldDropdown.ARROW_CHAR);
    pegmanButtonArrow.appendChild(arrow);

    var rtl = BlocklyGames.isRtl();
    var blocklyDiv = document.getElementById('blockly');
    var visualization = document.getElementById('visualization');
    var onresize = function(e) {
        var top = visualization.offsetTop;
        blocklyDiv.style.top = Math.max(10, top - window.pageYOffset) + 'px';
        blocklyDiv.style.left = rtl ? '10px' : '460px';
        blocklyDiv.style.width = (window.innerWidth - 480) + 'px';
        blocklyDiv.style.bottom = '30px';
    };
    window.addEventListener('scroll', function() {
        onresize(null);
        Blockly.svgResize(BlocklyInterface.workspace);
    });
    window.addEventListener('resize', onresize);
    onresize(null);

    BlocklyInterface.injectBlockly({
        'maxBlocks': Maze.MAX_BLOCKS,
        'rtl': rtl,
        'trashcan': false,
        'zoom':{
            startScale: 0.5
        },
        'readOnly': true
    });       

    // Not really needed, there are no user-defined functions or variables.
    Blockly.JavaScript.addReservedWords('moveForward,moveBackward,' +
        'turnRight,turnLeft,isPathForward,isPathRight,isPathBackward,isPathLeft');

    Maze.drawMap();

    var letters = ["1","2","3","4","5"];
    var lettersUsed = [];
    var numberOfAnswers=0;
    for (var level = BlocklyGames.DIVERGENT_1; level < (BlocklyGames.DIVERGENT_1 + 5); level ++) {
       var code = BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME, level);
       if(code){
        var xml = Blockly.Xml.textToDom(code);
        if (xml.childElementCount != 0){
                var letter = letters[numberOfAnswers]
                BlocklyInterface.loadMazeChoice(code, false, letter);
                numberOfAnswers += 1;
                lettersUsed.push(letter);
        }
       }
    }
    Maze.LETTERS_USED = lettersUsed;

    if(numberOfAnswers == 0){
        Maze.NUMBER_OF_ANSWERS = 0;
        var el = document.getElementById('both-groups');
        el.style.display = "none";
        var el = document.getElementById('submitButton');
        el.style.display = "none";
    }
    else if(numberOfAnswers == 1){
        Maze.NUMBER_OF_ANSWERS = 1;
        var el = document.getElementById('input-group2');
        el.style.display = "none";
        var input = document.getElementById('choiceLevelInput1');
        input.value = Maze.LETTERS_USED[0];
    }
    else {
        Maze.NUMBER_OF_ANSWERS = 2;
    }

    // Locate the start and finish squares.
    for (var y = 0; y < Maze.ROWS; y++) {
        for (var x = 0; x < Maze.COLS; x++) {
            if (Maze.map[y][x] == Maze.SquareType.START) {
                Maze.start_ = { x: x, y: y };
                // Next IF ELSE creates closed route
            } else if (Maze.map[y][x] == Maze.SquareType.LOOP) {
                Maze.start_ = { x: x, y: y };
                Maze.finish_ = { x: x, y: y };
            } else if (Maze.map[y][x] == Maze.SquareType.FINISH) {
                Maze.finish_ = { x: x, y: y };
            } else if (Maze.map[y][x] == Maze.SquareType.OBSTACLE) {
                Maze.result = Maze.ResultType.FAILURE;
            }
        }
    }

    Maze.reset(true);
    BlocklyInterface.workspace.addChangeListener(function() { Maze.updateCapacity(); });
    
    document.body.addEventListener('mousemove', Maze.updatePegSpin_, true);

    //submit button
    BlocklyGames.bindClick('submitButton', Maze.submitButtonClick);

    //======================================================================================================
    // We wait 5 seconds for Maze Level Help
    //All other levels get interactive help.  But wait 5 seconds for the
    // user to think a bit before they are told what to do.
    setTimeout(function() {
        BlocklyInterface.workspace.addChangeListener(Maze.levelHelp);
        Maze.levelHelp();
    }, 2000);

    var buttonDiv = document.getElementById('dialogStopButtons');
    var pegSpin = document.createElement('img');
    pegSpin.id = 'pegSpinStop';
    pegSpin.src = 'common/1x1.gif';
    pegSpin.style.backgroundImage = 'url(' + Maze.SKIN.spriteDialog + ')';
    buttonDiv.parentNode.insertBefore(pegSpin, buttonDiv);

    // Lazy-load the JavaScript interpreter.
    BlocklyInterface.importInterpreter();
    // Lazy-load the syntax-highlighting.
    BlocklyInterface.importPrettify();

    if(Maze.NUMBER_OF_ANSWERS == 0){
        Maze.choiceLevelData.submissionType = 'skipped level 7 and 8';
        Maze.saveChoiceData();
        alert("Da Lösungen für Level 7 und 8 übersprungen wurden, \n wirst Du direkt zu Level 13 weitergeleitet.");
        BlocklyInterface.nextLevel();
    }
    else{
        setTimeout(BlocklyDialogs.stop, 100);
    }
};

/**
 * When the workspace changes, update the help as needed.
 * @param {Blockly.Events.Abstract=} opt_event Custom data for event.
 */
Maze.levelHelp = function(opt_event) {
    //TODO: if needed look up in the BlocklyGames for the needed code
}
/**
 * Updates the document's 'capacity' element with a message
 * indicating how many more blocks are permitted.  The capacity
 * is retrieved from BlocklyInterface.workspace.remainingCapacity().
 */
 Maze.updateCapacity = function() {
    var cap = BlocklyInterface.workspace.remainingCapacity();
    var p = document.getElementById('capacity');
    if (cap == Infinity) {
      p.style.display = 'none';
    } else {
      p.style.display = 'inline';
      p.innerHTML = '';
      cap = Number(cap);
      var capSpan = document.createElement('span');
      capSpan.className = 'capacityNumber';
      capSpan.appendChild(document.createTextNode(cap));
      if (cap == 0) {
        var msg = BlocklyGames.getMsg('Maze_capacity0');
      } else if (cap == 1) {
        var msg = BlocklyGames.getMsg('Maze_capacity1');
      } else {
        var msg = BlocklyGames.getMsg('Maze_capacity2');
      }
      var parts = msg.split(/%\d/);
      for (var i = 0; i < parts.length; i++) {
        p.appendChild(document.createTextNode(parts[i]));
        if (i != parts.length - 1) {
          p.appendChild(capSpan.cloneNode(true));
        }
      }
    }
  };

/**
 * Reload with a different Pegman skin.
 * @param {number} newSkin ID of new skin.
 */
Maze.changePegman = function(newSkin) {
    BlocklyInterface.saveToSessionStorage();
    location = location.protocol + '//' + location.host + location.pathname +
        '?lang=' + BlocklyGames.LANG + '&level=' + BlocklyGames.LEVEL +
        '&skin=' + newSkin;
};

/**
 * Display the Pegman skin-change menu.
 * @param {!Event} e Mouse, touch, or resize event.
 */
Maze.showPegmanMenu = function(e) {
    var menu = document.getElementById('pegmanMenu');
    if (menu.style.display == 'block') {
        // Menu is already open.  Close it.
        Maze.hidePegmanMenu(e);
        return;
    }
    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
        return;
    }
    var button = document.getElementById('pegmanButton');
    button.classList.add('buttonHover');
    menu.style.top = (button.offsetTop + button.offsetHeight) + 'px';
    menu.style.left = button.offsetLeft + 'px';
    menu.style.display = 'block';
    Maze.pegmanMenuMouse_ =
        Blockly.bindEvent_(document.body, 'mousedown', null, Maze.hidePegmanMenu);
    // Close the skin-changing hint if open.
    var hint = document.getElementById('dialogHelpSkins');
    if (hint && hint.className != 'dialogHiddenContent') {
        BlocklyDialogs.hideDialog(false);
    }
    Maze.showPegmanMenu.activatedOnce = true;
};

/**
 * Hide the Pegman skin-change menu.
 * @param {!Event} e Mouse, touch, or resize event.
 */
Maze.hidePegmanMenu = function(e) {
    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
        return;
    }
    document.getElementById('pegmanMenu').style.display = 'none';
    document.getElementById('pegmanButton').classList.remove('buttonHover');
    if (Maze.pegmanMenuMouse_) {
        Blockly.unbindEvent_(Maze.pegmanMenuMouse_);
        delete Maze.pegmanMenuMouse_;
    }
};

/**
 * Reset the maze to the start position and kill any pending animation tasks.
 * @param {boolean} first True if an opening animation is to be played.
 */
Maze.reset = function(first) {
    // Kill all tasks.
    for (var i = 0; i < Maze.pidList.length; i++) {
        clearTimeout(Maze.pidList[i]);
    }
    Maze.pidList = [];

    // Move Pegman into position.
    Maze.pegmanX = Maze.start_.x;
    Maze.pegmanY = Maze.start_.y;

    if (first) {
        // Opening animation.
        Maze.pegmanD = Maze.startDirection + 1;
        Maze.scheduleFinish(false);
        Maze.pidList.push(setTimeout(function() {
            Maze.stepSpeed = 100;
            Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4], [Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4 - 4]);
            Maze.pegmanD++;
        }, Maze.stepSpeed * 5));
    } else {
        Maze.pegmanD = Maze.startDirection;
        Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4);
    }

    // Move the finish icon into position.
    var finishIcon = document.getElementById('finish');
    finishIcon.setAttribute('x', Maze.SQUARE_SIZE * (Maze.finish_.x + 0.5) -
        finishIcon.getAttribute('width') / 2);
    finishIcon.setAttribute('y', Maze.SQUARE_SIZE * (Maze.finish_.y + 0.6) -
        finishIcon.getAttribute('height'));

    // Make 'look' icon invisible and promote to top.
    var lookIcon = document.getElementById('look');
    lookIcon.style.display = 'none';
    lookIcon.parentNode.appendChild(lookIcon);
    var paths = lookIcon.getElementsByTagName('path');
    for (var i = 0, path;
        (path = paths[i]); i++) {
        path.setAttribute('stroke', Maze.SKIN.look);
    }
};

/**
 * Click the run button.  Start the program.
 * @param {!Event} e Mouse or touch event.
 */
Maze.runButtonClick = function(e) {
    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
        return;
    }

    BlocklyDialogs.hideDialog(false);

    var runButton = document.getElementById('runButton');
    var resetButton = document.getElementById('resetButton');
    // Ensure that Reset button is at least as wide as Run button.
    if (!resetButton.style.minWidth) {
        resetButton.style.minWidth = runButton.offsetWidth + 'px';
    }
    runButton.style.display = 'none'; //changed from none
    resetButton.style.display = 'inline';
    Maze.reset(false);
    Maze.execute("run");

    // save results 
    var textLog = [];
    for(var i=0; i < Maze.log.length; i++){
        textLog.push(Maze.log[i][0]);
    }
    Maze.levelData.allSubmitted.mazeLog.push(textLog);
    var encoded = [Maze.saveWorkspace()];
    Maze.levelData.allSubmitted.code.push(encoded);
    Maze.levelData.allSubmitted.resultType.push(Maze.setResult());
    Maze.levelData.allSubmitted.timestamp.push(new Date().toISOString());
    Maze.levelData.playPressedCount += 1;

    console.log(Maze.levelData);
};

Maze.setResult = function() {
    switch (Maze.result) {
        case 0:
             return "UNSET";
        case 1:
            return "SUCCESS";
        case 2:
            return "TIMEOUT"
        case -1:
            return "FAILURE";
        case -2:
            return "ERROR";
      }
}


// Effort for Skip Button
Maze.skipButtonClick = function(e) {

    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
        return;
    }
    BlocklyDialogs.hideDialog(false);

    Maze.reset(false);
    Maze.execute("skip");
    Maze.levelData.submissionType = "skip";
    Maze.saveData();

    BlocklyInterface.skipLevel(BlocklyGames.LEVEL);
};

// Effort for Skip Button
Maze.hiddenSkipButtonClick = function(e) {

    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
        return;
    }
    BlocklyDialogs.hideDialog(false);

    Maze.reset(false);
    Maze.execute("hiddenSkip");
    Maze.levelData.submissionType = "hiddenSkip";
    Maze.saveData(); 

    BlocklyInterface.skipLevel(BlocklyGames.LEVEL);
};

// Add dialogs to blockly!
Maze.switchLevel = function () {
    if (BlocklyGames.LEVEL == 13){
        //TODO: finish + thank you
        setTimeout(BlocklyDialogs.finish, 1000);
    }
    else{
        setTimeout(BlocklyInterface.nextLevel, 2000);
    }
}

// Effort for Submit Button
Maze.submitButtonClick = function(e) {
    // save time
    clearInterval(Maze.timer);

    if(BlocklyGames.LEVEL == BlocklyGames.CHOICE_LEVEL){
        Maze.submitChoiceLevel(e);
    }
    else{
        // Prevent double-clicks or double-taps.
        if (BlocklyInterface.eventSpam(e)) {
            return;
        }
        BlocklyDialogs.hideDialog(false);
        
        // set true so that in Maze.animate no congratulations is displayed
        Maze.submitPressed = true;
        Maze.levelData.submissionType = "submit"; // add submitPressed

        // Check if blocks have been selected.
        if (BlocklyGames.LEVEL != 13){
            if (BlocklyInterface.workspace.getTopBlocks(false).length == 0) { 
                //Maze.levelHelp(); TODO: maybe use Maze.levelHelp() instead of alert?
                alert("Bitte wähle ein paar Blöcke vor der Abgabe aus.");
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


        if (BlocklyGames.LEVEL == 5 || BlocklyGames.LEVEL == 6 || BlocklyGames.LEVEL == 9 || BlocklyGames.LEVEL == 10 || BlocklyGames.LEVEL == 11) {   // change level 1 to 9
            var skipButton = document.getElementById('skipButton');      
            skipButton.style.display = 'none';
        }

        Maze.reset(false);
        Maze.execute("submit");
        Maze.saveData();
    }   
}

Maze.saveData = function(){
    // save result
    // convert the saved code to xmldom to text to encode 
    //var code = BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME, BlocklyGames.LEVEL);
    
    var textLog = [];
    if(Maze.log){
        for(var i=0; i < Maze.log.length; i++){
            textLog.push(Maze.log[i][0]);
        }
        Maze.levelData.finalCode.mazeLog.push(textLog);
    }
    var encoded = Maze.saveWorkspace();
    Maze.levelData.finalCode.code = encoded; 
    Maze.levelData.finalCode.resultType = Maze.setResult();
    Maze.levelData.finalCode.timestamp = new Date().toISOString();

    console.log(Maze.levelData);
    var json = JSON.stringify(Maze.levelData);
    BlocklyInterface.uploadToServer(BlocklyGames.loadUserCode(), BlocklyGames.LEVEL, json);

    if(BlocklyGames.LEVEL == 13){
        let startTime = new Date(BlocklyGames.loadStartTime());
        let endTime = new Date();
        let minutes = (endTime - startTime) / (1000 * 60);
        minutes = minutes.toFixed(2);
        BlocklyInterface.addTimeDiff(BlocklyGames.loadUserCode(), minutes);
    }
}

Maze.submitChoiceLevel = function(e){
    var submitButton = document.getElementById('submitButton');
    //var input = false; set a variable to true false depending on if real content was submitted
    var already_alerted = false;
    var isClean = false;
    for (var i = 0; i < Maze.NUMBER_OF_ANSWERS; i++) {
        var choiceLevelInput = document.getElementById('choiceLevelInput' + (i+1)).value; // return value of input box
        choiceLevelInput = choiceLevelInput.toUpperCase();
        Maze.choiceLevelInputList[i] = choiceLevelInput;
        if (already_alerted){
            break;
        }
        // TODO: move alert text to template.soy
        if (choiceLevelInput === ""){
            isClean = false;
            alert("Bitte fülle alle Felder aus.");
            already_alerted = true;
        }
        else if (!Maze.LETTERS_USED.includes(choiceLevelInput)){ // if it is NOT clean
            isClean = false;
            alert("Verwende bitte nur die aufgelisteten Zahlen.");
            already_alerted = true;
        }
        else{
            isClean = true;
        }
    }

    if(Maze.hasDuplicates(Maze.choiceLevelInputList)){
        isClean = false;
        if (!already_alerted){
            alert("Verwende bitte keinen Zahlen doppelt.");
        }
    }

    if(isClean){
        submitButton.style.display = 'none';
        Maze.saveChoiceData();
        Maze.switchLevel();
    } 
}

Maze.saveChoiceData = function() {
    // save prios
    for (var i = 0; i < Maze.choiceLevelInputList.length; i++) {
        Maze.choiceLevelData["prio"+(i+1)] = Maze.choiceLevelInputList[i];
    }

    console.log(Maze.choiceLevelData);

    BlocklyInterface.saveChoiceLevelToLocalStorage(Maze.choiceLevelData);
    var json = JSON.stringify(Maze.choiceLevelData);
    BlocklyInterface.uploadToServer(BlocklyGames.loadUserCode(), BlocklyGames.LEVEL, json);
    // input boolean to validate that its a submission with actual input
    //Maze.choiceLevelData[0].prio1 = window.localStorage.getItem()    TODO: add sabing mechanism for prios
}

Maze.hasDuplicates = function(array) {
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

/**
 * Click the reset button.  Reset the maze.
 * @param {!Event} e Mouse or touch event.
 */
Maze.resetButtonClick = function(e) {
    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
        return;
    }
    var runButton = document.getElementById('runButton');
    var resetButton = document.getElementById('resetButton');
    resetButton.style.display = 'none';
    runButton.style.display = 'inline';
    BlocklyInterface.workspace.highlightBlock(null);
    Maze.reset(false);
};

/**
 * Inject the Maze API into a JavaScript interpreter.
 * @param {!Interpreter} interpreter The JS-Interpreter.
 * @param {!Interpreter.Object} globalObject Global object.
 */
Maze.initInterpreter = function(interpreter, globalObject) {
    // API
    var wrapper;
    wrapper = function(id) {
        Maze.move(0, id);
    };
    interpreter.setProperty(globalObject, 'moveForward',
        interpreter.createNativeFunction(wrapper));
    wrapper = function(id) {
        Maze.move(2, id);
    };
    interpreter.setProperty(globalObject, 'moveBackward',
        interpreter.createNativeFunction(wrapper));
    wrapper = function(id) {
        Maze.turn(0, id);
    };
    interpreter.setProperty(globalObject, 'turnLeft',
        interpreter.createNativeFunction(wrapper));
    wrapper = function(id) {
        Maze.turn(1, id);
    };
    interpreter.setProperty(globalObject, 'turnRight',
        interpreter.createNativeFunction(wrapper));
    wrapper = function(id) {
        return Maze.isPath(0, id);
    };
    interpreter.setProperty(globalObject, 'isPathForward',
        interpreter.createNativeFunction(wrapper));
    wrapper = function(id) {
        return Maze.isPath(1, id);
    };
    interpreter.setProperty(globalObject, 'isPathRight',
        interpreter.createNativeFunction(wrapper));
    wrapper = function(id) {
        return Maze.isPath(2, id);
    };
    interpreter.setProperty(globalObject, 'isPathBackward',
        interpreter.createNativeFunction(wrapper));
    wrapper = function(id) {
        return Maze.isPath(3, id);
    };
    interpreter.setProperty(globalObject, 'isPathLeft',
        interpreter.createNativeFunction(wrapper));
    wrapper = function() {
        return Maze.notDone();
    };
    interpreter.setProperty(globalObject, 'notDone',
        interpreter.createNativeFunction(wrapper));
};

/**
 * Execute the user's code.  Heaven help us...
 */
Maze.execute = function(submissionType) {
    if (!('Interpreter' in window)) {
        // Interpreter lazy loads and hasn't arrived yet.  Try again later.
        setTimeout(Maze.execute(submissionType), 250);
        return;
    }

    Maze.log = [];
    Blockly.selected && Blockly.selected.unselect();
    var code = BlocklyInterface.getJsCode();
    BlocklyInterface.executedJsCode = code;
    BlocklyInterface.executedCode = BlocklyInterface.getCode();
    Maze.result = Maze.ResultType.UNSET;
    var interpreter = new Interpreter(code, Maze.initInterpreter);

    // Try running the user's code.  There are four possible outcomes:
    // 1. If pegman reaches the finish [SUCCESS], true is thrown.
    // 2. If the program is terminated due to running too long [TIMEOUT],
    //    false is thrown.
    // 3. If another error occurs [ERROR], that error is thrown.
    // 4. If the program ended normally but without solving the maze [FAILURE],
    //    no error or exception is thrown.
    try {
        var ticks = 300; // 10k ticks runs Pegman for about 8 minutes.
        while (interpreter.step()) {
            if (ticks-- == 0) {
                throw Infinity;
            }
            if (code.includes('while ')){
                if (!Maze.notDone()){
                    break;
                }
            }
        }
        Maze.result = Maze.notDone() ?
            Maze.ResultType.FAILURE : Maze.ResultType.SUCCESS;
    } catch (e) {
        // A boolean is thrown for normal termination.
        // Abnormal termination is a user error.
        if (e === Infinity) {
            Maze.result = Maze.ResultType.TIMEOUT;
        } else if (e === false) {
            Maze.result = Maze.ResultType.ERROR;
        } else {
            // Syntax error, can't happen.
            Maze.result = Maze.ResultType.ERROR;
            alert(e);
        }
    }

    if(submissionType == "submit") {
        // Fast animation if execution is successful.  Slow otherwise.
        if (Maze.result == Maze.ResultType.SUCCESS) {
            Maze.stepSpeed = 50;
            Maze.log.push(['finish', null]);
        } else {
            Maze.stepSpeed = 100;
            //στην περίπτωση που δεν έχουμε success δεν θέλουμε να τρέχει τον κώδικα
            Maze.log.push(['end', null]);
        }
        // Maze.log now contains a transcript of all the user's actions.
        // Reset the maze and animate the transcript.
        Maze.reset(false);
        Maze.pidList.push(setTimeout(Maze.animate, 100));
    }
    else if (submissionType == "run") {
        // Fast animation if execution is successful.  Slow otherwise.
        if (Maze.result == Maze.ResultType.SUCCESS) {
            Maze.log.push(['finish', null]);
        } else {
            Maze.log.push(['end', null]);
        }
        // Maze.log now contains a transcript of all the user's actions.
        // Reset the maze and animate the transcript.
        Maze.reset(false);
        Maze.pidList.push(setTimeout(Maze.animate, 100));
    }
    else {
        if (Maze.result == Maze.ResultType.SUCCESS) {
            Maze.log.push(['finish', null]);
        } else {
            Maze.log.push(['end', null]);
        }
        // Maze.log now contains a transcript of all the user's actions.
        // Reset the maze and animate the transcript.
        Maze.reset(false);
    }
};


/**
 * Iterate through the recorded path and animate pegman's actions.
 */
Maze.animate = function() {
    var action = Maze.log.shift();
    if (!action) {
        BlocklyInterface.highlight(null);
        Maze.levelHelp();
        return;
    }
    BlocklyInterface.highlight(action[1]);

    switch (action[0]) {
        case 'north':
            Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4], [Maze.pegmanX, Maze.pegmanY - 1, Maze.pegmanD * 4]);
            Maze.pegmanY--;
            break;
        case 'east':
            Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4], [Maze.pegmanX + 1, Maze.pegmanY, Maze.pegmanD * 4]);
            Maze.pegmanX++;
            break;
        case 'south':
            Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4], [Maze.pegmanX, Maze.pegmanY + 1, Maze.pegmanD * 4]);
            Maze.pegmanY++;
            break;
        case 'west':
            Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4], [Maze.pegmanX - 1, Maze.pegmanY, Maze.pegmanD * 4]);
            Maze.pegmanX--;
            break;
        case 'look_north':
            Maze.scheduleLook(Maze.DirectionType.NORTH);
            break;
        case 'look_east':
            Maze.scheduleLook(Maze.DirectionType.EAST);
            break;
        case 'look_south':
            Maze.scheduleLook(Maze.DirectionType.SOUTH);
            break;
        case 'look_west':
            Maze.scheduleLook(Maze.DirectionType.WEST);
            break;
        case 'fail_forward':
            Maze.scheduleFail(true);
            break;
        case 'fail_backward':
            Maze.scheduleFail(false);
            break;
        case 'left':
            Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4], [Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4 - 4]);
            Maze.pegmanD = Maze.constrainDirection4(Maze.pegmanD - 1);
            break;
        case 'right':
            Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4], [Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4 + 4]);
            Maze.pegmanD = Maze.constrainDirection4(Maze.pegmanD + 1);
            break;
            // we put the case below if we have a fail and press Submit
        case 'end':
            if(Maze.submitPressed){
                BlocklyInterface.saveToLocalStorage(); 
                Maze.switchLevel();
            }
            break;
        case 'finish':
            Maze.scheduleFinish(false);
            if(Maze.submitPressed){
                BlocklyInterface.saveToLocalStorage();
                Maze.switchLevel();
            }
            break;
    }

    Maze.pidList.push(setTimeout(Maze.animate, Maze.stepSpeed * 5));
};

/**
 * Point the congratulations Pegman to face the mouse.
 * @param {Event} e Mouse move event.
 * @private
 */
Maze.updatePegSpin_ = function(e) {

    if (document.getElementById('dialogDone').className == 'dialogHiddenContent'){
        var pegSpin = document.getElementById('pegSpinStop');
    }
    else{
        return
    }
    var bBox = BlocklyDialogs.getBBox_(pegSpin);
    var x = bBox.x + bBox.width / 2 - window.pageXOffset;
    var y = bBox.y + bBox.height / 2 - window.pageYOffset;
    var dx = e.clientX - x;
    var dy = e.clientY - y;
    var angle = Blockly.utils.math.toDegrees(Math.atan(dy / dx));
    // 0: North, 90: East, 180: South, 270: West.
    if (dx > 0) {
        angle += 90;
    } else {
        angle += 270;
    }
    // Divide into 16 quads.
    var quad = Math.round(angle / 360 * 16);
    if (quad == 16) {
        quad = 15;
    }
    // Display correct Pegman sprite.
    pegSpin.style.backgroundPosition = (-quad * Maze.PEGMAN_WIDTH) + 'px 0px';
};

/**
 * Schedule the animations for a move or turn.
 * @param {!Array.<number>} startPos X, Y and direction starting points.
 * @param {!Array.<number>} endPos X, Y and direction ending points.
 */
Maze.schedule = function(startPos, endPos) {
    var deltas = [(endPos[0] - startPos[0]) / 4,
        (endPos[1] - startPos[1]) / 4,
        (endPos[2] - startPos[2]) / 4
    ];
    Maze.displayPegman(startPos[0] + deltas[0],
        startPos[1] + deltas[1],
        Maze.constrainDirection16(startPos[2] + deltas[2]));
    Maze.pidList.push(setTimeout(function() {
        Maze.displayPegman(startPos[0] + deltas[0] * 2,
            startPos[1] + deltas[1] * 2,
            Maze.constrainDirection16(startPos[2] + deltas[2] * 2));
    }, Maze.stepSpeed));
    Maze.pidList.push(setTimeout(function() {
        Maze.displayPegman(startPos[0] + deltas[0] * 3,
            startPos[1] + deltas[1] * 3,
            Maze.constrainDirection16(startPos[2] + deltas[2] * 3));
    }, Maze.stepSpeed * 2));
    Maze.pidList.push(setTimeout(function() {
        Maze.displayPegman(endPos[0], endPos[1],
            Maze.constrainDirection16(endPos[2]));
    }, Maze.stepSpeed * 3));
};

/**
 * Schedule the animations and sounds for a failed move.
 * @param {boolean} forward True if forward, false if backward.
 */
Maze.scheduleFail = function(forward) {
    var deltaX = 0;
    var deltaY = 0;
    switch (Maze.pegmanD) {
        case Maze.DirectionType.NORTH:
            deltaY = -1;
            break;
        case Maze.DirectionType.EAST:
            deltaX = 1;
            break;
        case Maze.DirectionType.SOUTH:
            deltaY = 1;
            break;
        case Maze.DirectionType.WEST:
            deltaX = -1;
            break;
    }
    if (!forward) {
        deltaX = -deltaX;
        deltaY = -deltaY;
    }
    if (Maze.SKIN.crashType == Maze.CRASH_STOP) {
        // Bounce bounce.
        deltaX /= 4;
        deltaY /= 4;
        var direction16 = Maze.constrainDirection16(Maze.pegmanD * 4);
        Maze.displayPegman(Maze.pegmanX + deltaX,
            Maze.pegmanY + deltaY,
            direction16);
        BlocklyInterface.workspace.getAudioManager().play('fail', 0.5);
        Maze.pidList.push(setTimeout(function() {
            Maze.displayPegman(Maze.pegmanX,
                Maze.pegmanY,
                direction16);
        }, Maze.stepSpeed));
        Maze.pidList.push(setTimeout(function() {
            Maze.displayPegman(Maze.pegmanX + deltaX,
                Maze.pegmanY + deltaY,
                direction16);
            BlocklyInterface.workspace.getAudioManager().play('fail', 0.5);
        }, Maze.stepSpeed * 2));
        Maze.pidList.push(setTimeout(function() {
            Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, direction16);
        }, Maze.stepSpeed * 3));
    } else {
        // Add a small random delta away from the grid.
        var deltaZ = (Math.random() - 0.5) * 10;
        var deltaD = (Math.random() - 0.5) / 2;
        deltaX += (Math.random() - 0.5) / 4;
        deltaY += (Math.random() - 0.5) / 4;
        deltaX /= 8;
        deltaY /= 8;
        var acceleration = 0;
        if (Maze.SKIN.crashType == Maze.CRASH_FALL) {
            acceleration = 0.01;
        }
        Maze.pidList.push(setTimeout(function() {
            BlocklyInterface.workspace.getAudioManager().play('fail', 0.5);
        }, Maze.stepSpeed * 2));
        var setPosition = function(n) {
            return function() {
                var direction16 = Maze.constrainDirection16(Maze.pegmanD * 4 +
                    deltaD * n);
                Maze.displayPegman(Maze.pegmanX + deltaX * n,
                    Maze.pegmanY + deltaY * n,
                    direction16,
                    deltaZ * n);
                deltaY += acceleration;
            };
        };
        // 100 frames should get Pegman offscreen.
        for (var i = 1; i < 100; i++) {
            Maze.pidList.push(setTimeout(setPosition(i),
                Maze.stepSpeed * i / 2));
        }
    }
};

/**
 * Schedule the animations and sound for a victory dance.
 * @param {boolean} sound Play the victory sound.
 */
Maze.scheduleFinish = function(sound) {
    var direction16 = Maze.constrainDirection16(Maze.pegmanD * 4);
    Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, 16);
    if (sound) {
        BlocklyInterface.workspace.getAudioManager().play('win', 0.5);
    }
    Maze.stepSpeed = 150; // Slow down victory animation a bit.
    Maze.pidList.push(setTimeout(function() {
        Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, 18);
    }, Maze.stepSpeed));
    Maze.pidList.push(setTimeout(function() {
        Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, 16);
    }, Maze.stepSpeed * 2));
    Maze.pidList.push(setTimeout(function() {
        Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, direction16);
    }, Maze.stepSpeed * 3));
};

/**
 * Display Pegman at the specified location, facing the specified direction.
 * @param {number} x Horizontal grid (or fraction thereof).
 * @param {number} y Vertical grid (or fraction thereof).
 * @param {number} d Direction (0 - 15) or dance (16 - 17).
 * @param {number=} opt_angle Optional angle (in degrees) to rotate Pegman.
 */
Maze.displayPegman = function(x, y, d, opt_angle) {
    var pegmanIcon = document.getElementById('pegman');
    pegmanIcon.setAttribute('x',
        x * Maze.SQUARE_SIZE - d * Maze.PEGMAN_WIDTH + 1);
    pegmanIcon.setAttribute('y',
        Maze.SQUARE_SIZE * (y + 0.5) - Maze.PEGMAN_HEIGHT / 2 - 8);
    if (opt_angle) {
        pegmanIcon.setAttribute('transform', 'rotate(' + opt_angle + ', ' +
            (x * Maze.SQUARE_SIZE + Maze.SQUARE_SIZE / 2) + ', ' +
            (y * Maze.SQUARE_SIZE + Maze.SQUARE_SIZE / 2) + ')');
    } else {
        pegmanIcon.setAttribute('transform', 'rotate(0, 0, 0)');
    }

    var clipRect = document.getElementById('clipRect');
    clipRect.setAttribute('x', x * Maze.SQUARE_SIZE + 1);
    clipRect.setAttribute('y', pegmanIcon.getAttribute('y'));
};

/**
 * Display the look icon at Pegman's current location,
 * in the specified direction.
 * @param {!Maze.DirectionType} d Direction (0 - 3).
 */
Maze.scheduleLook = function(d) {
    var x = Maze.pegmanX;
    var y = Maze.pegmanY;
    switch (d) {
        case Maze.DirectionType.NORTH:
            x += 0.5;
            break;
        case Maze.DirectionType.EAST:
            x += 1;
            y += 0.5;
            break;
        case Maze.DirectionType.SOUTH:
            x += 0.5;
            y += 1;
            break;
        case Maze.DirectionType.WEST:
            y += 0.5;
            break;
    }
    x *= Maze.SQUARE_SIZE;
    y *= Maze.SQUARE_SIZE;
    var deg = d * 90 - 45;

    var lookIcon = document.getElementById('look');
    lookIcon.setAttribute('transform',
        'translate(' + x + ', ' + y + ') ' +
        'rotate(' + deg + ' 0 0) scale(.4)');
    var paths = lookIcon.getElementsByTagName('path');
    lookIcon.style.display = 'inline';
    for (var i = 0, path;
        (path = paths[i]); i++) {
        Maze.scheduleLookStep(path, Maze.stepSpeed * i);
    }
};

/**
 * Schedule one of the 'look' icon's waves to appear, then disappear.
 * @param {!Element} path Element to make appear.
 * @param {number} delay Milliseconds to wait before making wave appear.
 */
Maze.scheduleLookStep = function(path, delay) {
    Maze.pidList.push(setTimeout(function() {
        path.style.display = 'inline';
        setTimeout(function() {
            path.style.display = 'none';
        }, Maze.stepSpeed * 2);
    }, delay));
};

/**
 * Keep the direction within 0-3, wrapping at both ends.
 * @param {number} d Potentially out-of-bounds direction value.
 * @return {number} Legal direction value.
 */
Maze.constrainDirection4 = function(d) {
    d = Math.round(d) % 4;
    if (d < 0) {
        d += 4;
    }
    return d;
};

/**
 * Keep the direction within 0-15, wrapping at both ends.
 * @param {number} d Potentially out-of-bounds direction value.
 * @return {number} Legal direction value.
 */
Maze.constrainDirection16 = function(d) {
    d = Math.round(d) % 16;
    if (d < 0) {
        d += 16;
    }
    return d;
};

// Core functions.

/**
 * Attempt to move pegman forward or backward.
 * @param {number} direction Direction to move (0 = forward, 2 = backward).
 * @param {string} id ID of block that triggered this action.
 * @throws {true} If the end of the maze is reached.
 * @throws {false} If Pegman collides with a wMaze.moveall.
 */
Maze.move = function(direction, id) {
    if (!Maze.isPath(direction, null)) {
        Maze.log.push(['fail_' + (direction ? 'backward' : 'forward'), id]);
        throw false;
    }
    // If moving backward, flip the effective direction.
    var effectiveDirection = Maze.pegmanD + direction;
    var command;
    switch (Maze.constrainDirection4(effectiveDirection)) {
        case Maze.DirectionType.NORTH:
            Maze.pegmanY--;
            command = 'north';
            break;
        case Maze.DirectionType.EAST:
            Maze.pegmanX++;
            command = 'east';
            break;
        case Maze.DirectionType.SOUTH:
            Maze.pegmanY++;
            command = 'south';
            break;
        case Maze.DirectionType.WEST:
            Maze.pegmanX--;
            command = 'west';
            break;
    }
    Maze.log.push([command, id]);
};

/**
 * Turn pegman left or right.
 * @param {number} direction Direction to turn (0 = left, 1 = right).
 * @param {string} id ID of block that triggered this action.
 */
Maze.turn = function(direction, id) {
    if (direction) {
        // Right turn (clockwise).
        Maze.pegmanD++;
        Maze.log.push(['right', id]);
    } else {
        // Left turn (counterclockwise).
        Maze.pegmanD--;
        Maze.log.push(['left', id]);
    }
    Maze.pegmanD = Maze.constrainDirection4(Maze.pegmanD);
};

/**
 * Is there a path next to pegman?
 * @param {number} direction Direction to look
 *     (0 = forward, 1 = right, 2 = backward, 3 = left).
 * @param {?string} id ID of block that triggered this action.
 *     Null if called as a helper function in Maze.move().
 * @return {boolean} True if there is a path.
 */
Maze.isPath = function(direction, id) {
    var effectiveDirection = Maze.pegmanD + direction;
    var square;
    var command;
    switch (Maze.constrainDirection4(effectiveDirection)) {
        case Maze.DirectionType.NORTH:
            square = Maze.map[Maze.pegmanY - 1] &&
                Maze.map[Maze.pegmanY - 1][Maze.pegmanX];
            command = 'look_north';
            break;
        case Maze.DirectionType.EAST:
            square = Maze.map[Maze.pegmanY][Maze.pegmanX + 1];
            command = 'look_east';
            break;
        case Maze.DirectionType.SOUTH:
            square = Maze.map[Maze.pegmanY + 1] &&
                Maze.map[Maze.pegmanY + 1][Maze.pegmanX];
            command = 'look_south';
            break;
        case Maze.DirectionType.WEST:
            square = Maze.map[Maze.pegmanY][Maze.pegmanX - 1];
            command = 'look_west';
            break;
    }
    if (id) {
        Maze.log.push([command, id]);
    }
    return square !== Maze.SquareType.WALL && square !== undefined;
};

/**
 * Is the player at the finish marker?
 * @return {boolean} True if not done, false if done.
 */
Maze.notDone = function() {
    return Maze.pegmanX != Maze.finish_.x || Maze.pegmanY != Maze.finish_.y;
};

// Initialize blockly normally or special version for level maze_choice

if(BlocklyGames.LEVEL == BlocklyGames.CHOICE_LEVEL){ // if 8 is special level
    window.addEventListener('load', Maze.initChoice);
}
else{
    window.addEventListener('load', Maze.init);
}
