//                          ~ bitboard.js ~
/*----------------------------------------------------------------------*\
 |                     Library:Bitboard Functions                       |
 |                                                                      |
 | These functions draw bitboards.                                      |
\*----------------------------------------------------------------------*/

var bits = require('./bits');

module.exports = {
    generateStates: generateStates,
    addTwoRows: addTwoRows,
    translate: translate
};

// generateStates: number, number -> array(number) | n-choose-k-bits
function generateStates(n, k) {
    var results = [0];

    // We check every number that fits within n bits...
    for (var i = 0; i < (1 << n) ; i++) {
	// ... to see how many bits are set
	for (var j=0, c=0; j < n+1 ; j++) {
	    if (i & (1 << j)) {
		c++;
	    }
	}
	if (c === k) {
	    results.push(i);
	}
    }

    return results;
}

// addTwoRows: number -> number | Transform a 3x3 integer into 5x5
function addTwoRows(input) {
    var currentInput = input;
    
    // Helper function called n times
    function addOneRow(input, len, n) {
	var arr = bits.stringifyBitArray(input, len), 
	    oldWidth = Math.sqrt(arr.length),
	    newWidth = oldWidth + n;

	// Change RTL orientation to LTR
	arr = arr.split("").reverse();

	for (var i = 1; i <= newWidth; i++) {
	    arr.splice( (newWidth * i) - 1, 0, "0");
	}
	return parseInt(arr.reverse().join(""), 2);
    }

    // 9 into 16
    currentInput = addOneRow(currentInput, 9, 1);
    //16 into 25
    currentInput = addOneRow(currentInput, 16, 1);

    return currentInput;
}

// translate: number -> array | move a 3x3 board across 5x5
function translate(n) {
    var result = [],
	indexes = [0,1,2,5,6,7,10,11,12];

    for (var i = 0; i < indexes.length; i++) {
	result.push(n << indexes[i]);
    }
    return result;
}

