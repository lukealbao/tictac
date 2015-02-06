var chai = require('chai');
chai.should();
chai.use(require('chai-things'));
var expect = chai.expect;
var io = require('socket.io-client');
var request = require('request');
var spawn = require('child_process').spawn;
var url = 'http://localhost:3030';
var options = {
    transports: ['websocket'],
    'force new connection': true
};
var Game = require('../lib/game');
var app;
var dbServer;

describe('[MODULE: app.js]', function () {
    before(function () {
	dbServer = spawn('redis-server',
			     ['--dir', './test/',
			      '--dbfilename', 'testing.rdb']);

	app = require('../app');
    });

    after(function () {
	dbServer.kill();
    });

    describe('HTTP Server', function () {
	it('Responds to HTTP requests on port 3030', function (done) {
	    request('http://localhost:3030', function (err, res, body) {
		expect(err).to.equal(null);
		expect(res.statusCode).to.be.below(400);
		done();
	    });
	});
    });

    describe('Socket.io Server', function () {
	it('Responds to Socket.io connections and registers them in app',
	   function (done) {
	       var client1 = io.connect(url, options);
	       client1.once('Hello', function (response) {
		   expect(response.user).to.equal('test user1');
		   expect(app.connectedUsers['test user1'])
		       .to.equal(response.currentSocket);
		   client1.disconnect();
		   done();
	       });

	       client1.on('connect', function () {
		   client1.emit('Hello', {user: 'test user1'});
	       });
	   });

	it('Unregisters users when they disconnect', function () {
	    expect(app.connectedUsers).to.be.an('object');
	    expect(app.connectedUsers['test user1']).to.equal(undefined);
	});
    });

    describe('Game Controller routing', function () {
	it('Responds to a request for a new game', function (done) {
	    
	    var client2 = io.connect(url, options);
	    client2.once('New Game Response', function (data) {
		expect(data.gid).to.be.a('string');
                expect(data.player).to.equal('x');
		expect(data.ok).to.equal(true);
		expect(data.error).to.equal(undefined);
		done();
	    });

	    client2.on('connect', function () {
		client2.emit('Hello', {user: 'test user2'});
		client2.emit('Request New Game',
                             {player: 'x', opponent: 'my-friend'});
	    });
	});

	it('Emits a valid response to a move request', function (done) {
	    var client3 = io.connect(url, options);

	    client3.once('Move Response', function (data) {
		expect(data.errorReason).to.equal(undefined);
		expect(data.game.x.state).to.equal(1 << 12);
		expect(data.game.turn).to.equal('o');
		done();
	    });
	    
	    client3.once('New Game Response', function (data) {
		var request = {
		    gid: data.gid,
		    player: 'x',
		    piece: 'x2',
		    from: 1 << 25,
		    to: 12
		};
		expect(data.gid).to.be.a('string');
		client3.emit('Move Request', request);
	    });

	    client3.on('connect', function () {
		client3.emit('Hello', {user: 'test user3'});
		client3.emit('Request New Game', 'o');
	    });
	});

	it('Alerts the proper player when turns change', function (done) {
	    var client1 = io.connect(url, options);
	    var client2 = io.connect(url, options);
	    var gid;

	    client1.on('connect', function () {
		client1.emit('Hello', {user: 'client 1'});
	    });

	    client1.on('Hello', function (data) {
		expect(data.user).to.equal('client 1');
		expect(app.connectedUsers['client 1'])
		    .to.equal(data.currentSocket);
	    });

	    // Client2 initiates game and takes first move
	    client2.on('connect', function () {
		client2.emit('Hello', {user: 'client 2'});
		client2.emit('Request New Game', {player:'x',
						  opponent: 'client 1'});
	    });
	    
	    client2.on('New Game Response', function (data) {
		gid = data.gid
		expect(data.error).to.equal(undefined);
		client2.emit('Move Request',
			     {gid: gid,
			      player: 'x',
			      from: 1 << 25,
			      to: 12,
			      piece: 'x0'
			     });
	    });

	    client2.on('Move Response', function (response) {

		setTimeout(function () {
		    expect(false).to.equal('Your Move never fired.');
		    done();
		    }, 500);
	    });

	    // Client1 receives the message
	    client1.on('Your Move', function (response) {
		expect(response.newMove.piece).to.equal('x0');
		expect(response.newMove.to).to.equal(12);
		expect(response.game.gid).to.equal(gid);
		done();
	    });
	});
    });
});

