var chai = require('chai');
chai.should();
chai.use(require('chai-things'));
var expect = chai.expect;
var bits = require('../lib/bits');
var ai = require('../lib/ai-controller');
var winningScore = 7; // Three in a row
var pinnedScore = 1; // Two in a row w/ opponent between
var attackingScore = 2; // Two in a row w/ nothing betweeen
var winningPlayer = bits.setFlags([6,7,8]);
var winningGame = bits.setFlags([6,7,8, 12,17,11]);
var checkMatePlayer = bits.setFlags([7,8,18]);
var checkMateGame = bits.setFlags([7,8,18, 12,17,11]);


describe('[MODULE: ai-controller]', function () {
    
    describe('#getMoves()', function() {
	it('Returns a list of "move, game" objects', function () {
	    var results = ai.getMoves(checkMatePlayer, checkMateGame);
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

	it('Does not return moves that overlap with the root', function () {
	    var result = ai.getMoves(2, 3);
	    for (var i = 0, l = result.length; i < l; i++) {
		expect(result[i].player & 1).to.equal(0);
		expect(result[i].player).to.not.equal(2);
	    }
	});

	it('Returns a list of moves on an empty board', function () {
	    var results = ai.getMoves(0, 0);
	    expect(results.length).to.equal(25);
	});

    });

    describe('#score()', function () {

	it('Returns -6 for a losing state', function () {
	    var result = ai.score(winningPlayer, winningGame, false);
	    expect(result).to.be.equal(-winningScore);
	});

	it('Returns a 0-score for a single piece', function () {
	    expect(ai.score(0, 32, true)).to.equal(0);
	    expect(ai.score(0, 32, false)).to.equal(0);
	});

	it('Returns a 6-score when winning', function () {
	    var result = ai.score(winningPlayer, winningGame, true);
	    expect(result).to.equal(winningScore);
	});

	it('Returns a 4 when attacking two cells', function () {
	    var result = ai.score(checkMatePlayer, checkMateGame, true);
	    expect(result).to.equal(4);
	});

	it('Returns a 2 when attacking one cell', function () {
	    var player = bits.setFlags([6, 8, 17]);
	    var game = bits.setFlags([6, 8, 17, 16, 13, 12])
	    var result = ai.score(player, game, true);
	    expect(result).to.equal(2);
	});

	it('Returns a 1 when pinning an opponent', function () {
	    var player = bits.setFlags([6, 8, 17]);
	    var game = bits.setFlags([6, 8, 17, 7, 12, 13]);
	    var result = ai.score(player, game, true);
	    expect(result).to.equal(1);
	});

    });


    describe('#calculateMove()', function () {
	it('Returns a winning move at depth 1', function () {
	    var result = ai.calculateMove(checkMatePlayer,
					       checkMateGame, 1);
	    expect([448, 270592]).to.contain.members([result]);
	});

	it('Returns a winning move at depth 4', function () {
	    var result4deep = ai.calculateMove(checkMatePlayer,
					       checkMateGame, 4);
	    expect([448, 270592]).to.contain.members([result4deep]);
	});

	it('Does not return a proven bad move when others are available',
	   function () {
	       var result = ai.calculateMove(0, 1 << 12, 3);
	       result.should.not.equal(24);
	   });

	// old MinMax tests
       it('Returns a winning score for a winning game at depth 0',
	  function () {
	      var result = ai.alphaBetaSearch(winningPlayer,
					      winningGame, 0,
					      -Infinity, Infinity, true);
	      expect(result).to.equal(winningScore);
	  });

       it('Returns a winning next move for a checkmate position',
	  function () {
	      var result = ai.calculateMove(checkMatePlayer,
					    checkMateGame, 3);
	      
	      expect([bits.setFlags([6,7,8]), bits.setFlags([8,13,18])])
		  .to.include.members([result]);
	  }
 	 );

	it('Returns moves that don\'t overlap current state', function () {
	    var game = {x: {player0: 12,
			    player1: 10,
			    player2: 6,
			    state: bits.setFlags([12,10,6]),
			    piecesOnBoard: 3},
			o: {player0: 0,
			    player1: 1,
			    player2: 1 << 25,
			    state: 3,
			    piecesOnBoard: 2},
			turn: 'o'
		       };
	    var result = ai.calculateMove(game.o.state,
					  game.o.state + game.x.state, 3);

	    expect(result).to.not.equal(5);
	});
	   
   });

    describe('#prepareMove()', function () {

	it('Transforms a #calculateMove result to a move request object',
	   function () {
	       var game = {
		   gid: 'test',
		   o: {player0: 1, player1: 1 << 25,
		       player2: 1 << 25, state: 2, piecesOnBoard: 1}
	       };
	    
	       var bestMove = 3;
	       var expectedResult = {
		   gid: 'test', player: 'o',
		   piece: 'player1', from: 1 << 25, to: 0
	       };

	       expect(ai.prepareMove(game, bestMove))
		      .to.deep.equal(expectedResult);
	   });

	it('Works when there are three pieces on the board', function () {
	    var game = {
		gid: 'test',
		o: {player0: 0, player1: 1, player2: 5,
		    piecesOnBoard: 3, state: 35
		   }
	    };
	    var bestMove = bits.setFlags([0,1,7]);
	    var expectedResult = {
		gid: 'test', player: 'o',
		piece: 'player2', from: 5, to: 7
	    };

	    expect(ai.prepareMove(game, bestMove))
		.to.deep.equal(expectedResult);
	
	});
    });   
});
