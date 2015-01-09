var express = require('express');
var router = express.Router();
var app = require('./app');
var winningState = require('./src/lib/indexes').winningState;

function getValidMoves(player) {
    var result = app.findMoves(player);
    return result;
}

function sendState(player, state) {
    var result = app.sendState(player, state);
    return result;
}

router.get('/game', function(req,res) {
    var response = {currentState: app.currentGame.board.state};
    res.json(response);
});

router.get('/play/:player', function(req, res, next) {
    var player = req.params.player,
	validMoves = getValidMoves(player),	
	moveIndex = Math.floor(Math.random() * validMoves.length);

    var result = sendState(player, validMoves[moveIndex]);
    result['winning'] = winningState(result.playerState);
    res.json(result);
    console.log(req);
    next();
});

router.put('/play/:player/:move', function(req, res, next) {
    res.state = sendState(req.params.player, req.params.move);
    res.state.winning = winningState(res.state.playerState);
    console.log(req.body);
    next();
}, function(req, res) {
    res.json(res.state);
});

router.get('/:player', function(req, res, next) {
    res.moves = {moves: getValidMoves(req.params.player)};
    next();
}, function(req, res) {
    res.json(res.moves);
});



/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
