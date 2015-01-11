$(document).ready(function() {
    var scope = {
	socket: io(),
	gridSide: 100, // 100px to a side
	gridSize: 5, // 5x5 
	currentGame: {
	    gid: null,
	    player0: {element: null, idx: null},
	    player1: {element: null, idx: null},
	    player2: {element: null, idx: null},
	    state: function() {
		if (this['player0'] && this['player1'] && this['player2']) {
		    return [this['player0'], this['player1'], this['player2']]
			.map(function(idx) {return 1 << idx})
			.reduce(function(a, b) {return a + b})
		}
	    },
	    pendingMove: null
	}
    }; // scope

    initializeGameBoard();    
    function initializeGameBoard() {
	buildGrid(scope);
	scope.createPieces = pieceFactory(scope);
	setTimeout(function(){scope.createPieces.next()}, 1500);

	
    } // `initializeGameBoard()`

    scope.socket.emit('whoami', {user: 1});
    scope.socket.on('moveResponse', function(data) {
	setTimeout(function(){
	    scope.createPieces.next()}, 1500);
	console.log(data);
    });
    scope.socket.on('message', function(data) {console.log(data)});
        
}); // document.ready
    
