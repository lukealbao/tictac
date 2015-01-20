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
    translate: translate,
    tooManyEdgePoints: tooManyEdgePoints
};

function generateStates(n, k) {
    var results = [];

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

function translate(n) {
    var result = [],
	indexes = [1,2,5,6,7,10,11,12];

    for (var i = 0; i < indexes.length; i++) {
	result.push(n << indexes[i]);
    }
    return result;
}

function tooManyEdgePoints(n) {
    var curr,
	count = 0,
	edgeCounts = {0: 1, 1: 1, 2: 1, 3: 1,
		      4: 1, 5: 1, 9: 1, 10: 1,
		      14: 1, 15: 1, 19: 1, 20: 1,
		      21: 1, 22: 1, 23: 1, 24: 1},
	edges = Object.keys(edgeCounts);

    for (var i = 0, len = edges.length; i < len; i++) {
	curr = edges[i];
	if (n & (1 << curr)) {
	    count += edgeCounts[curr];
	}
    }
    return count > 1 ? true : false;
}
