/* function buildGrid() -> DOM update
 *
 * Find the `#game-board` div and populate it with `.cell` divs.
 *
 * Requires that `config` object be in scope.
 */
function buildGrid(config) {
    for (var i = 0; i < 25; i++) {
	var y = Math.floor(i / 5) * config.gridSide,
	    x = (i * config.gridSide) % (config.gridSize
					 * config.gridSide);
	$('<div/>').css({width: config.gridSide - 1,
			 height: config.gridSide -1,
			 top: y, left: x})
	    .attr({idx: 24 - i,
		   class: 'cell'})
	    .prependTo($('#game-board'));
	config.cells = $('.cell');
    }
}

/* function setPieces() -> DOM update
 * 
 * Create `.player-piece` divs with a css:top and css:left set to
 * 0, the origin being the top left of the `#stage` div.
 *
 * The pieces are moved around with css:transform, and the coordinates
 * are snapped to the css:top and css:left of the nearest `.cell`.
*/
function setPieces(config) {
    for (var i = 0; i < 3; i++) {
	$('<div/>').css({position: "absolute",
			 'z-index': 1,
			 width: config.gridSide - 2,
			 height: config.gridSide - 2,
			 top: 0,
			 left: 0,
			 transform: 'translate(0px, 600px)'})
	    .attr({class: "player-piece",
		   id: "player-" + i})
	    .prependTo($('#stage'));
    }
}

/* function createDraggables(config) -> DOM update
 * 
 * Find `.player-piece`s and make them draggable. Takes one parameter,
 * `config`, which is the `scope` object of the current session. 
 */
function createDraggables(config) {
    Draggable.create(".player-piece", {
	bounds:$('#stage'),
	edgeResistance:0.65,
	type:"x,y",
	onPress: function(e) {
	    // Make it pretty for moving
	    var elem = this._eventTarget;
	    TweenLite.to(elem, 0.5, {scale: 1.05});
	},
	onRelease: function(e) {
	    // Make it pretty
	    var elem = this._eventTarget;
	    TweenLite.to(elem, 0.5, {scale: 1});
	},
	onClick: function(e) {
	    // Fire request to server
	    console.log(JSON.stringify(config.currentGame))
	},
	onDragEnd: function(e) {
	    // Update model according to `.cell.idx`
	    var cells = config.cells,
		i = cells.length,
		elem =  this._eventTarget,
		pieceId = elem.id.slice(-1),
		targetCell,
		_tmp;
	    
	    while (--i > -1) {
		if (this.hitTest(cells[i], '26%')) {
		    targetCell = cells[i];
		    
		    // Update Model
		    _tmp = config.currentGame[pieceId];
		    config.currentGame[pieceId] =
			targetCell.getAttribute('idx') | 0;
		    config.currentGame.pendingMove = {
			piece: pieceId,
			from: _tmp,
			to: config.currentGame[pieceId]
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
	
    });
}
