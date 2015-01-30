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
	pendingMovs: [],
	me: undefined,
    }; // $env

/*--------------------------------------------------*\
 |               Set up a new Game                  |
\*--------------------------------------------------*/
    function initializeGameBoard() {
	buildGrid($env);
	$env.socket.emit('Hello', {user: 'user' + Math.random()});
	$env.socket.emit('Request New Game',{player: 'x'});
	$env.socket.on('New Game Response', function(response) {
	    $env.currentGame = response.gid;
	});

	setTimeout(function() {
	    createPiece($env, {pieceId: 'x' + $env.playerPieceCount,
			       cell: 'home-plate'});
	}, 1000);
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
	if (data.winning) alert('You win!!');
    });
    
    $env.socket.on('message', function(data) {
	console.log(data);
    });
    
    $env.socket.on('Your Move', function(data) {
	if ($env.playerPieceCount < 3) {
	    setTimeout(function () {
		createPiece($env, {pieceId: 'x' + $env.playerPieceCount,
				   cell: 'home-plate'});
	    }, 500);
	}

	if ($env.opponentPieceCount < 3) {
	    $env.opponentPieceCount ++;
	    createPiece($env, {pieceId: data.piece, cell: data.to});
	} else {
	    sendPiece(data.piece, data.to);
	}
    });
        
}); // document.ready
    
