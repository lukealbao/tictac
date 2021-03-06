var chai = require('chai');
chai.should();
chai.use(require('chai-things'));
var expect = chai.expect;
var struct = require('../lib/struct');
var bits = require('../lib/bits');

describe('[MODULE struct.js]', function () {

    describe('boardMask', function () {
	it('Returns a single value - a mask of a 3x3 board @ index 0',
	   function () {
	       expect(struct.boardMask).to.equal(7399);
	   });
    });

    describe('stages', function () {
	it('Returns an array of #boardMasks translated across 5x5',
	   function () {
	       expect(struct.stages).to.be.an('array');
	       expect(struct.stages).to.include.members([14798, 7399]);
	   });
    });

    
    describe('attackVectors', function () {
	it('Accepts a game score and returns an array of vectors',
	   function () {
	       expect(struct.attackVectors(448)).to.be.a('array');
	       struct.attackVectors(448).should.include(448);
	   });
    });

    describe('edges', function () {
	it('Returns an array of edges objects', function () {
	    expect(struct.edges).to.be.a('object');
	    expect(struct.edges.bottom).to.equal(31);
	});
    });

    describe('singlePlayerStates', function () {
	it('Returns an array of integers of 0-3 set bits', function () {
	    expect(struct.singlePlayerStates).to.be.a('array');
	    struct.singlePlayerStates.should
		.include.members([0,64,192,448]);
	    struct.singlePlayerStates.should.not.include(268736);
	});
    });
    
    describe('fullGameStates', function () {
	it('Returns an array of integers of 0-6 set bits', function () {
	    expect(struct.fullGameStates).to.be.a('array');
	    struct.fullGameStates.should
		.include.members([0, 64, 192, 448, 4544, 268736]);
	});
    });

    describe('winningStates', function () {
	it('Returns an array of winning states', function () {
	    expect(struct.winningStates).to.be.a('array');
	    struct.winningStates.should.include(448);
	});
    });

    describe('moveGraph', function () {
	var graph = struct.moveGraph
	it('Returns an adjacency list of 0-3 set-bit integers to arrays',
	   function () {
	       expect(graph).to.be.a('object');
	       expect(graph).to.have.property(0);
	       expect(graph).to.have.property(64);
	       expect(graph).to.not.have.property(268736);
	   });

	it('Maps only 3-set-bit values for 3-set-bit keys', function () {
	    var edges = graph[448];
	    var bitsSet = bits.getFlags(448).length;

	    for (var i = 0, len = edges.length; i < len; i++) {
		expect(bits.getFlags(edges[i]).length)
		    .to.be.equal(3);
	    }	 
	});

	it('Maps some known edges', function () {
	    expect(graph[0]).to.include.members([16, 32, 1024]);
	    expect(graph[0]).to.not.include(192);
	    expect(graph[192]).to.not.include(64);
	});

	it('Has no exit edges for winning games', function () {
	    expect(graph[448].length).to.equal(0);
	});
    });

});
