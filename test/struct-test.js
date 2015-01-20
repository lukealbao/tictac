var chai = require('chai');
chai.should();
chai.use(require('chai-things'));
var expect = chai.expect;
var struct = require('../lib/struct');
var bits = require('../lib/bits');

describe('[MODULE struct.js]', function () {

    describe('attackVectors', function () {
	it('Returns an array of attack vectors', function () {
	    expect(struct.attackVectors).to.be.a('array');
	    struct.attackVectors.should.include(31);
	});
    });

    describe('edges', function () {
	it('Returns an array of edges objects', function () {
	    expect(struct.edges).to.be.a('object');
	    expect(struct.edges.bottom).to.equal(31);
	});
    });

    describe('singlePlayerStates', function () {
	it('Returns an array of integers of 3 set bits', function () {
	    expect(struct.singlePlayerStates).to.be.a('array');
	    struct.singlePlayerStates.should.include(448);
	    struct.singlePlayerStates.should.not.include(268736);
	});
    });
    
    describe('fullGameStates', function () {
	it('Returns an array of integers of 6 set bits', function () {
	    expect(struct.fullGameStates).to.be.a('array');
	    struct.fullGameStates.should.include(448);
	    struct.fullGameStates.should.include(268736);
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
	it('Returns an adjacency list of 3-set-bit integers to arrays',
	   function () {
	       expect(graph).to.be.a('object');
	       expect(graph).to.have.property(448);
	       expect(graph).to.not.have.property(268736);
	   });

	it('Maps only 3-set-bit values for 3-set-bit keys', function () {
	    var edges = graph[448];
	    var bitsSet = bits.getFlags(448).length;

	    for (var i = 0, len = edges.length; i < len; i++) {
		expect(bits.getFlags(edges[i]).length)
		    .to.be.equal(bitsSet);
	    }	 
	});
    });

});
