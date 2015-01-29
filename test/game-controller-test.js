var chai = require('chai');
chai.should();
chai.use(require('chai-things'));
var expect = chai.expect;
var GameController = require('../lib/game-controller');
var spawn = require('child_process').spawn;
var controller = new GameController(1);
var Game = require('../lib/game');
var dbServer = spawn('redis-server', ['--dir', './test/',
				      '--dbfilename', 'testing.rdb']);
var testGame;

describe('[MODULE game-controller.js]', function () {

    describe('#GameController constructor', function () {
	
	it('Returns a GameController Object', function () {
	    expect(controller.id).to.equal(1);
	    expect(controller.winningStates).to.be.an('array');
	});

	it('Should connect to the test db server', function () {
	    expect(dbServer.killed).to.equal(false);
	});
    });

    describe('#createGame()', function () {

	it('Creates a valid game', function (done) {
	    controller.createGame('test', 'x', 'o', function (err, res) {
		expect(err).to.equal(null);
		expect(res.x.pid).to.equal('x');
		testGame = res;
		done();
	    });
	});
    });

    describe('#submitMove()', function () {

	it('Rejects a malformed request', function (done) {
	    var request = {player: 'x', to: 6, piece: 'player1'};
	    controller
		.submitMove(testGame, request, function (err, res) {
		    expect(err.error)
			.to.equal('Invalid request');
		    done();
		});
	});
	
	it('Rejects a move when not a player\'s turn', function (done) {
	    var request = {player: 'o', from: 0, to: 6, piece: 'player2'};
	    controller.submitMove(testGame, request, function (err, res) {
		expect(err.error).to.equal('Invalid move');
		expect(testGame.turn).to.equal('x');
		done();
	    });
	});

	it('Accepts a move and updates game state', function (done) {
	    var request = {player: 'x', from: 1 << 25,
			   to: 7, piece: 'player2'};
	    controller.submitMove(testGame, request, function (err, res) {
		expect(err).to.equal(null);
		expect(testGame.turn).to.equal('o');
		expect(testGame.x.state).to.equal(1 << request.to);
		done();
	    });
	});

	it('Rejects a move when the the request overlaps with opponent',

	   function (done) {
	       var request = {player: 'o',
			      from: 0, to: 7, piece: 'player2'};

	       controller.submitMove(testGame, request, function (err, res) {
		   expect(err.error).to.equal('Invalid move');
		   done();
	       });
	   });

	it('Rejects a move when the the request overlaps with itself',

	   function () {
	       var request = {player: 'o',
			      from: 25, to: 0, piece: 'player2'};
	       var game = {gid: 'test',
			   turn: 'o',
			   x: {
			       pid: 'x',
			       player0: 12,
			       player1: 10,
			       player2: 6,
			       state: 5184,
			       piecesOnBoard: 3
			   },
			   o: {
			       pid: 'o',
			       player0: 0,
			       player1: 1,
			       player2: 1 << 25,
			       state: 3,
			       piecesOnBoard: 2
			   }
			  };

	       controller.submitMove(game, request, function (err, res) {
		   err.errorReason.should.equal('That space is occupied');
	       });
	   });

	it('Rejects out-of-bounds moves', function (done) {
	    var request = {player: 'o',
			   from: 0, to: 23, piece: 'player2'};
	    controller.submitMove(testGame, request, function (err, res) {
		expect(err.error).to.equal('Invalid move');
		done();
	    });
	});

	it('Alerts when a player wins', function (done) {
	    var winningGame = {
		gid: 'winning',
		x: {pid: 'x', player1: 1 << 12, state: 64 + 4096 + 128},
		o: {pid: 'o', player1: 1 << 13, state: 141312}, // 11, 13, 18
		turn: 'x',
		active: true
	    };

	    var winningRequest = {
		player: 'x', piece: 'player1',
		from: 12, to: 8 // 6,7,8
	    };

	    controller.submitMove(winningGame, winningRequest, check);
	    function check (err, res) {
		expect(err).to.equal(null);
		expect(res.game.winner).to.equal('x');
		done();
	    }
	});

	/*it('Transforms the board when an accepted move lands on an edge',
	   function () {
	       var request = {player: 'x', piece: 'player0',
			      from: 1 << 25, to: 0
			     };
	       var game = {
		   active: true,
		   gid: 'test2',
		   x: {pid: 'x', player0: 1 << 25, state: 0},
		   o: {pid: 'o', player0: 1 << 6, state: 1 << 6},
		   turn: 'x'
	       };

	       controller.submitMove(game, request, check);
	       
	       function check (err, res) {
		   console.log(err);
		   expect(err).to.equal(null);
		   expect(res.game.x.player0).to.equal(1 << 6);
	       }
	   });*/

    });

    describe('#reorientBoard()', function () {
	it('Shifts all states one row up when a pieces on the bottom',
	   function () {
	       var game = {
		   x: {pid: 'x', player0: 1 << 7,
		       player1: 1 << 8, state: (1 << 7) + (1 << 8)},
		   o: {pid: 'o', player0: 1 << 6,
		       player1: 1 << 2, state: (1 << 6) + (1 << 2)}
	       };
	       var result = controller.reorientBoard(game);
	       expect(result.x.player1).to.equal(1 << 13);
	       expect(result.o.state).to.equal(68 << 5);
	   });
    });

    describe('#processMoveRequest()', function () {

	it('Returns a db read error when applicable', function (done) {
	    controller.processMoveRequest({gid: 'not there'}, callback);
	    function callback (err, res) {
		expect(err.error).to.equal('Database error: Game not found');
		expect(err.request.gid).to.equal('not there');
		expect(res).to.equal(undefined);
		done();
	    }
	});

	it('Returns an error from `submitMove` when applicable',
	   function (done) {
	       controller.processMoveRequest({gid: testGame.gid,
					      everythingElse: 'missing'
					     }, callback);

	       function callback (err, res) {
		   expect(err.error).to.equal('Invalid request');
		   expect(err.request.everythingElse).to.equal('missing');
		   expect(res).to.equal(undefined);
		   done();
	       }
	   });

	it('Returns a success object on success', function (done) {
	    var request = {gid: testGame.gid,
			   player: 'x',
			   piece: 'player2',
			   from: 1 << 25,
			   to: 12};
	    controller.processMoveRequest(request, callback);
	    function callback (err, res) {
		expect(err).to.equal(null);
		console.log(err);
		expect(res.ok).to.equal(true);
		expect(res.game.turn).to.equal('o');
		expect(res.game.x[request.piece]).to.equal(request.to);
		done();
	    }
	});
    });
    
	    
    after(function () {
	dbServer.kill();
    });
});
