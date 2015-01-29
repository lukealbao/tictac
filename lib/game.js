/*-------------------------------------------------------*\
 |                    Class: Game                        |
 |                                                       |
 |  A Class:Game is the in-memory representation of game |
 |  state used by the Class:GameController. The official |
 |  model is kept in Redis.                              |
\*-------------------------------------------------------*/

var crypto = require('crypto');
var STARTIDX = 1 << 25;

function Player(id) {
    this.pid = id;
    this.player0 = STARTIDX;
    this.player1 = STARTIDX;
    this.player2 = STARTIDX;
    this.state = 0;
    this.piecesOnBoard = 0;
}


function Game(socketId, xId, oId) {
    this.gid = crypto.createHash('md5')
	.update(new Date() + socketId)
	.digest('hex');

    this.x = new Player(xId);
    this.o = new Player(oId);

    this.turn = 'x';
    this.me = 'x';
    this.opponent = 'o';
    this.active = true;
    this.winner = null;
    this.history = [];
    // pendingMoves objects are: [Number: pieceId, Number: cellIndex]
    this.pendingMoves = [];
}

module.exports = Game;
