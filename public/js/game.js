$(document).ready(function() {

/*--------------------------------------------------*\
 |   $env Object holds all client-side variables    |
\*--------------------------------------------------*/
    var $env = {
	socket: io(),
	cellSize: 100, // 100px to a side
	gridSize: 25, 
	currentGame: null,
	piecesOnBoard: 0,
	me: function() { return this.currentGame.me }
    }; // $env

/*--------------------------------------------------*\
 |               Set up a new Game                  |
\*--------------------------------------------------*/
    function initializeGameBoard() {
	buildGrid($env);
	$env.socket.emit('request new game');
	$env.socket.on('new game', function(game) {
	    $env.currentGame = game;
	});

	setTimeout(function() {
	    createPiece($env, {pieceId: 'player' + $env.piecesOnBoard,
			       cell: 'home-plate'});
	}, 2500);
    }
    initializeGameBoard();
   

/*--------------------------------------------------*\
 |            Socket.io View Handlers               |
\*--------------------------------------------------*/
    
    $env.socket.on('moveResponse', function(data) {
	if (data.ok) {
	    $env.currentGame = data.game;
	    $env.piecesOnBoard++;
	    console.log('player0', $env.currentGame.x['player0']);
	}
	console.log(data);
	if (data.winning) alert('You win!!');
    });
    
    $env.socket.on('message', function(data) {
	console.log(data);
    });
    
    $env.socket.on('Your Move', function(data) {
	$env.currentGame = data;
	if ($env.piecesOnBoard < 3) {
	    createPiece($env, {pieceId: 'player' + $env.piecesOnBoard,
			       cell: 'home-plate'});
	}
    });
        
}); // document.ready
    
