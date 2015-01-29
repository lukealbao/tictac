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
