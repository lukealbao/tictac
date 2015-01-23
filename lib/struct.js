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
    attackVectors: populateAttackVectors(),
    edges: populateEdges(),
    singlePlayerStates: populateAllSinglePlayerStates(),
    fullGameStates: populateAllFullGameStates(),
    moveGraph: populateMoveGraph(populateAllSinglePlayerStates(),
				 populateWinningStates()),
    winningStates: populateWinningStates()
}

function populateAttackVectors () {
    var vectors = [];
    for (var i = 0; i < 5; i++) {
	// verticals
	vectors.push( setFlags(range(i, i + 21, 5)) );
	//horizontals
	vectors.push( setFlags(range(i * 5, (i + 1) * 5)) );
    }
    // Forward slash diagonals
    vectors.push( setFlags(range(4, 21, 4)) );
    vectors.push( setFlags(range(3, 16, 4)) );
    vectors.push( setFlags(range(2, 11, 4)) );
    vectors.push( setFlags(range(14, 23, 4)) );
    vectors.push( setFlags(range(13, 22, 4)) );
    // Backslashes
    vectors.push( setFlags(range(0, 25, 6)) );
    vectors.push( setFlags(range(1, 20, 6)) );
    vectors.push( setFlags(range(2, 15, 6)) );
    vectors.push( setFlags(range(5, 23, 6)) );
    vectors.push( setFlags(range(10, 23, 6)) );
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
    edges.left   = setFlags(edgeIndexes[2]);
    edges.right  = setFlags(edgeIndexes[3]);
    return edges;
}

function populateSinglePlayerStates () {
    var states = {};
    for (var i = 0; i <= 3; i++ ) {

	var current = generateStates(9, i) // n choose k bits on 3x3 board
	    .map(addTwoRows) // redraw on 5x5 board
	    .map(translate) // translate 3x3 across 5x5
	    .reduce(function(a, b) {return a.concat(b)}) 
	    .filter(function(state) {
		return !tooManyEdgePoints(state) // remove illegal states
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
	    .reduce(function(a, b) {return a.concat(b)}) 
	    .filter(function(state) {
		return !tooManyEdgePoints(state) // remove illegal states
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

    winningStates = winningStates.map(addTwoRows)
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
