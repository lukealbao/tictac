"use strict";

/* TODO
 *
 * Clean up namespace. There is a lot of `this` reference. Can you change that?
 * Include the `moveGraph` into the model.
 */
function pass() {}

/* sendMove: string, number, number -> object
 * 
 * Input two indices: `movefrom` and `moveTo`. If it is a valid move, update
 * the model and return a JSON object as a response.
 * 
 * Example: sendMove("player1", 11, 15) 
 *               -> {error: null, playerState: 492, 
 *                   opponentState: 39012, gameState: 39504}
 * 
 * @param  {String} player, Required. The player sending the move.
 * @param  {Number} moveFrom, Required. The index of the piece to move.
 * @param  {Number} moveTo, Required. The index of the space to move to.
 * 
 * @return {String} error, Optional. A string of any error.
 * @return {Number} playerState, Required. The new state of the sending player
 * @return {Number} opponentState, Required. New state of opponent
 * @return {Number} boadState, Required. New state of game (opponent | player)
 */
function sendMove(player, moveFrom, moveTo) {
    var proposedState,
	proposedGame,
	player = this.currentGame[player],
	board = this.currentGame.board,
	mask = (1 << moveFrom) ^ 16777215;

    if (!player.turn) return {error: "It's not your turn!"};

    proposedState = player.state & mask;        // Remove
    proposedState = proposedState | 1 << moveTo; // Replace
    proposedGame = proposedState | player.opponent.state;

    if (this.validGame(proposedState, player.opponent.state)
	&& this.currentGame.boardStates.indexOf(proposedGame) != -1) {
	
	// Update model
	board.state = proposedState | player.opponent.state;
	player.state = proposedState;
	player.turn = !player.turn;
	player.opponent.turn = !player.opponent.turn;

	return {
	    playerState: player.state,
	    boardState: board.state,
	    opponentState: board.state & ( player.state ^ 16777215 )
	}
    } else {
	return {error: "That's an invalid move.",
	        sentFromIndex: moveFrom,
	        sentToIndex: moveTo,
	        requestedState: proposedState};
    }
}

/* sendState: string, number -> object
 * 
 * Like `sendMove`, this sends a move to change the state of the game. Unlike 
 * `sendMove`, this one only sends a state, rather than two indexes. Note, it
 * is just a wrapper, therefore, for `sendMove`.
 * 
 * Example: sendState("player1", 488) -> {....}
 */
function sendState(player, newState) {
    var oldState = this.currentGame[player].state,
	from = oldState & (oldState ^ newState),
	to = newState & (oldState ^ newState);

    function toIndex(n) {
	for (var i = 0; i < 24 ; i ++) {
	    if (n & 1 << i) return i;
	}
    };

    return sendMove.call(this, player, toIndex(from), toIndex(to));
}


//Required for findMoves
var moveGraph =  require('./lib/moveGraph');

/* findMoves: string -> array
 * 
 * Find all possible moves for a player.
 * 
 * Example: findMoves("player1") -> [3434, 8983, ...]
 */
function findMoves(player) {
    var curr,
	proposedGame,
	validMoves = [],
	player = this.currentGame[player],
	allMoves = moveGraph[player.state];

    for (var i = 0, len = allMoves.length; i < len; i++) {
	curr = allMoves[i];
	proposedGame = curr | player.opponent.state;
	
	if (this.validGame(curr, player.opponent.state)
	    && this.currentGame.boardStates.indexOf(proposedGame) != -1) {

	    validMoves.push(curr);
	}
    }

    return validMoves;
}

    
    
	

module.exports = {
    sendMove: sendMove,
    sendState: sendState,
    findMoves: findMoves
};
