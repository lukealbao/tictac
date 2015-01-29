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
	me: function() { return this.currentGame.me },
	opponent: function () {return this.currentGame.opponent}
    }; // $env

/*--------------------------------------------------*\
 |               Set up a new Game                  |
\*--------------------------------------------------*/
    function initializeGameBoard() {
	buildGrid($env);
	$env.socket.emit('Hello', {user: 'user' + Math.random()});
	$env.socket.emit('Request New Game',{player: 'x'});
	$env.socket.on('New Game Response', function(response) {
	    $env.currentGame = response.game;
	    console.log(response.game);
	});

	setTimeout(function() {
	    createPiece($env, {pieceId: 'player' + $env.piecesOnBoard,
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
	    $env.currentGame[$env.me()]
	    [data.piece.replace('opponent','player')] = data.to;
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
	$env.currentGame[$env.opponent()][data.piece] = data.to;
	if ($env.piecesOnBoard < 3) {
	    setTimeout(function () {
		createPiece($env, {pieceId: 'player' + $env.piecesOnBoard,
				   cell: 'home-plate'});
	    }, 500);
	}

	if ($env.currentGame[$env.opponent()].piecesOnBoard < 3) {
	    $env.currentGame[$env.opponent()].piecesOnBoard ++;
	    createPiece($env, {pieceId: data.piece, cell: data.to});
	} else {
	    sendPiece(data.piece, data.to);
	}

	console.log(data.o);
	console.log('winner:', data.winner || 'None');
    });
        
}); // document.ready
    
