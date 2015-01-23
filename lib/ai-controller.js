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
module.exports = {alphaBetaSearch: alphaBetaSearch,
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
    var bestMove = calculateMove(game.o.state,
				 game.o.state + game.x.state,
				 3);
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

function calculateMove(root, game, depth) {
    var children = getMoves(root, game);
    var alpha = -Infinity;
    var beta = Infinity;
    var bestTopLevelChoice = children[Math.floor(Math.random()
						 * children.length)].player;

    children.forEach( function (branch) {
	var childScore = alphaBetaSearch(branch.player, branch.game,
					 depth - 1, alpha, beta, true);
	if (childScore > alpha) {
	    alpha = childScore;
	    bestTopLevelChoice = branch.player;
	}
    });

    return bestTopLevelChoice;
}

function alphaBetaSearch (state, game, depth, alpha, beta, maximize) {
    if (depth < 1) {
	return score(state, game, maximize);
    }
    
    var children = getMoves(state, game);
    var child;

    while (child = children.pop()) {
	var currentScore;
	var current = child.player;
	var game = child.game;
	var opponent = current ^ game;

	currentScore = alphaBetaSearch(opponent, game, depth -1,
				       alpha, beta, !maximize);

	if (maximize) {
	    if (currentScore > alpha) {
		alpha = currentScore;
	    }
	    if (alpha >= beta) {
		return beta;
	    }
	} else if (!maximize) {
	    if (currentScore < beta) {
		beta = currentScore;
	    }
	    if (alpha >= beta) {
		return alpha;
	    }
	}
    };

    return maximize ? alpha : beta;
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
  | - Three pieces in a row (winning): 6 points                          |
  \*----------------------------------------------------------------------*/
function score (player, game, maximize) {
    var opponent = player ^ game;
    var netScore = 0;

    attackVectors.forEach( function (vector) {
	var vectorScore;
	var playerFlags = getFlags(vector & player).length;
	var opponentFlags = getFlags(vector & opponent).length;

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
