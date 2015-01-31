/*-------------------------------------------------------*\
 |                    Class: Game                        |
 |                                                       |
 |  A Class:Game is the in-memory representation of game |
 |  state used by the Class:GameController. The official |
 |  model is kept in Redis.                              |
\*-------------------------------------------------------*/

var crypto = require('crypto');
var STARTIDX = 1 << 25;

function Player(id, player) {
    this.pid = id;
    this[player+'0'] = STARTIDX;
    this[player+'1'] = STARTIDX;
    this[player+'2'] = STARTIDX;
    this.state = 0;
    this.piecesOnBoard = 0;
}


function Game(socketId, xId, oId) {
    this.gid = crypto.createHash('md5')
	.update(new Date() + socketId)
	.digest('hex');

    this.x = new Player(xId, 'x');
    this.o = new Player(oId, 'o');

    this.turn = 'x';
    this.me = null;
    this.opponent = 'o';
    this.active = true;
    this.winner = null;
    this.history = [];
    // pendingMoves objects are: [Number: pieceId, Number: cellIndex]
    this.pendingMoves = [];
}

module.exports = Game;
