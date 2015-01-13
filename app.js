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
io.on('connection', function(socket) {
    console.log('User socket: %s connected ', socket.id);
    openSockets[++currentUser] = socket.id;
    socket.uid = currentUser;
    console.log(JSON.stringify(openSockets));
    console.log(JSON.stringify(Object.keys(io.sockets.connected)));
    socket.on('disconnect', function() {
	console.log('User disconnected');
	if (openSockets[socket.uid]) delete openSockets[socket.uid];
    });
    socket.on('move', function(data) {
	console.log('Socket Received!', data);	
	io.sockets.connected[openSockets['2']].emit('message', {sendingSocket: socket.id, sendingUser: socket.uid});
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
console.log(process.env);
