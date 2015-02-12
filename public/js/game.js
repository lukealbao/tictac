$(document).ready(function() {

    if (!localStorage.getItem('suppressInstructions')) {
        $('#gutter').load('modal.html', function () {
            TweenLite.to($('#instructions-2'), 0, {left: '-50%'});
            TweenLite.from($('#instructions-1'), 0.5, {left: '-50%', ease: 'easeInOut'});
            });
    } else {
        initializeGameBoard();
    }
});

/*--------------------------------------------------*\
  |   $env Object holds all client-side variables    |
  \*--------------------------------------------------*/
var $env = {
    socket: io({'force new connection': true}),
    cellSize: 100, // 100px to a side
    gridSize: 25, 
    currentGame: null,
    playerPieceCount: 0,
    opponentPieceCount: 0,
    pendingMoves: [],
    randomId: (Math.random() * 10e6 | 0).toString(16),
    userSocketId: undefined,
    machineSocketId: undefined,
    me: undefined,
    opponent: undefined,
    rules: {'recenter': 'not seen',
            'boundaries' : 'not seen',
            'moving twice': 'not seen',
            'tap to accept': 'not seen'
           }
}; // $env

console.log('$env', $env.socket);
/*--------------------------------------------------*\
  |               Set up a new Game                  |
  \*--------------------------------------------------*/
function initializeGameBoard() {

    if ($('#suppress-instructions').prop('checked')) {
        localStorage.setItem('suppressInstructions', true);
    }


    TweenLite.to('.modal', 0.75, {left: '200%', delay: 0.5,
                                onComplete: function() {$('.modal').remove()}
                               });
    buildGrid($env);
    $env.socket.emit('Hello', {user: 'user' + $env.randomId});
    $env.socket.on('Hello', function(response) {
        $env.userSocketId = response.currentSocket;
    });

    newGame(true);

    $env.socket.on('New Game Response', function(response) {
	console.log('New Game', response);
	$env.currentGame = response.gid;
	$env.me = response.player;
        $env.playerPieceCount = $env.opponentPieceCount = 0;
	$env.opponent = $env.me === 'x' ? 'o' : 'x';
    });
}

/*--------------------------------------------------*\
  |            Socket.io View Handlers               |
  \*--------------------------------------------------*/

$env.socket.on('Move Response', function(data) {
    console.log('You moved.',data);// data.newMove, data.request.to);
    if (data.ok) {
	$env.playerPieceCount < 3 ? $env.playerPieceCount++ : null;
    }
    for (piece in data.corrections) {
	$('#'+piece).attr('current-idx', data.corrections[piece]);
        sendPiece(piece, data.corrections[piece]);
    }
    if (data.winner) alert('You win!!');

    /////  Messaging  /////

    // Out of Bounds error
    if (data.errorReason === 'That move is out of bounds'
      && $env.rules.boundaries !== 'seen') {
        flashMessage('You must stay in 3x3. Try again.');
        $env.rules.boundaries = 'seen';
    }

    // Recenter rule
    if (Object.keys(data.corrections).length > 0
      && $env.rules.recenter !== 'seen') {
        flashMessage('The board is automatically recentered.', 1500);
        $env.rules.recenter = 'seen';
    }
});

$env.socket.on('Your Move', function(data) {

    console.log('Machine moved.', data);//data.newMove, data.request.to);
    console.log('\n');

    // Create Player piece if needed
    if ($env.playerPieceCount < 3) {
	setTimeout(function () {
	    createPiece($env, {pieceId: $env.me + $env.playerPieceCount,
			       cell: '33554432'});
	}, 2500);

    }

    // The new move
    setTimeout(function () {
        if (data.newMove.piece[0] === $env.opponent
          && $('#' + data.newMove.piece).length === 0) {
            $env.opponentPieceCount ++;
            createPiece($env, {pieceId: data.newMove.piece,
                               cell: data.newMove.to});
        } else {
	    sendPiece(data.newMove.piece, data.newMove.to);
	}
    }, 500);

    // Corrections and reorientations
    setTimeout(function () {
	for (piece in data.corrections) {
	    $('#'+piece).attr('current-idx', data.corrections[piece]);
            sendPiece(piece, data.corrections[piece]);
	}
    }, 2000);

    setTimeout( function () {
	if (data.winner) {alert('You Lose!')};
    }, 750);

    /////  Messaging  /////

    // First move
    if ($env.playerPieceCount < 1) {
        flashMessage('Place a piece on the board', 3000);
    }

    // Recenter rule
    if (Object.keys(data.corrections).length > 0
      && $env.rules.recenter !== 'seen') {
        flashMessage('The board is automatically recentered.', 1500);
        $env.rules.recenter = 'seen';
    }
});

function loadRules () {
    var tl = new TimelineLite();
    tl.to($('#instructions-1'), 0.75, {left: '200%', delay: 0.5});
    tl.to($('#instructions-2'), 0.75, {left: '50%'});
}

function newGame (initialPageLoad) {
    var choice = Math.random() > 0.5 ? 'x' : 'o';
    if (!initialPageLoad) {
        TweenMax.staggerTo($('.player-piece, .opponent-piece'),
                           1,
                           {
                               y: '1000px',
                               ease: Power1.easeIn
                           },
                           0.1,
                           function () {
                               $('.player-piece, .opponent-piece').remove();
                               $env.socket.emit('Request New Game',{player: choice,
                                                                    opponent: 'Machine' + $env.randomId});
                            }
                          );

    } else {
        $env.socket.emit('Request New Game',{player: choice,
                                             opponent: 'Machine' + $env.randomId});
    }

}
                     
                                          
