//                           ~ game-controller.js ~

/*----------------------------------------------------------------------*\
 |                          Class: GameController                       |
 |                                                                      |
 | The Class:GameController processes request from players. It does this|
 | on a Class:Game object. It can create new games and referee games.   |
 | The authoritative models of games live in Redis.                     |
 |                                                                      |
 | This module exports the constructor for the class.                   |
\*----------------------------------------------------------------------*/

module.exports = GameController;

var struct = require('./struct');
var fullGameStates = struct.fullGameStates;
var singlePlayerStates = struct.singlePlayerStates;
var winningStates = struct.winningStates;
var db = require('redis').createClient();
var Game = require('./game');
var async = require('async');

function GameController (id) {
    this.id = id;
    this.fullGameStates = fullGameStates;
    this.singlePlayerStates = singlePlayerStates;
    this.winningStates = winningStates;
}

GameController.prototype.submitMove = submitMove;
GameController.prototype.validMove = validMove;
GameController.prototype.processMoveRequest = processMoveRequest;
GameController.prototype.createGame = createGame;
GameController.prototype.reorientBoard = reorientBoard;

// [Public] createGame: String, String, String, Function -> Function()
/*----------------------------------------------------------------------*\
 |             Class:GameController :: Function:createGame              |
 |                                                                      |
 | Create a new instance of Class:Game. Store it in the database and    |
 | pass it along to a callback.                                         |
 |                                                                      |
 | @param socketId, String: The calling socket's ID                     |
 | @param xId, String: The ID for user at Player-x                      |
 | @param oId, String: The ID for user at Player-o                      |
 | @param callback, Function: callback(dbError, Class:Game)             |
\*----------------------------------------------------------------------*/
function createGame (socketId, xId, oId, callback) {
    var game = new Game(socketId, xId, oId);
    db.set(game.gid, JSON.stringify(game), function (err, res) {
	if (err) {
	    callback(err);
	    return;
	} else {
	    callback(null, game);
	}
    });
}

// [Private] submitMove: Object, Object, Function -> Function(Object)
/*----------------------------------------------------------------------*\
  |           Class:GameController :: Function:submitMove                |
  |                                                                      |
  | Main controller method. Process a move request. Produce a `response` |
  | object and pass it along to a callback.                              |
  |                                                                      |
  | @param game, Object: Class:Game                                      |
  | @param request, Object: Class:MoveRequest, received from client      |
  | @param callback, Function: callback(errorResponse, successResponse)  |
  \*----------------------------------------------------------------------*/
function submitMove (game, request, callback) {
    var response = {request: request};
    var STARTIDX = 1 << 25;
    
    if (typeof request !== 'object'
	|| typeof request.player !== 'string'
	|| typeof request.from !== 'number'
	|| typeof request.to !== 'number'
	|| typeof request.piece !== 'string') {

	response.error = 'Invalid request';
	response.errorReason = 'Invalid datatypes';
	callback(response);
	return;
    }

    if (!game.active) {
	response.error = 'Invalid request';
	response.errorReason = 'This game is finished.';
    }
    
    var player = request.player;
    var opponent = player === 'x' ? 'o' : 'x';
    var proposedState = game[player].state
	- (request.from !==  STARTIDX ?  (1 << request.from) : 0)
	+ (1 << request.to);

    var proposedGame = game[opponent].state
	+ proposedState;

    if (game.turn !== request.player) {
	response.error = 'Invalid move';
	response.errorReason = 'It is not your turn';
	callback(response);
	return;
	
    } else if ( (1 << request.to & game.x.state) !== 0
		|| (1 << request.to & game.o.state) !== 0) {
	response.error = 'Invalid move';
	response.errorReason = 'That space is occupied';
	callback(response);
	return;
	
    } else if ( !this.validMove(proposedGame, proposedState) ) {
	response.error = 'Invalid move';
	response.errorReason = 'That move is out of bounds';
	callback(response);
	return;

    } else {    
	// Success case	
	game[player][request.piece] = request.to;
	game[player].state = proposedState;

	game[player].piecesOnBoard = Math.min(
	    ++game[player].piecesOnBoard, 3);

	game.turn = (game.turn === 'x' ? 'o' : 'x');
	
	if (this.winningStates.indexOf(proposedState) > -1) {
	    response.winning = true;
	    game.winner = player;
	    game.active = false;
	}
	
	response.ok = true;
	response.game = game;
	response.piece = request.piece;
	response.to = request.to;
	
	callback(null, response);
	return;
	
    } 
}

