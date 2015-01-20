/*-------------------------------------------------------*\
 |                    Class: Game                        |
 |                                                       |
 |  A Class:Game is the in-memory representation of game |
 |  state used by the Class:GameController. The official |
 |  model is kept in Redis.                              |
\*-------------------------------------------------------*/

var crypto = require('crypto');

function Player(id) {
    this.pid = id;
    this.player0 = 0;
    this.player1 = 0;
    this.player2 = 0;
    this.state = 0;
}

function Game(socketId, xId, oId) {
    this.gid = crypto.createHash('md5')
	.update(new Date() + socketId)
	.digest('hex');

    this.x = new Player(xId);
    this.o = new Player(oId);

    this.turn = 'x';
    this.me = 'x';
    this.active = true;
    this.winner = null;
    this.history = [];
    // pendingMoves objects are: [Number: pieceId, Number: cellIndex]
    this.pendingMoves = [];
}

module.exports = Game;
