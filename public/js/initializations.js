/* function buildGrid() -> DOM update
 *
 * Find the `#game-board` div and populate it with `.cell` divs.
 *
 * Requires that `$env` object be in scope.
 */
function buildGrid ($env) {
    for (var i = 0; i < $env.gridSize; i++) {
	var y = Math.floor(i / Math.sqrt($env.gridSize))
	    * $env.cellSize,
	    x = (i * $env.cellSize) % (Math.sqrt($env.gridSize)
				       * $env.cellSize);
	$('<div/>').css({width: $env.cellSize - 1,
			 height: $env.cellSize -1,
			 top: y, left: x})
	    .attr({idx: $env.gridSize - 1 - i,
		   class: 'cell'})
	    .prependTo($('#game-board'));
	$env.cells = $('.cell');
    }
}

/* function pieceFactory(Object:$env) -> Object: factory
 *
 * Return an object with a `next()` method, which creates a `Draggable`
 * instance of a player piece div, inserts it into the DOM, and registers it
 * in the client scope. Receives the session `scope` object as its sole 
 * argument. 
 *
 * The factory should be created once per page load. The `next` method can be 
 * called a maximum of 3 times. 
 */
function pieceFactory ($env) {
    return {
	piecesLeft: 3,
	next: function () { 
	    var currentPieceId;
	    
	    if (!this.piecesLeft) return null;

	    currentPieceId = "player" + --this.piecesLeft;
	    
	    // Create the (invisible) element
	    $('<div/>').css({position: 'absolute',
			     'z-index': 1,
			     width: 0, // Updated below on pop-in
			     height: 0,
			     top: 0,
			     left: 0,
			     transform: 'translate(50px, 560px)'}) // 50px offset for pop-in show() below
		.attr({class: "player-piece",
		       id: currentPieceId})
		.prependTo($('#stage'));


	    // Make it Draggable
	    $env.currentGame[$env.me][currentPieceId].element =
		Draggable.create("#" + currentPieceId, {
		    bounds:$('#stage'),
		    edgeResistance:0.65,
		    type:"x,y",
		    onPress: function (e) {
			// Make it pretty for moving
			var elem = this._eventTarget;
			TweenLite.to(elem, 0.5, {scale: 1.05});
		    },
		    onRelease: function (e) {
			// Make it pretty
			var elem = this._eventTarget;
			TweenLite.to(elem, 0.5, {scale: 1});
		    },
		    onClick: function (e) {
			// Fire request to server
			$env.socket.emit('move',
					 {gid: $env.currentGame.gid,
					  player: $env.me,
					  piece: $env
					  .currentGame
					  .pendingMove.piece,
					  from: $env
					  .currentGame
					  .pendingMove.from,
					  to: $env
					  .currentGame
					  .pendingMove.to
					 });
		    },
		   /* onDragEnd: function (e) {
			// Update model according to `.cell.idx`
			var cells = $env.cells,
			    i = cells.length,
			    elem =  this._eventTarget,
			    pieceId = elem.id,
			    targetCell,
			    _tmp;
			
			while (--i > -1) {
			    if (this.hitTest(cells[i], '26%')) {
				targetCell = cells[i];

				// Update Model as a pending move
				_tmp = $env['currentGame']
			                   [$env.me][pieceId]['idx'];
				$env['currentGame'][$env.me][pieceId]['idx'] = 
				    targetCell.getAttribute('idx') | 0;
				$env.currentGame.pendingMove = {
				    piece: pieceId,
				    from: _tmp,
				    to: $env['currentGame'][$env.me]
				                [pieceId]['idx']
				};

				// Snap to grid
				TweenMax.to(elem, 0.5, {
				    x: $(targetCell).css('left'),
				    y: $(targetCell).css('top'),
				    scale: 1,
				    ease: Power2.easeOut
				}); 
			    }
			}
			} // onDragEnd */

		    onDragEnd: function(e) {
			snapToCell.call(this, $env, this._eventTarget);
		    }
		})[0]; // Draggable.create()

	    // Animate appearance
	    TweenLite.to($('#' + currentPieceId), 1,
			 {x: 0,
			  y: 510,
			  width: $env.cellSize -1,
			  height: $env.cellSize -1,
			  ease: Elastic.easeOut
			 });
	    
	}
    }
}

function snapToCell ($env, elem) {
    var cells = $env.cells,
	i = cells.length,
	pieceId = elem.id,
	targetCell,
	_tmp;
    
    while (--i > -1) {
	if (this.hitTest(cells[i], '26%')) {
	    targetCell = cells[i];

	    // Update Model as a pending move
	    _tmp = $env['currentGame']
	    [$env.me][pieceId];
	    $env['currentGame'][$env.me][pieceId] = 
		targetCell.getAttribute('idx') | 0;
	    $env.currentGame.pendingMove = {
		piece: pieceId,
		from: _tmp,
		to: $env['currentGame'][$env.me]
		[pieceId]
	    };

	    // Snap to grid
	    TweenMax.to(elem, 0.5, {
		x: $(targetCell).css('left'),
		y: $(targetCell).css('top'),
		scale: 1,
		ease: Power2.easeOut
	    }); 
	}
    }
}