// [Private] validMove: Object, Object -> Boolean
/*----------------------------------------------------------------------*\
 |             Class:GameController :: Function:validMove               |
 |                                                                      |
 | Determine if a given move on a given game is legal.                  |
 |                                                                      |
 | @param game, Object: Class:Game                                      |
 | @param move, Object: Class:MoveRequest, received from client.        |
\*----------------------------------------------------------------------*/
function validMove (game, move) {
    return this.fullGameStates.indexOf(game) > -1
	&& this.singlePlayerStates.indexOf(move) > -1;
}

// [Public] processMoveRequest: Object, Function -> Function(Object)
/*----------------------------------------------------------------------*\
 |         Class:GameController :: Function:processMoveRequest          |
 |                                                                      |
 | Public API for `GameController::submitMove`. Receives a client       |
 | Class:Request object. Calls a callback on response received from     |
 | `submitMove`.                                                        |
 |                                                                      |
 | @param Object, request: Class:Request                                |
 | @param Function, callback: callback(errorResponse, successResponse)  |
 \*----------------------------------------------------------------------*/
function processMoveRequest (request, callback) {
    var controller = this;
    async.waterfall(
	
	// Process
	[function loadGameState (next) {
	    db.get(request.gid, function(err, res) {
		var error;
		if (!res) {
		    error = db.connected ? 'Game not found'
			: 'Connection error';
		    next({error: 'Database error: ' + error,
			  request: request});
		} else {
		    next(null, JSON.parse(res), request);
		}
	    });
	},
	 function submitMove (game, request, next) {
	     controller.submitMove(game, request, next);
	 },
	 function moveIfEdgeHit (response, next) {
	     response.game = controller.reorientBoard(response.game);
	     next(null, response);
	 },
	 function writeGame (response, next) {
	     var gameJSON = JSON.stringify(response.game);
	     db.set(response.game.gid, gameJSON, function(err, res) {
		 if (!res) {
		     response.error = 'Database error: couldn\'t write game';
		     next(response);
		 } else {
		     next(null, response);
		 }
	     });
	 },
	 function alertOpponent (response, next) {
	     var opponent = response.game[response.game.turn].pid;
	     response.nextMove = opponent;
	     response.piece = response.piece.replace('player', 'opponent');
	     next(null, response);
	 }],

	// Respond
	function drain (err, response) {
	    if (err) {
		callback(err);
		return;
	    } else {
		callback(null, response);
		return;
	    }
	});
}


function reorientBoard (game) {
    var edges = struct.edges;
    var transform = 0;
    var gameState = game.x.state + game.o.state;

    if (gameState & edges.left) {
	transform -= 1;
    }
    if (gameState & edges.right) {
	transform += 1;
    }
    if (gameState & edges.top) {
	transform -= 5;
    }
    if (gameState & edges.bottom) {
	transform += 5;
    }

    ['player0', 'player1', 'player2', 'state']
	.forEach( function (key) {
	    if (transform > 0) {
		game.x[key] = game.x[key] << transform;
		game.o[key] = game.o[key] << transform;
	    } else if (transform < 0) {
		game.x[key] = game.x[key] >> transform;
		game.o[key] = game.o[key] >> transform;
	    }
	});
    return game
}
