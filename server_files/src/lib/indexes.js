/* Indexes of interest */

/* vectorize: number [, number...] -> number
 * 
 * Build a bitfield out of an array of index numbers.
 * 
 * Example: vectorize(1,3,8) -> 261
 *
 */
function vectorize() {
    var sum = 0,
	indexes = arguments;

    for (var i = 0; i < indexes.length; i++) {
	sum += 1 << indexes[i];
    }
    return sum;
}

// We visualize the field with the origin at bottom right

var rows = {
    1: vectorize(0, 1, 2, 3, 4),
    2: vectorize(5, 6, 7, 8, 9),
    3: vectorize(10, 11, 12, 13, 14),
    4: vectorize(15, 16, 17, 18, 19),
    5: vectorize(20, 21, 22, 23, 24)
};

var columns = {
    a: vectorize(0, 5, 10, 15, 20),
    b: vectorize(1, 6, 11, 16, 21),
    c: vectorize(2, 7, 12, 17, 22),
    d: vectorize(3, 8, 13, 18, 23),
    e: vectorize(4, 9, 14, 19, 24)
};

var diagonals = {
    backSlash: vectorize(6, 12, 18), // Corners are invalid
    fwdSlash: vectorize(16, 12, 8)
};

function values(obj) {
    var keys = Object.keys(obj),
	values = [];
    for (var i = 0, len = keys.length; i < len; i++) {
	values.push(obj[keys[i]]);
    }
    return values;
}
    

// attackVectors can be used as a mask to find winning positions
// or dangerous cells.
var attackVectors = values(rows).concat(values(columns)).concat(values(diagonals));

//usage

function winnningState(n) {
    for (var i = 0; i < attackVectors.length; i++) {
	if ( (attackVectors[i] & n) === n) {
	    return true;
	}
    }
    return false;
}

findMoves("player1").filter(winningState);

// we still need a couple important winning states.
// we also need to fix the problem where a move can be made to the same spot

module.exports = attackVectors;
