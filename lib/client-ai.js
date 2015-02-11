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
