function snapToCell ($env, element) {
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
}
