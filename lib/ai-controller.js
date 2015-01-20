//                        ~ ai-controller.js ~
/*----------------------------------------------------------------------*\
 |                         Class:AiController                           |
 |                                                                      |
 | The AI Controller plays the part of the opponent to a client's game. |
 | It inherits much from Class:GameController, so that it can run a     |
 | shadow model of the current game. It finds moves via weighted BFS.   |
 |                                                                      |
 | The AI Controller attaches to the root of the app via socket.io, and |
 | it registers its socket id so the Class:GameController can pass      |
 | info back and forth. This way, there will be minimal change when     |
 | implementing games between players.                                  |
\*----------------------------------------------------------------------*/
//module.exports = socket.id;
module.exports = {minMax : minMax,
		  getMoves: getMoves,
		  score: score
		 };
var struct = require('./struct');
var moveGraph = struct.moveGraph;
var fullGameStates = struct.fullGameStates;
var attackVectors = struct.attackVectors;
var winningStates = struct.winningStates;
var getFlags = require('./bits').getFlags;
// var socket = require('socket.io-client')('http://localhost:3030');
/*

  socket.on('Your Move', function(game, playerState, depth) {
  var bestMove = minMax(game.player, game.game, true, getMoves, score);
  socket.emit('move', game);
  });

  socket.on('connect', function(s) {
  socket.emit('register', 'Machine');
  });

  socket.on('moveResponse', function(response) {
  });
*/

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
	stopSearch = children.every( function (branch) {
	    var current = branch.player;
	    if (winningStates.indexOf(current) > -1) {
		bestScore = 2;
		candidate = current;
		return false;
	    } else {
		return true;
	    }
	});

	if (!stopSearch) {
	    children.forEach( function (branch) {
		var current = branch.player;
		var game = branch.game;
		var currentScore = minMax(current, game, depth - 1,
					  !maximize, search, score);
		if (!bestScore || betterThan(currentScore, bestScore)) {
		    bestScore = currentScore;
		    candidate = current;
		}
	    });
	}    
    }

    if (depth > 1) {
	return candidate;
    } else {
	return bestScore;
    }
}


// getMoves: number, number -> array[{number, number}, {...}, ...]
/*----------------------------------------------------------------------*\
 | Return a on list of objects, each of which contain an optional move  |
 | from the input state. Each element in the list contains a game score |
 | and a player score.                                                  |
\*----------------------------------------------------------------------*/
function getMoves (playerState, gameState) {
    var opponentState = gameState ^ playerState;
    var moves = moveGraph[playerState].filter(function (state) {
	if ( !(state & opponentState)
	     && fullGameStates.indexOf(state + opponentState) > -1 ) {
	    return true;
	}
    });
    return moves.map(function (playerState) {
	return {player: playerState,
		game: playerState + opponentState
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
	var rawScore;
	var playerScore = getFlags(vector & player).length;
	var opponentScore = getFlags(vector & opponent).length;
	if (playerScore > 1) {
	    rawScore = 2 - (3 % playerScore) - (opponentScore / 3);
	    score += Math.round(rawScore * 10000) / 10000;
	}
    });
    score = Math.min(score, 2);

    if (maximize) {
	return score;
    } else {
	return -score;
    }
}
