"use strict";

var app = {
    model: require('./models.js'),
    controller: require('./controllers.js'),
    show: require('./g.js').show,
    validGame: require('./g.js').validGame    
};

app.sendMove =  app.controller.sendMove;
app.findMoves = app.controller.findMoves;
app.sendState = app.controller.sendState;
app.currentGame = new app.model.Game(8576, 198656);

module.exports = app;

/*

Ok, how does everything fit together? We run everything as a method of the app object. 

In the larger program, we require app, which is the namespace where all our functions and objects are defined.

*/

