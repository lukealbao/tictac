var chai = require('chai');
chai.should();
chai.use(require('chai-things'));
var expect = chai.expect;
var bits = require('../lib/bits');
var Game = require('../lib/game');

describe('[MODULE: game]', function () {

    describe('#Game() constructor', function () {
	it('Returns a properly formatted Game object', function () {
	    var game = new Game('socket', 'player', 'opponent');
	    expect(game.x.pid).to.equal('player');
	    expect(game.o.pid).to.equal('opponent');
	    expect(game.pendingMoves).to.be.a('array');
	    expect(game.pendingMoves.length).to.equal(0);
	});
    });
});
