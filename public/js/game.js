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
	var choice = Math.random() > 0.50 ? 'x' : 'o';
	buildGrid($env);
	$env.socket.emit('Hello', {user: 'user' + Math.random()});
	$env.socket.emit('Request New Game',{player: choice});
	$env.socket.on('New Game Response', function(response) {
	    $env.currentGame = response.game;
	    console.log(response.game);
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
    
    $env.socket.on('Move Response', function(data) {
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

	console.log(data.o);
	console.log('winner:', data.winner || 'None');
    });
        
}); // document.ready
    
