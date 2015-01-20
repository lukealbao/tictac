var struct = require('./struct');
var moveGraph = struct.moveGraph;
var winningStates = struct.winningStates;
var attackVectors = struct.attackVectors;

function searchGraph(graph) {
    return function searchGraphInner (element) {
	return graph[element];
    }
}

function minMax (state, game, depth, maximize, search, score) {
    var children = search(state, game);
    var bestScore = 0;
    var candidate;
    var stopSearch;
    
    var betterThan = maximize ? greaterThan : lessThan;
    function lessThan (a, b) { return a < b }
    function greaterThan (a, b) { return a > b }
    
    if (depth < 1) {
	return score(state, game, maximize);
    }
    
    if (children && children.length > 0) {
	// Modest pruning
	stopSearch = children.every( function (state) {
	    if (winningStates.indexOf(state) > -1) {
		bestScore = 2;
		return false;
	    }
	});

	if (!stopSearch) {
	    children.forEach( function (state) {
		var current = state;

		var currentScore = minMax(current, game, depth - 1,
					  !maximize, search, score);
		if (!bestScore || betterThan(currentScore, bestScore)) {
		    bestScore = currentScore;
		    candidate = current;
		}
	    });
	}    
    } 

    return bestScore;
}

module.exports = {
    minMax: minMax,
    outer: traverse,
    score: score,
    getMoves: getMoves,
    getFlags: getFlags,
    setFlags: setFlags
}


function traverse (state, game, depth) {
    var opts = {};
    var cands = getMoves(state, game);
    for (var i = 0; i < cands.length ; i++) {
	var curr = cands[i];
	opts[curr] = mm.minMax(curr, game, depth * 2, true, getMoves, score);
    }
    return opts;
}


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

// score: number, number, boolean -> number
/*----------------------------------------------------------------------*\
 | Compute the value of a position's attack. Return a negative value if |
 | not computing for the maximizing player.                             |
 |                                                                      |
 | The return value is the sum of all attacks in the position. Attacks  |
 | are defined as follows:                                              |
 |                                                                      |
 | - Two pieces in a row, blocked by opponent: 0.6667 points            |
 | - Two pieces in a row, not blocked: 1 point                          |
 | - Three pieces in a row (winning): 2 points                          |
 | Thus, a position that attacks two unblocked vectors is effectively   |
 | equal to a win. Just like real life.                                 |
\*----------------------------------------------------------------------*/
function score (player, game, maximize) {
    var opponent = player ^ game;
    var score = 0;

    attackVectors.forEach( function (vector) {
	var playerScore = getFlags(vector & player).length;
	var opponentScore = getFlags(vector & opponent).length;
	if (playerScore > 1) {
	    score += 2 - (3 % playerScore) - (opponentScore / 3);
	}
    });

    if (maximize) {
	return score;
    } else {
	return -score;
    }
}

function getMoves (state, game) {
    return dedupe(moveGraph[state]).filter(function(s) {
	var opponent = game ^ state;
	if ( opponent & state ) {
	    return false;
	} else {
	    return true;
	}
    });
}


function setFlags (arr) {
    var ret = 0;
    arr.forEach(function (idx) {
	ret += 1 << idx;
    });
    return ret;
}


function dedupe(arr) {
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
