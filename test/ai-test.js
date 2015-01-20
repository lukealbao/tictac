var chai = require('chai');
chai.should();
chai.use(require('chai-things'));
var expect = chai.expect;
var bits = require('../lib/bits');
var ai = require('../lib/ai-controller');
var winningScore = 2; // Three in a row
var pinnedScore = 0.6667; // Two in a row w/ opponent between
var attackingScore = 1; // Two in a row w/ nothing betweeen
var winningPlayer = bits.setFlags([6,7,8]);
var winningGame = bits.setFlags([6,7,8, 12,17,11]);
var checkMatePlayer = bits.setFlags([6,8,18]);
var checkMateGame = bits.setFlags([6,8,18, 12,17,11]);


describe('[MODULE: ai-controller]', function () {
    
    describe('#getMoves()', function() {
	it('Returns a list of "move, game" objects', function () {
	    var results = ai.getMoves(winningPlayer, winningGame);
	    expect(results).to.be.a('array');
	    expect(results[0]).to.be.a('object');
	    expect(results[0]).to.have.property('player');
	    expect(results[0]).to.have.property('game');
	});

	it('Returns objects that are legal move/game combos', function () {
	    var result = ai.getMoves(checkMatePlayer, checkMateGame)[0];
	    var player = result.player;
	    var game = result.game;
	    expect(bits.oneStepAway(checkMatePlayer, player)).to.equal(true);
	    expect(bits.oneStepAway(checkMateGame, game)).to.equal(true);
	});

	it('Returns a winning state if available', function () {
	    var results = ai.getMoves(checkMatePlayer, checkMateGame);
	    expect(results).to.be.a('array');
	    expect(results[0]).to.be.a('object');
	    results.should.include.something.that
		.deep.equals({player: winningPlayer, game: winningGame});
	});
    });

    describe('#score()', function () {
	it('Returns 2 for a winning state', function () {
	    var result = ai.score(winningPlayer, winningGame, true);
	    expect(result).to.be.equal(2);
	});

	it('Returns -2 for a losing state', function () {
	    var result = ai.score(winningPlayer, winningGame, false);
	    expect(result).to.be.equal(-2);
	});

	it('Returns a maximum absolute value of 2', function () {
	    var result = ai.score(checkMatePlayer, checkMateGame, true);
	    expect(result).to.be.equal(2);
	});
    });

   describe('#minMax()', function() {
       it('Returns a winning score for a winning game at depth 0',
	  function () {
	      var result = ai.minMax(winningPlayer, winningGame, 0,
				     true, ai.getMoves, ai.score);
	      expect(result).to.equal(winningScore);
	  });

       it('Returns a winning next move for a checkmate position',
	  function () {
	      var result = ai.minMax(checkMatePlayer, checkMateGame, 2,
				     true, ai.getMoves, ai.score);
	      
	      expect([bits.setFlags([6,7,8]), bits.setFlags([8,13,18])])
		  .to.include.members([result]);
	  }
 	 );
       
       it('Returns a score for a depth <= 1', function () {
	   var result = ai.minMax(checkMatePlayer, checkMateGame, 1,
				  true, ai.getMoves, ai.score);
	   expect(result).to.be.below(3);
       });
       
       it('Returns a candidate for a depth > 1', function () {
	   var result = ai.minMax(checkMatePlayer, checkMateGame, 2,
				  true, ai.getMoves, ai.score);
	   expect(result).to.be.above(100);
       });

    });
    
});
