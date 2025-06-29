/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Blocks for Maze game.
 * @author blocklygames@neil.fraser.name (Neil Fraser)
 */
'use strict';

goog.provide('Maze.Blocks');

goog.require('Blockly');
goog.require('Blockly.JavaScript');
goog.require('Blockly.Extensions');
goog.require('Blockly.FieldDropdown');
goog.require('Blockly.FieldImage');
goog.require('BlocklyGames');

/**
 * Construct custom maze block types.  Called on page load.
 */
Maze.Blocks.init = function () {
  /**
   * Common HSV hue for all movement blocks.
   */
  const MOVEMENT_HUE = 290;

  /**
   * HSV hue for loop block.
   */
  const LOOPS_HUE = 120;

  /**
   * Common HSV hue for all logic blocks.
   */
  const LOGIC_HUE = 210;

  /**
   * Counterclockwise arrow to be appended to left turn option.
   */
  const LEFT_TURN = ' ↺';

  /**
   * Clockwise arrow to be appended to right turn option.
   */
  const RIGHT_TURN = ' ↻';

  const TURN_DIRECTIONS = [
    [BlocklyGames.getMsg('Maze.turnLeft', false), 'turnLeft'],
    [BlocklyGames.getMsg('Maze.turnRight', false), 'turnRight'],
  ];

  const PATH_DIRECTIONS = [
    [BlocklyGames.getMsg('Maze.pathAhead', false), 'isPathForward'],
    [BlocklyGames.getMsg('Maze.pathLeft', false), 'isPathLeft'],
    [BlocklyGames.getMsg('Maze.pathRight', false), 'isPathRight'],
  ];

  // Add arrows to turn options after prefix/suffix have been separated.
  Blockly.Extensions.register('maze_turn_arrows', function () {
    const options = this.getField('DIR').getOptions();
    options[options.length - 2][0] += LEFT_TURN;
    options[options.length - 1][0] += RIGHT_TURN;
  });

  Blockly.defineBlocksWithJsonArray([
    // Block for moving forward.
    {
      type: 'maze_moveForward',
      message0: BlocklyGames.getMsg('Maze.moveForward', false),
      previousStatement: null,
      nextStatement: null,
      colour: MOVEMENT_HUE,
      tooltip: BlocklyGames.getMsg('Maze.moveForwardTooltip', false),
    },

    // Block for turning left or right.
    {
      type: 'maze_turn',
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'DIR',
          options: TURN_DIRECTIONS,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: MOVEMENT_HUE,
      tooltip: BlocklyGames.getMsg('Maze.turnTooltip', false),
      extensions: ['maze_turn_arrows'],
    },

    // Block for conditional "if there is a path".
    {
      type: 'maze_if',
      message0: `%1%2${BlocklyGames.getMsg('Maze.doCode', false)}%3`,
      args0: [
        {
          type: 'field_dropdown',
          name: 'DIR',
          options: PATH_DIRECTIONS,
        },
        {
          type: 'input_dummy',
        },
        {
          type: 'input_statement',
          name: 'DO',
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: LOGIC_HUE,
      tooltip: BlocklyGames.getMsg('Maze.ifTooltip', false),
      extensions: ['maze_turn_arrows'],
    },

    // Block for conditional "if there is a path, else".
    {
      type: 'maze_ifElse',
      message0: `%1%2${BlocklyGames.getMsg('Maze.doCode', false)}%3${
        window['BlocklyMsg']['CONTROLS_IF_MSG_ELSE']
      }%4`,
      args0: [
        {
          type: 'field_dropdown',
          name: 'DIR',
          options: PATH_DIRECTIONS,
        },
        {
          type: 'input_dummy',
        },
        {
          type: 'input_statement',
          name: 'DO',
        },
        {
          type: 'input_statement',
          name: 'ELSE',
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: LOGIC_HUE,
      tooltip: BlocklyGames.getMsg('Maze.ifelseTooltip', false),
      extensions: ['maze_turn_arrows'],
    },

    // Block for repeat loop.
    {
      type: 'maze_forever',
      message0: `${BlocklyGames.getMsg('Maze.repeatUntil', false)}%1%2${BlocklyGames.getMsg(
        'Maze.doCode',
        false
      )}%3`,
      args0: [
        {
          type: 'field_image',
          src: 'maze/marker.png',
          width: 12,
          height: 16,
        },
        {
          type: 'input_dummy',
        },
        {
          type: 'input_statement',
          name: 'DO',
        },
      ],
      previousStatement: null,
      colour: LOOPS_HUE,
      tooltip: BlocklyGames.getMsg('Maze.whileTooltip', false),
    },
  ]);
  // Kids Blocks

  Blockly.Blocks['maze_moveForwardKids'] = {
    /**
     * Block for moving forward.
     * @this {Blockly.Block}
     */
    init: function () {
      this.jsonInit({
        message0: '%1 vorwärts laufen',
        args0: [
          {
            type: 'field_image',
            src: 'maze/forward1.png',
            width: 20,
            height: 20,
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: MOVEMENT_HUE,
        tooltip: BlocklyGames.getMsg('Maze.moveForwardTooltip'),
      });
    },
  };

  Blockly.Blocks['maze_foreverKids'] = {
    /**
     * Block for repeat loop.
     * @this {Blockly.Block}
     */
    init: function () {
      this.setColour(LOOPS_HUE);
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage('maze/repeat1.png', 20, 20))
        .appendField(BlocklyGames.getMsg('Maze.repeatUntil'))
        .appendField(new Blockly.FieldImage(SKIN.markerBlock, 20, 20));
      this.appendStatementInput('DO').appendField(BlocklyGames.getMsg('Maze.doCode'));
      this.setPreviousStatement(true);
      this.setTooltip(BlocklyGames.getMsg('Maze.whileTooltip'));
    },
  };

  // controls reapeat youth
  // controls repeat ext kids
  Blockly.Blocks['controls_repeat_ext'] = {
    /**
     * Block for repeat n times (internal number).
     * @this {Blockly.Block}
     */
    init: function () {
      this.jsonInit({
        message0: '%1 wiederhole %2 mal:',
        args0: [
          {
            type: 'field_image',
            src: 'maze/repeat1.png',
            width: 20,
            height: 20,
          },
          {
            type: 'field_dropdown',
            name: 'TIMES',
            options: [
              ['2', '2'],
              ['3', '3'],
              ['4', '4'],
              ['5', '5'],
            ],
          },
        ],
        previousStatement: true,
        nextStatement: null,
        colour: MOVEMENT_HUE,
        tooltip: Blockly.Msg['CONTROLS_REPEAT_TOOLTIP'],
        helpUrl: Blockly.Msg['CONTROLS_REPEAT_HELPURL'],
      });
      this.appendStatementInput('DO').appendField(Blockly.Msg['CONTROLS_REPEAT_INPUT_DO']);
    },
  };

  // controls repeat ext kids
  Blockly.Blocks['controls_repeat_extKids'] = {
    /**
     * Block for repeat n times (internal number).
     * @this {Blockly.Block}
     */
    init: function () {
      this.jsonInit({
        message0: '%1 wiederhole %2 mal:',
        args0: [
          {
            type: 'field_image',
            src: 'maze/repeat1.png',
            width: 20,
            height: 20,
          },
          {
            type: 'field_dropdown',
            name: 'TIMES',
            options: [
              ['2', '2'],
              ['3', '3'],
              ['4', '4'],
              ['5', '5'],
            ],
          },
        ],
        previousStatement: true,
        nextStatement: null,
        colour: MOVEMENT_HUE,
        tooltip: Blockly.Msg['CONTROLS_REPEAT_TOOLTIP'],
        helpUrl: Blockly.Msg['CONTROLS_REPEAT_HELPURL'],
      });
      this.appendStatementInput('DO').appendField(Blockly.Msg['CONTROLS_REPEAT_INPUT_DO']);
    },
  };

  // turn left only
  Blockly.Blocks['maze_turn_left'] = {
    /**
     * Block for turning left.
     * @this {Blockly.Block}
     */
    init: function () {
      this.setColour(MOVEMENT_HUE);
      this.appendDummyInput()
        .appendField(LEFT_TURN) // Append arrows to direction messages.
        .appendField(BlocklyGames.getMsg('Maze.turnLeft'));
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip(BlocklyGames.getMsg('Maze.turnTooltip'));
    },
  };

  // turn left only
  Blockly.Blocks['maze_turn_leftKids'] = {
    /**
     * Block for turning left.
     * @this {Blockly.Block}
     */
    init: function () {
      this.setColour(MOVEMENT_HUE);
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage('maze/left.png', 20, 20))
        .appendField(BlocklyGames.getMsg('Maze.turnLeft'));
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip(BlocklyGames.getMsg('Maze.turnTooltip'));
    },
  };
  // turn right only
  Blockly.Blocks['maze_turn_rightKids'] = {
    /**
     * Block for turning right.
     * @this {Blockly.Block}
     */
    init: function () {
      this.setColour(MOVEMENT_HUE);
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage('maze/right.png', 20, 20))
        .appendField(BlocklyGames.getMsg('Maze.turnRight'));
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip(BlocklyGames.getMsg('Maze.turnTooltip'));
    },
  };
};

Blockly.JavaScript['maze_moveForward'] = function (block) {
  // Generate JavaScript for moving forward.
  return `moveForward('block_id_${block.id}');\n`;
};

Blockly.JavaScript['maze_turn'] = function (block) {
  // Generate JavaScript for turning left or right.
  return `${block.getFieldValue('DIR')}('block_id_${block.id}');\n`;
};

Blockly.JavaScript['maze_if'] = function (block) {
  // Generate JavaScript for conditional "if there is a path".
  const argument = `${block.getFieldValue('DIR')}('block_id_${block.id}')`;
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  return `if (${argument}) {\n${branch}}\n`;
};

Blockly.JavaScript['maze_ifElse'] = function (block) {
  // Generate JavaScript for conditional "if there is a path, else".
  const argument = `${block.getFieldValue('DIR')}('block_id_${block.id}')`;
  const branch0 = Blockly.JavaScript.statementToCode(block, 'DO');
  const branch1 = Blockly.JavaScript.statementToCode(block, 'ELSE');
  return `if (${argument}) {\n${branch0}} else {\n${branch1}}\n`;
};

Blockly.JavaScript['maze_forever'] = function (block) {
  // Generate JavaScript for repeat loop.
  let branch = Blockly.JavaScript.statementToCode(block, 'DO');
  if (Blockly.JavaScript.INFINITE_LOOP_TRAP) {
    branch =
      Blockly.JavaScript.INFINITE_LOOP_TRAP.replace(/%1/g, `'block_id_${block.id}'`) + branch;
  }
  return `while (notDone()) {\n${branch}}\n`;
};

//Kids blocks

Blockly.JavaScript['maze_moveForwardKids'] = function (block) {
  // Generate JavaScript for moving forward.
  return `moveForward('block_id_${block.id}');\n`;
};

Blockly.JavaScript['maze_foreverKids'] = function (block) {
  // Generate JavaScript for repeat loop.
  var branch = Blockly.JavaScript.statementToCode(block, 'DO');
  if (Blockly.JavaScript.INFINITE_LOOP_TRAP) {
    branch =
      Blockly.JavaScript.INFINITE_LOOP_TRAP.replace(/%1/g, "'block_id_" + block.id + "'") + branch;
  }
  return 'while (notDone()) {\n' + branch + '}\n';
};

Blockly.JavaScript['controls_repeat_ext'] = function (block) {
  var repeats = String(Number(block.getFieldValue('TIMES')));
  var branch = Blockly.JavaScript.statementToCode(block, 'DO');
  branch = Blockly.JavaScript.addLoopTrap(branch, block);
  var code = '';
  var loopVar = Blockly.JavaScript.nameDB_.getDistinctName('count', Blockly.VARIABLE_CATEGORY_NAME);
  var endVar = repeats;
  if (!repeats.match(/^\w+$/) && !Blockly.isNumber(repeats)) {
    endVar = Blockly.JavaScript.nameDB_.getDistinctName(
      'repeat_end',
      Blockly.VARIABLE_CATEGORY_NAME
    );
    code += 'var ' + endVar + ' = ' + repeats + ';\n';
  }
  code +=
    'for (var ' +
    loopVar +
    ' = 0; ' +
    loopVar +
    ' < ' +
    endVar +
    '; ' +
    loopVar +
    '++) {\n' +
    branch +
    '}\n';
  return code;
};

Blockly.JavaScript['controls_repeat_extKids'] = function (block) {
  // Repeat n times.
  var repeats = String(Number(block.getFieldValue('TIMES')));
  var branch = Blockly.JavaScript.statementToCode(block, 'DO');
  branch = Blockly.JavaScript.addLoopTrap(branch, block);
  var code = '';
  var loopVar = Blockly.JavaScript.nameDB_.getDistinctName('count', Blockly.VARIABLE_CATEGORY_NAME);
  var endVar = repeats;
  if (!repeats.match(/^\w+$/) && !Blockly.isNumber(repeats)) {
    endVar = Blockly.JavaScript.nameDB_.getDistinctName(
      'repeat_end',
      Blockly.VARIABLE_CATEGORY_NAME
    );
    code += 'var ' + endVar + ' = ' + repeats + ';\n';
  }
  code +=
    'for (var ' +
    loopVar +
    ' = 0; ' +
    loopVar +
    ' < ' +
    endVar +
    '; ' +
    loopVar +
    '++) {\n' +
    branch +
    '}\n';
  return code;
};

Blockly.JavaScript['maze_turn_left'] = function (block) {
  // Generate JavaScript for turning left.
  return "turnLeft('block_id_" + block.id + "');\n";
};

Blockly.JavaScript['maze_turn_leftKids'] = function (block) {
  // Generate JavaScript for turning left.
  return "turnLeft('block_id_" + block.id + "');\n";
};

Blockly.JavaScript['maze_turn_rightKids'] = function (block) {
  // Generate JavaScript for turning right.
  return "turnRight('block_id_" + block.id + "');\n";
};
