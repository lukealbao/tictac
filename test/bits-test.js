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
    });

});
