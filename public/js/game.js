$(document).ready(function() {

/*--------------------------------------------------*\
 |   $env Object holds all client-side variables    |
\*--------------------------------------------------*/
    var $env = {
	socket: io(),
	cellSize: 100, // 100px to a side
	gridSize: 25, 
	currentGame: null,
	playerPieceCount: 0,
	opponentPieceCount: 0,
	pendingMoves: [],
	me: undefined,
	opponent: undefined
    }; // $env

/*--------------------------------------------------*\
 |               Set up a new Game                  |
\*--------------------------------------------------*/
    function initializeGameBoard() {
	buildGrid($env);
	var choice = Math.random() > 0.5 ? 'x' : 'o';
	$env.socket.emit('Hello', {user: 'user' + Math.random()});
	$env.socket.emit('Request New Game',{player: choice});
	$env.socket.on('New Game Response', function(response) {
	    console.log('New Game', response);
	    $env.currentGame = response.gid;
	    $env.me = response.player;
	    $env.opponent = $env.me === 'x' ? 'o' : 'x';
	});
/*
	setTimeout(function() {
	    createPiece($env, {pieceId: $env.me + $env.playerPieceCount,
			       cell: 'home-plate'});
	}, 1000); */
    }
    initializeGameBoard();
   

/*--------------------------------------------------*\
 |            Socket.io View Handlers               |
\*--------------------------------------------------*/
    
    $env.socket.on('Move Response', function(data) {
	console.log('move response', data);
	if (data.ok) {
	    $env.playerPieceCount < 3 ? $env.playerPieceCount++ : null;
	}
	for (piece in data.moves) {
	    sendPiece(piece, data.moves[piece]);
	    $('#'+piece).attr('current-idx', data.moves[piece]);
	}
	if (data.winner) alert('You win!!');
    });
    
    $env.socket.on('message', function(data) {
	console.log(data);
    });
    
    $env.socket.on('Your Move', function(data) {

	// Create Player piece if needed
	if ($env.playerPieceCount < 3) {
	    setTimeout(function () {
		createPiece($env, {pieceId: $env.me + $env.playerPieceCount,
				   cell: '33554432'});
	    }, 500);
	}

	// Place new moves on board
	for (piece in data.moves) {

	    // Creating pieces if needed
	    if (piece[0] === $env.opponent
		&& $('#' + piece)[0] === undefined) {
		$env.opponentPieceCount ++;
		createPiece($env, {pieceId: piece, cell: data.moves[piece]});
	    } else {
		sendPiece(piece, data.moves[piece]);
	    }

	    $('#'+piece).attr('current-idx', data.moves[piece]);
	}
	setTimeout( function () {
	    if (data.winner) {alert('You Lose!')};
	}, 750);
    });
        
}); // document.ready
    
