'use strict';

/* UTILS */
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');

/* SERVER */
var express = require('express');
var app = express();
var http = require('http').Server(app);
var server = http.listen(3030);
var io = require('socket.io')(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'public')));

var openSockets = {};
var currentUser = 0;

// FEATURE
var validGames = require('./lib/singlePlayer');
var winningGames = require('./lib/winningStates');

io.on('connection', function(socket) {
    console.log('User socket: %s connected ', socket.id);
    openSockets[++currentUser] = socket.id;
    socket.uid = currentUser; // FEATURE
    socket.gameState = 0;
    socket.on('disconnect', function() {
	console.log('User disconnected');
	if (openSockets[socket.uid]) delete openSockets[socket.uid];
    });
    socket.on('move', function(data) {
	
	console.log('Socket Received!', data);
	var response = {};
	var proposedMove = socket.gameState + (1 << data.move.to)
	    - (data.move.from? (1 << data.move.from) : 0);

	console.log('proposed: ', proposedMove);
	console.log('current: ', socket.gameState );
	if (validGames.indexOf(proposedMove) > -1) {
	    socket.gameState = proposedMove;
	    response.acceptedState = socket.gameState;
	} else {
	    response.error = "That is an invalid move."
	};

	if (winningGames.indexOf(proposedMove) > -1) {
	    response.winning = true;
	}
	socket.emit('moveResponse', response);
	
    });  
    socket.write('hello, you are %s connected to %id'.replace('%s', socket.uid)
		 .replace('%id', socket.id));
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
if (app.get('env') === 'development') {
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


module.exports = app;

