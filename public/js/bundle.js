(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//                          ~ bitboard.js ~
/*----------------------------------------------------------------------*\
 |                     Library:Bitboard Functions                       |
 |                                                                      |
 | These functions draw bitboards.                                      |
\*----------------------------------------------------------------------*/

var bits = require('./bits');

module.exports = {
    generateStates: generateStates,
    addTwoRows: addTwoRows,
    translate: translate
};

// generateStates: number, number -> array(number) | n-choose-k-bits
function generateStates(n, k) {
    var results = [0];

    // We check every number that fits within n bits...
    for (var i = 0; i < (1 << n) ; i++) {
	// ... to see how many bits are set
	for (var j=0, c=0; j < n+1 ; j++) {
	    if (i & (1 << j)) {
		c++;
	    }
	}
	if (c === k) {
	    results.push(i);
	}
    }

    return results;
}

// addTwoRows: number -> number | Transform a 3x3 integer into 5x5
function addTwoRows(input) {
    var currentInput = input;
    
    // Helper function called n times
    function addOneRow(input, len, n) {
	var arr = bits.stringifyBitArray(input, len), 
	    oldWidth = Math.sqrt(arr.length),
	    newWidth = oldWidth + n;

	// Change RTL orientation to LTR
	arr = arr.split("").reverse();

	for (var i = 1; i <= newWidth; i++) {
	    arr.splice( (newWidth * i) - 1, 0, "0");
	}
	return parseInt(arr.reverse().join(""), 2);
    }

    // 9 into 16
    currentInput = addOneRow(currentInput, 9, 1);
    //16 into 25
    currentInput = addOneRow(currentInput, 16, 1);

    return currentInput;
}

// translate: number -> array | move a 3x3 board across 5x5
function translate(n) {
    var result = [],
	indexes = [0,1,2,5,6,7,10,11,12];

    for (var i = 0; i < indexes.length; i++) {
	result.push(n << indexes[i]);
    }
    return result;
}


},{"./bits":2}],2:[function(require,module,exports){
//                            ~ bits.js ~
/*----------------------------------------------------------------------*\
 | Helper function for bitwise operations.                              |
\*----------------------------------------------------------------------*/

module.exports = {
    getFlags: getFlags,
    setFlags: setFlags,
    countFlags: countFlags,
    stringifyBitArray: stringifyBitArray,
    oneStepAway: oneStepAway
};

function getFlags (int) {
    var ret = [],
	i;
    for (i = 0; i < 31; i++) {
	if (int & 1 << i) {
	    ret.push(i)
	}
    }
    return ret;    
}

function setFlags (arr) {
    var ret = 0;
    arr.forEach(function (idx) {
	ret += 1 << idx;
    });
    return ret;
}

function countFlags (int) {
    return (int.toString(2).match(/1/g) || []).length;
}

function stringifyBitArray (n, width) {
    var string = n.toString(2),
	pad = width - string.length;

    for (var i = 0; i < pad; i++) {
	string = "0" + string;
    }
    return string;
}

function oneStepAway (state1, state2) {
    var commonCount = countFlags(state1 & state2),
	state1Count = countFlags(state1),
	state2Count = countFlags(state2);
    
    if (state1Count < state2Count) {
	return Boolean(state1 === (state1 & state2)
		       && state2Count - state1Count === 1);
    } else if (state1Count === state2Count) {
	return Boolean(commonCount === state1Count - 1);
    } else {
	return false;
    }
}


},{}],3:[function(require,module,exports){
//                        ~ client-ai.js ~

//'use strict';

var struct = require('./struct');
var moveGraph = struct.moveGraph;
var fullGameStates = struct.fullGameStates;
var attackVectors = struct.attackVectors;
var winningStates = struct.winningStates;
var bits = require('./bits');
var getFlags = bits.getFlags;
var STARTIDX = 1 << 25;
var ioOptions = {'force new connection': true,
                 'transports': ['websocket']};

var socket = io(ioOptions);


socket.on('Your Move', function (data) {
    if (!data.game.active) {
        return;
    }
    game = data.game;
    var machinePlayer = game.turn;
    var opponentPlayer = machinePlayer === 'x' ? 'o' : 'x';
    game.me = machinePlayer;

    if (game[opponentPlayer].piecesOnBoard < 1) {
	// First move.
	socket.emit('Move Request', prepareMove(game, 1 << 12));
	return;
    }
    var bestMove = searchRoot(game[machinePlayer].state,
				 game[opponentPlayer].state
				 + game[machinePlayer].state,
				 4, true);
    socket.emit('Move Request', prepareMove(game, bestMove));

});

socket.on('connect', function (s) {
    socket.emit('Hello', {user: 'Machine'});
});

socket.on('Move Response', function (response) {
    if (response.error) {
      console.log(response.errorReason);
    }
});

function opponentWins (move) {
    var game = move.game;
    var player = move.player;
    var vectors = attackVectors(game);
    var opponent = game ^ player;
    var vector;
    var playerFlags;
    var opponentFlags;

    while (vector = vectors.pop()) {
	playerFlags = getFlags(player & vector).length;
	opponentFlags = getFlags(opponent & vector).length;
	if (opponentFlags === 2 && playerFlags === 0) {
	    return true;
	}
    }
    return false;
}

function searchRoot (root, game, depth) {
    var alpha = -Infinity;
    var beta = Infinity;
    var moves = getMoves(root, game);
    var moveScores = {};
    var nodeScore;
    var bestMove;
    var graph = {};

   for (var i =  moves.length -1; i >= 0; i--) {
	if ( moves.length > 1
	     // If it's not a winner...
	     && score(moves[i].player, moves[i].game, true) !== 7
	     // But it leaves an open win next...
	     && opponentWins(moves[i]) ) {
	    // ...Remove it - unless it's the last one
	     moves.splice(i, 1);
	}
    }

    for (var i = 0, l = moves.length; i < l; i++) {
	nodeScore = alphaBeta(moves[i].player, moves[i].game, depth,
			      alpha, beta, true);
	// Debug
	moveScores[bits.getFlags(moves[i].player)] = nodeScore;

	// Score
	if (nodeScore > alpha) {
	    alpha = nodeScore;
	    bestMove = moves[i].player;
	}
	graph[bits.getFlags(moves[i].player)] = nodeScore;
    }

    return bestMove;
}

function alphaBeta (root, game, depth, alpha, beta, maximizer) {
    if (depth < 1) {
	return score(root, game, maximizer);
    }

    var branches = getMoves(root, game);
    var branch;
    var nextGame;
    var nextNode;
    var nodeScore;
    var rootValue = maximizer ? -Infinity : Infinity;

    // Immediate win
    if (branches.length === 0) {
	return score(root, game, maximizer);
    }

    // Guaranteed loss
    for (var i = branches.length -1; i >= 0; i--) {
	if ( branches.length > 0 && opponentWins(branches[i]) ) {
	    branches.slice(i, 1);
	}
    }
	   

    while (branch = branches.pop()) {
	
	nextGame = branch.game; // Board state
	nextNode = branch.player ^ branch.game; // i.e., opponent
	nodeScore = alphaBeta(nextNode, nextGame, depth - 1,
			      alpha, beta, !maximizer);
    
	if (maximizer) {
	    rootValue = Math.max(rootValue, nodeScore);
	    alpha = Math.max(rootValue, alpha);
	    if (alpha >= beta) {
		return alpha;
	    }
	} else if (!maximizer) {
	    rootValue = Math.min(rootValue, nodeScore);
	    beta = Math.min(rootValue, beta);
	    if (alpha >= beta) {
		return beta;
	    }
	}
    }

    return rootValue;
}

// getMoves: number, number -> array[{number, number}, {...}, ...]
/*----------------------------------------------------------------------*\
  | Return a on list of objects, each of which contain an optional move  |
  | from the input state. Each element in the list contains a game score |
  | and a player score.                                                  |
  \*----------------------------------------------------------------------*/
function getMoves (rootState, gameState) {
    var rootSetBits = bits.getFlags(rootState).length;
    var opponentState = gameState ^ rootState;
    var moves = moveGraph[rootState].filter(function (child) {
	var childSetBits = bits.getFlags(child).length;

	// Overlap
	if (child & opponentState) {
	    return false;
	}
	// Out of bounds
	if (fullGameStates.indexOf(child + opponentState) === -1) {
	    return false;
	}
	// Overlapping itself
	if (rootSetBits < 3 && childSetBits === rootSetBits) {
	    return false;
	}
	// Should be impossible
	if (rootSetBits > childSetBits) {
	    return false;
	}
	
	else return true;	    
    });
    
    return moves.map(function (move) {
	return {player: move,
		game: move + opponentState
	       }
    });
}

// score: number, number, boolean -> number
/*----------------------------------------------------------------------*\
  | Compute the value of a position's attack. Return a negative value if |
  | not computing for the maximizing player.                             |
  |                                                                      |
  | The return value is the sum of all attacks in the position. Attacks  |
  | are defined as follows:                                              |
  |                                                                      |
  | - Two pieces in a row, blocked by opponent: 1 point                  |
  | - Two pieces in a row, not blocked: 2 points                         |
  | - Three pieces in a row (winning): 7 points                          |
  \*----------------------------------------------------------------------*/
function score (player, game, maximize) {
    var opponent = player ^ game;
    var netScore = 0;
    var vectors = attackVectors(game);

    vectors.forEach(function (vector) {
	var vectorGain;
	var playerFlags = getFlags(vector & player).length;
	var opponentFlags = getFlags(vector & opponent).length;

	// Actual win
	if (playerFlags === 3) {
	    netScore = 7;
	    return;
	}

	// Otherwise, calculate attacking score
	vectorGain = playerFlags
	    * (playerFlags - 1)
	    / (1 + opponentFlags);

	netScore += vectorGain;// - vectorLoss;
    });

    if (maximize) {
	return netScore
    } else {
	return -netScore;
    }
}





function prepareMove (game, proposedState) {
    var current = game[game.me];
    var diffIndexes = bits.getFlags(current.state ^ proposedState);
    var moveTo;
    var movingPiece;
    var moveFrom;
    var foundAt;
    var piece;
    var idx;
    var i;

    if (current.piecesOnBoard < 3) {
	movingPiece = game.me + current.piecesOnBoard;
	moveFrom = STARTIDX;
	moveTo = diffIndexes[0];
	
    } else {
	
	for (var i = 0; i < 3; i++) {
	    piece = game.me + i;
	    foundAt = diffIndexes.indexOf(current[piece]);
	    if (foundAt > -1) {
		movingPiece = piece;
		moveFrom = current[piece];
		idx = (foundAt === 0) ? 1 : 0;
		moveTo = diffIndexes[idx];
	    }
	}

    }

    return {gid: game.gid,
	    player: game.me,
	    piece: movingPiece,
	    from: moveFrom,
	    to: moveTo
	   };
}

// Keep alive as independent process
module.exports = socket;

},{"./bits":2,"./struct":4}],4:[function(require,module,exports){
//                           ~ struct.js ~
/*----------------------------------------------------------------------*\
 |                        Library:Structures                            |
 |                                                                      |
 | This file contains data structures used througout the application.   |
 | They serve as lookup tables for valid moves.                         |
\*----------------------------------------------------------------------*/

var bits = require('./bits');
var bitBoard = require('./bitboard');
var setFlags = bits.setFlags;
var getFlags = bits.getFlags;
var oneStepAway = bits.oneStepAway;
var generateStates = bitBoard.generateStates;
var addTwoRows = bitBoard.addTwoRows;
var translate = bitBoard.translate;
var tooManyEdgePoints = bitBoard.tooManyEdgePoints;
var range = require('./util').range;
var dedupe = require('./util').dedupe;

module.exports = {
    boardMask: boardMask(),
    stages: stages(),
    attackVectors: attackVectors,
    edges: populateEdges(),
    singlePlayerStates: populateAllSinglePlayerStates(),
    fullGameStates: populateAllFullGameStates(),
    moveGraph: populateMoveGraph(populateAllSinglePlayerStates(),
				 populateWinningStates()),
    winningStates: populateWinningStates()
}

// boardMask: null -> number | A 3x3 board all bits set @ index 0
function boardMask () {
    var bitArray = 0;
    for (var i = 0; i < 9; i++) {
	bitArray += (1 << i);
    }
    return addTwoRows(bitArray);
}

// stages: null -> array(number) | A list of 3x3 masks
function stages () {return translate(boardMask());}

var winningStates3x3 = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
].map(bits.setFlags)
    .map(addTwoRows);

function attackVectors (gameState) {
    // Get a list of winningStates that fit on each gameboard available

    // Get available gameboards
    var allIndexes = [0,1,2, 5,6,7, 10,11,12];
    var translations = [];
    var vectors;
    var mask = boardMask();

    allIndexes.forEach(function (idx) {
	if ( ((mask << idx) & gameState) === gameState ) {
	    translations.push(idx);
	}
    });

    // Translate all winningStates to known indexes

    vectors = winningStates3x3.map(function (state) {
	var t = [];
	translations.forEach( function (idx) {
	    t.push(state << idx);
	});
	return t;
    }).reduce(function (a, b) {
	return a.concat(b);
    });

    return vectors;
}     
function populateEdges () {
    var edges = {},
	edgeIndexes = [
	    [0,1,2,3,4],    [20,21,22,23,24],
	    [0,5,10,15,20], [4,9,14,19,24]
	];

    edges.bottom = setFlags(edgeIndexes[0]);
    edges.top    = setFlags(edgeIndexes[1]);
    edges.right   = setFlags(edgeIndexes[2]);
    edges.left  = setFlags(edgeIndexes[3]);
    return edges;
}

function populateSinglePlayerStates () {
    var states = {};
    for (var i = 0; i <= 3; i++ ) {

	var current = generateStates(9, i) // n choose k bits on 3x3 board
	    .map(addTwoRows) // redraw on 5x5 board
	    .map(translate) // translate 3x3 across 5x5
	    .reduce(function(a, b) {
		return a.concat(b);
	    });
	
	// Dedupe it, add it to gameStates
	states[i + '-pc'] = dedupe(current);
    }
    return states;
}

function populateAllSinglePlayerStates () {
    var states = populateSinglePlayerStates();
    var concatenatedStates = [];
    for (var i = 1; i <= 3; i++) {
	concatenatedStates = concatenatedStates.concat(states[i + '-pc']);
    }
    return concatenatedStates;
}

function populateFullGameStates () {
    var states = {};
    for (var i = 1; i <= 6; i++ ) {

	var current = generateStates(9, i) // n choose k bits on 3x3 board
	    .map(addTwoRows) // redraw on 5x5 board
	    .map(translate) // translate 3x3 across 5x5
	    .reduce(function(a, b) {
		return a.concat(b);
	    });
	
	// Dedupe it, add it to gameStates
	states[i + '-pc'] = dedupe(current);
    }
    return states;
}

function populateAllFullGameStates () {
    var states = populateFullGameStates();
    var concatenatedStates = [];
    for (var i = 1; i <= 6; i++) {
	concatenatedStates = concatenatedStates.concat(states[i + '-pc']);
    }
    return concatenatedStates;
}

function populateWinningStates () {
    var winningStates = [],
	winningIndexes = [
	    [0,1,2], [3,4,5], [6,7,8],
	    [0,3,6], [1,4,7], [2,5,8],
	    [0,4,8], [2,4,6]
	];

    for (var i = 0; i < winningIndexes.length; i++) {
	var curr = winningIndexes[i]
	    .map(function(idx) {
		return 1 << idx;
	    })
	    .reduce(function(a, b) {
		return a | b;
	    });

	winningStates.push(curr);
    }

    winningStates = winningStates
	.map(addTwoRows)
	.map(translate)
	.reduce(function(a, b) {return a.concat(b)});
    return winningStates;
}


function populateMoveGraph(arr, filterOut) {
    var graph = {};
    var iLength,
	jLength;

    for (var i = 0, len = arr.length; i < len; i++) {
	graph[arr[i]] = [];

	// Don't populate exit edges for winning games
	if (filterOut.indexOf(arr[i]) !== -1) {
	    continue;
	}
	
	iLength = bits.getFlags(arr[i]).length;
	
	for (var j = 0; j < len; j++) {
	    jLength = bits.getFlags(arr[j]).length;
	    if (oneStepAway(arr[i], arr[j]) && iLength <= jLength) {
		graph[arr[i]].push(arr[j]);
	    }
	}

    }

    return graph;
}

},{"./bitboard":1,"./bits":2,"./util":5}],5:[function(require,module,exports){
//                            ~ util.js ~
/*----------------------------------------------------------------------*\
 |                   General Utility Function Library                   |
\*----------------------------------------------------------------------*/

module.exports = {
    range: range,
    dedupe: dedupe,
    clone: clone
}

function range (start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
	range[idx] = start;
    }

    return range;
}

function dedupe (arr) {
    for (var i = 0, len = arr.length; i < len; i ++) {
	if (arr.indexOf(arr[i], i + 1) !== -1) {
	    arr.splice(i,1,"~~DELETE~~");
	}
    }
    while (arr.indexOf("~~DELETE~~") !== -1) {
	arr.splice(arr.indexOf("~~DELETE~~"), 1);
    }
    return arr;
}

function clone (object) {  // Shallow Copy - only one level deep
    var shadow = {};
    for (var key in object) {
	shadow[key] = object[key];
    }
    return shadow;
}

},{}]},{},[3]);
