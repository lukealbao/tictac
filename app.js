'use strict';

/* UTILS */
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');


// App Server
var express = require('express');
var app = express();
var config = require('./app-config');
var http = require('http').Server(app);
var server = http.listen(3030);
var io = require('socket.io')(server);
var debug = require('debug')(app);
app.set('view engine', 'jade');

// Game Controller
var GameController = require('./lib/game-controller');
var dealer = new GameController(0);

// AI Controller
var machine = require('./lib/ai-controller');
var machineSocket;

// Socket.io
app.connectedUsers = {};

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

io.sockets.on('connection', function (socket) {
    
    socket.on('Hello', function (data) {
	app.connectedUsers[data.user] = socket.id;
	socket.pid = data.user;
	socket.emit('Hello', {user: data.user,
			      currentSocket: socket.id});
    });

    socket.on('Request New Game', function (options) {
	var opponent = options.opponent || 'Machine';
	var playerChoice = options.player || 'x';
	var response = {};
	if (!playerChoice) {
	    response.error = 'You must choose a player';
	    socket.emit('New Game Response', response);
	} else {	    
	    var xId = playerChoice === 'x' ? socket.pid : opponent;
	    var oId = playerChoice === 'o' ? socket.pid : opponent;
	    dealer.createGame(socket.id, xId, oId, function (err, res) {
		if (err) {
		    response.error = err;
		    socket.emit('New Game Response', response);
		} else {
		    response.ok = true;
		    response.game = res;
		    response.game.me = playerChoice;
		    socket.emit('New Game Response', response);
		    if (playerChoice === 'o') {
			io.to(app.connectedUsers.Machine)
			    .emit('Your Move', response.game);
		    }		    
		}
	    });
	}
    });

    socket.on('Move Request', function (request) {
	dealer.processMoveRequest(request, function (err, res) {
	    var update;
	    socket.emit('Move Response', err || res);
	    if (!err) {
		update = res.game;
		update.piece = res.piece;
		update.to = res.to;
		io.to(app.connectedUsers[res.nextMove])
		    .emit('Your Move', update);
	    }
	});
    });

    socket.on('disconnect', function () {
	delete app.connectedUsers[socket.pid];
    });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (false) { //if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

console.info('Now listening for connections....')

module.exports = app;
