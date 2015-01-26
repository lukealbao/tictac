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
module.exports = {//alphaBetaSearch: alphaBetaSearch,
		  //moveSearch: moveSearch,
    // moveSearch2: moveSearch2,
    minMax: minMax,
		  getMoves: getMoves,
		  score: score,
		  prepareMove: prepareMove,
		  calculateMove: calculateMove
		 };
var struct = require('./struct');
var moveGraph = struct.moveGraph;
var fullGameStates = struct.fullGameStates;
var attackVectors = struct.attackVectors;
var winningStates = struct.winningStates;
var bits = require('./bits');
var getFlags = bits.getFlags;
var STARTIDX = 1 << 25;

var socket = require('socket.io-client')('http://localhost:3030');


socket.on('Your Move', function (game) {
    var machinePlayer = game.turn === 'x' ? 'x' : 'o';
    var opponentPlayer = game.turn === 'x' ? 'o' : 'x';
    var bestMove = calculateMove(game[machinePlayer].state,
				 game[opponentPlayer].state
				 + game[machinePlayer].state,
				 6, true);
    socket.emit('Move Request', prepareMove(game, bestMove));

});

socket.on('connect', function (s) {
    socket.emit('Hello', {user: 'Machine'});
});

socket.on('Move Response', function (response) {
    if (response.error){
	console.log('AI move response:', response.errorReason);
    }
    console.log('Winner:', response.winner || 'None');
    console.log('\n\n'.toString());
});


/*function calculateMove (root, game, depth, verbose) {
  var children = getMoves(root, game);
  var child;
  var max = -Infinity;
  var graph = {};

  for (var i = 0; i < children.length; i++) {
  graph[bits.getFlags(children[i].player)] = null;
  }
  var bestTopLevelChoice = children[Math.floor(Math.random()
  * children.length)].player;

  while (child = children.pop()) {

  var childScore = minMax(child.player, child.game,
  depth - 1, true); //max, min, true);
  if (childScore > max) {
  max = childScore;
  bestTopLevelChoice = child.player;
  }
  graph[bits.getFlags(child.player)] = childScore;
  }

  if (verbose) {
  console.log(JSON.stringify(
  { root: bits.getFlags(root),
  children: graph
  }, null, 2))
  }

  return bestTopLevelChoice;
  }*/
function calculateMove (root, game, depth) {
    return minMax(root, game, depth, true);
}

function minMax (state, game, depth, maximize) {
    if (depth < 1) {
	return score(state, game, maximize);
    }

    var children = getMoves(state, game);
    var graph = {};

    if (depth > 5) {
	for (var i = 0; i < children.length; i++) {
	    graph[bits.getFlags(children[i].player)] = null;
	}
    }

    var bestScore = maximize ? -Infinity : +Infinity;
    var branch;

    if (children.length === 0) {
	return maximize ? 7 : -7;
    }
    
    var betterThan = maximize ? greaterThan : lessThan;
    function lessThan (a, b) { return a < b }
    function greaterThan (a, b) { return a > b }

    var rootScore = score(state, game, maximize);
    if (betterThan(rootScore, maximize ? 3.5 : -3.5)) {
	return depth > 5 ? state : rootScore;
    }

    var bestChild = children[Math.floor(Math.random ()
					* children.length)].player;


    while (branch = children.pop()) {
	var nextGame = branch.game;
	var nextNode = branch.player ^ branch.game;
	var currentScore = minMax(nextNode, nextGame, depth - 1,
				  !maximize);
	if (depth > 5) {
	    graph[bits.getFlags(branch.player)] = currentScore;
	}

	if (!bestScore || betterThan(currentScore, bestScore)) {
	    bestScore = currentScore;
	    bestChild = branch.player;
	}
    }

    if (depth > 5) {
	console.log(JSON.stringify({root: bits.getFlags(state),
				    children: graph}, null, 2));
	console.log('choosing', bestChild, 'scored at ', bestScore);
	return bestChild;
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

    vectors.forEach( function (vector) {
	var vectorScore;
	var playerFlags = getFlags(vector & player).length;
	var opponentFlags = getFlags(vector & opponent).length;

	// Actual win
	if (playerFlags === 3) {
	    netScore += 7;
	    return;
	}

	// Otherwise, calculate attacking score
	vectorScore = playerFlags
	    * (playerFlags - 1)
	    / (1 + opponentFlags);

	netScore += vectorScore;
    });

    if (maximize) {
	return netScore
    } else {
	return -netScore;
    }
}





function prepareMove (game, proposedState) {
    var current = game.o;
    var diffIndexes = bits.getFlags(current.state ^ proposedState);
    var moveTo;
    var movingPiece;
    var moveFrom;
    var foundAt;
    var piece;
    var idx;
    var i;

    if (current.piecesOnBoard < 3) {
	movingPiece = 'player' + current.piecesOnBoard;
	moveFrom = STARTIDX;
	moveTo = diffIndexes[0];
	
    } else {
	
	for (var i = 0; i < 3; i++) {
	    piece = 'player' + i;
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
	    player: 'o',
	    piece: movingPiece,
	    from: moveFrom,
	    to: moveTo
	   };
}
