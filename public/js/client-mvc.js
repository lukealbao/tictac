//                          ~ client-mvc.js ~
/*----------------------------------------------------------------------*\
 | This module contains controller and view functions for client-side   |
 | interactions. The are all called by the main `game.js` file.         |
\*----------------------------------------------------------------------*/

          /*--------------------------------------------------*\
           |                                                  |
           |                  ~  Views ~                      |
           |                                                  |
          \*--------------------------------------------------*/

function buildGrid ($env) {
    for (var i = 0; i < $env.gridSize; i++) {
	var y = Math.floor(i / Math.sqrt($env.gridSize))
	    * $env.cellSize,
	    x = (i * $env.cellSize) % (Math.sqrt($env.gridSize)
				       * $env.cellSize);
	$('<div/>').css({width: $env.cellSize - 2,
			 height: $env.cellSize -2,
			 top: y, left: x})
	    .attr({idx: $env.gridSize - 1 - i,
		   class: 'cell'})
	    .prependTo($('#game-board'));
	$env.openCells = $('.cell');
    }
}

// createPiece: Object:$env, Object:options -> DOM Element
/*----------------------------------------------------------------------*\
 |                      Function:createPiece                            |
 |                                                                      |
 | Creates a DOM element that is an instance ofTweenLite::Draggable and |
 | registers it in the $env configuration.                              |
 |                                                                      |
 | The required `options` object has the following keys:                |
 |                                                                      |
 | String: pieceId, the DOM `id` for element. ('player0', 'opponent1')  |
 | Number: x, the x position for TweenLite transform (200, 100)         |
 | Number: y, the y position for TweenLite transform (200, 100)         |
\*----------------------------------------------------------------------*/
function createPiece ($env, options) {
    var offset = $env.cellSize / 2;
    var pieceId = options.pieceId; // player0 || opponent2
    var owner = pieceId.slice(0, -1);
    var coords = cellCoords(options.cell);
    var player = owner === 'player'
	? $env.me() : $env.opponent();
    
    // Create the (invisible) element
    $('<div/>').css({position: 'absolute',
		     'z-index': 1,
		     width: 0,
		     height: 0,
		     top: 0,
		     left: 0})
	.attr({class: owner + '-piece',
	       id: pieceId})
	.prependTo($('#stage'));

    
    // Only .player-pieces need to be draggable
    if (owner === 'player') {
	Draggable.create('#' + pieceId, {
	    bounds:$('#stage'),
	    edgeResistance:0.65,
	    type:'x,y',

	    onPress: function (e) {
		// Prettify
		var elem = this._eventTarget;
		TweenLite.to(elem, 0.5, {scale: 1.05});
	    },
	    onRelease: function (e) {
		// Prettify
		var elem = this._eventTarget;
		TweenLite.to(elem, 0.5, {scale: 1});
	    },
	    onClick: function (e) {
		// Fire request to server
		var move = $env.currentGame.pendingMoves.pop();
		submitMove($env, move[0], move[1]);
	    },
	    onDragStart: function(e) {
		// Undo any unsaved moves
		var unsaved = $env.currentGame.pendingMoves.pop();
		var piece;
		
		if (unsaved && unsaved[0] !== e.target.id) {
		    piece = unsaved[0];
		    console.log('unsaved', unsaved);
		    console.log('index', $env.currentGame[$env.me()][piece]);
		    sendPiece(piece,
			      $env.currentGame[$env.me()][piece]);
		}
	    },
	    onDragEnd: function(e) {
		snapToCell.call(this, $env, this._eventTarget);
	    }
	}); // Draggable.create()
    }

    // Set in place
    TweenLite.to($('#' + pieceId), 0,
		 {x: coords.x + offset,
		  y: coords.y + offset
		 });
    
    // Animate appearance
    TweenLite.to($('#' + pieceId), 1,
		 {x: coords.x,
		  y: coords.y,
		  width: $env.cellSize -1,
		  height: $env.cellSize -1,
		  ease: Elastic.easeOut
		 });

}

// snapToCell: Object:$env, DOM Element, Function -> $env State change
/*----------------------------------------------------------------------*\
  | Called on `.gamePiece.dragEnd`. If called as dragEnd handler, it     |
  | be called with `snapToCell.call` to bind `this`.                     |
  | CSS transform to snap to nearest open `.cell`.                       |
  |                                                                      |
  | The optional third parameter will receive the `registerPiece`        |
  | function. If present, it updates the current game with the piece's   |
  | new state.                                                           |
  \*----------------------------------------------------------------------*/
function snapToCell ($env, elem, next) {
    var cells = $env.openCells,
	i = cells.length,
	pieceId = elem.id,
	targetCell;
    
    while (--i > -1) {
	if (this.hitTest(cells[i], '26%')) {
	    targetCell = cells[i];

	    $env.currentGame.pendingMoves
		.push([
		    pieceId,
		    (targetCell.getAttribute('idx') | 0)
		]);
	    
	    // Snap to grid
	    TweenLite.to(elem, 0.5, {
		x: $(targetCell).css('left'),
		y: $(targetCell).css('top'),
		scale: 1,
		ease: Power2.easeOut
	    }); 
	}
    }
}

function sendPiece (elem, index, offset) {
    offset = offset || 0;
    var cell = $('[idx = ' + index + ']');
    var x = parseInt( cell.css('left') ) + offset;
    var y = parseInt( cell.css('top') ) + offset;
    TweenLite.to($('#' + elem), 1, {x: x, y: y, ease: Power3.easeInOut});
    console.log('SendPiece:',elem, index);
}

function cellCoords(cell) {
    var cell = $('[idx = ' + cell + ']');
    var x = parseInt( cell.css('left') );
    var y = parseInt( cell.css('top') );
    return {x: x, y: y}
}

function submitMove ($env, piece, to) {
    var request = {gid: $env.currentGame.gid,
		   player: $env.currentGame.me,
		   piece: piece,
		   from: $env.currentGame[$env.currentGame.me][piece],
		   to: to
		  };
    
    $env.socket.emit('Move Request', request);
}

