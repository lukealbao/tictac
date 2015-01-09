'use strict';

module.exports = {
    Game : function(initP1, initP2) {

	this.player1 = {
	    state: initP1,
	    turn: true
	};

	this.player2 = {
	    state: initP2,
	    turn: false
	};

	this.board = {
	    state: this.player1.state
		   | this.player2.state
	};

	this.player1.opponent = this.player2;
	this.player2.opponent = this.player1;

	this.boardStates = require('./lib/fullBoards.js');


    }
}
