$(document).ready(function() {
    var scope = {
	gridSide: 100, // 100px to a side
	gridSize: 5, // 5x5 
	currentGame: {
	    gid: null,
	    0: null,
	    1: null,
	    2: null,
	    state: function() {
		if (this[0] && this[1] && this[2]) {
		    return [this[0], this[1], this[2]]
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
	setPieces(scope);
	createDraggables(scope);
    } // `initializeGameBoard()`

    $('#send').click(function() {
	console.log(JSON.stringify(scope.currentGame.pendingMove));
    });
    
}); // document.ready
    
