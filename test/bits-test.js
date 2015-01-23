var chai = require('chai');
var expect = chai.expect;
var bits = require('../lib/bits');

describe('[MODULE bits.js]', function () {

    describe('#oneStepAway()', function () {
	it('Returns true for (il)legal moves that are 1-step away',
	   function () {
	       expect(bits.oneStepAway(448, 2432)).to.be.equal(true);
	       expect(bits.oneStepAway(448, 4194688))
		   .to.be.equal(true);
	       expect(bits.oneStepAway(320, 448)).to.be.equal(true);
	   });

	it('Includes moves from zero to one piece', function () {
	    expect(bits.oneStepAway(0, 64)).to.equal(true);
	});

	it('Rejects states that have more than two moved pieces',
	   function () {
	       expect(bits.oneStepAway(0, 192)).to.equal(false);
	       expect(bits.oneStepAway(448, 14336)).to.equal(false);
	   });
    });

});
