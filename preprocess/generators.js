/* generators.js
 * 
 * This module exports all the generating functions required by the 
 * `stateGenerator.js` module in this same directory. See that file for
 * an explanation of what these are used for.
 */

module.exports = {
    getMoves: getMoves,
    generateStates: generateStates,
    generateGameStates: generateGameStates,
    validGame: validGame,
    countBits: countBits,
    tooManyEdgePoints: tooManyEdgePoints,
    make9Into25: make9Into25,
    generateBoard: generateBoard,
    Graph: Graph,
    translate: translate,
    dedupe: dedupe,
    setFlags: setFlags,
    getFlags: getFlags
};

/* generateStates: number, number -> array
 * 
 * For a bitfield of size n, place all combinations of k bits, and
 * return an array of integers representing each combination.
 * 
 * Example: generateStates(3, 2) -> [3, 9, 12]
 */
function generateStates(n, k) {
    var results = [];
    if (n > 32) {
	throw new Error("n is out of range. 32-bit max.");
    }

    // We'll check every number that fits within n bits...
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

/* validGame: number, number -> boolean
 * 
 * Helper function. Return `true` iff two bitfields have no set bits
 * in common.
 * 
 * Example: validGame(4, 2) -> true
 *          validGame(4, 5) -> false
 */
function validGame(player1, player2) {
    return !(player1 & player2);
}

/* countBits: number -> number
 * 
 * Helper function. Count the number of bits set in a number.
 * 
 * Example: countBits(6) -> 2
 */
function countBits(number) {
    return (number.toString(2).match(/1/g) || []).length;
}

/* generateGameStates: number, number -> array
 * 
 * Generate an exhaustive list of combinatory possible unique game states
 * for a given `boardSize` and `pieceCount` for each player. 
 * 
 * Note that where `generateStates` works on the gameboard level, this
 * deals with a player's individual states. I.e., here we consider filling
 * slots a,b,c to represent two unique possibilities: player 1 filling it, or
 * player 2. `generateStates` instead see it as one single state.
 * 
 * Since this result "belongs" to an individual player, it can be duplicated
 * for each player.
 * 
 * Example: getGameStates(4, 1) -> [3, 5, 9, 6, 10, 14]
 /*/
function generateGameStates(boardSize, pieceCount) {
    var singlePlayer = generateStates(boardSize, pieceCount);
    var results = [];

    for (var i = 0, n = singlePlayer.length; i < n; i++) {
	for ( var j = i+1; j < n; j++) {
	    if (validGame(singlePlayer[i], singlePlayer[j])) {
		results.push(singlePlayer[i] + singlePlayer[j]);
	    }
	}
    }

    return results;
} 

/* tooManyEdgePoints: number -> boolean
 * 
 * Find invalid game states by determining if too many pieces are on an edge.
 * 
 * This function is bound to a square 5x5 board. Note that corner pieces are
 * invalid altogether, and so they count as two spots. 
 * 
 * Example: tooManyEdgePoints(1) -> true // corner slot at index 0
 *          tooManyEdgePoints(64) -> false // 1 piece at valid index 6
 */
function tooManyEdgePoints(n) {
    var curr,
	count = 0,
	edgeCounts = {0: 2, 1: 1, 2: 1, 3: 1,
		      4: 2, 5: 1, 9: 1, 10: 1,
		      14: 1, 15: 1, 19: 1, 20: 2,
		      21: 1, 22: 1, 23: 1, 24: 2},
	edges = Object.keys(edgeCounts);

    for (var i = 0, len = edges.length; i < len; i++) {
	curr = edges[i];
	if (n & (1 << curr)) {
	    count += edgeCounts[curr];
	}
    }
    return count > 1 ? true : false;
}

/* stringifyBitArray: number, number -> string
 * 
 * Take a number `n`, convert it to binary and pad it with zeros so that
 * it is a bit array (string) of exactly `width` characters.
 * 
 * Example: padBitArray(6, 8) -> "00000110"
 */
function stringifyBitArray(n, width) {
    var string = n.toString(2),
	pad = width - string.length;

    for (var i = 0; i < pad; i++) {
	string = "0" + string;
    }
    return string;
}

/* make9into25: number -> number
 * 
 * Take a bitfield built from 9 bits and convert it to 25 bits
 * 
 * Example: make9into25(9) -> 65, as seen here:
 * 
 *         00000
 *  000    00000
 *  010 -> 00000
 *  001    00010
 *         00001
 *
 * @param {number} input, the bitfield to be transformed
 */
function make9Into25(input) {
    var currentInput = input;
    
    // Helper function called n times
    function addOneRow(input, len, n) {
	var arr = stringifyBitArray(input, len), 
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

/* generateBoard: number, string -> array
 * 
 * Actually generate the 5x5 boards based on the number of pieces you
 * want to place. A single player will have 3, and a game will have 6.
 */
function generateBoard(pieces, method) {
    var generateMethod = module.exports[method] || generateStates,
	threeXthree = generateMethod(9, generateMethod != generateStates ? pieces : pieces),
	fiveXfive = [],
	idx = [1,2,5,6,7,10,11,12],
	allTranslations = [],
	trimmed = []; // Remove multiple out-of-bounds moves

    for (var i = 0; i < 84; i++) {
	fiveXfive.push( make9Into25(threeXthree[i]) );
    }

    // Include all available translations on a 5x5 board
    for (var i = 0, l = idx.length; i < l; i++) {
	for (var j = 0, m = fiveXfive.length; j < m; j++) {
	    allTranslations.push(fiveXfive[j] << idx[i]);
	}
    }

    // Trim edges
    for (var i = 0, l = allTranslations.length; i < l; i++) {
	if ( tooManyEdgePoints(allTranslations[i]) == false) {
	    trimmed.push(allTranslations[i]);
	}
    }
    return trimmed;
}

/*
 * Count the number of bits set in an Number
 * 
 * @param Number number
 * @return Number result
*/

function countElements(number) {
    return (number.toString(2).match(/1/g) || []).length;
}

/* validStep: number, number -> boolean
 * 
 * Determine whether two states are exactly one move away from each
 * other.
 * 
 * Example: validStep(5, 6) -> true
 */
function validStep(state1, state2) {
    var inCommon = countElements( state1 & state2),
	elementCount = countElements(state1);
    return Boolean(inCommon === elementCount -1);
}

/* -- THE FOLLOWING NEEDS TO BE MOVED TO GAME METHOD -- */

/* getMoves number, number -> array
 * 
 * For a given player's state & a game state, return a list of valid moves.
 * 
 * Requires that a variable `boardStates` {array} be in scope.
 * 
 * Example: getMoves(448, 14784) -> [194,196,200...]
 */
function getMoves(myState, gameState) {
    var theirState = gameState ^ myState;
    var legalMoves = [];
    var pool = singleGraph[myState];
    for (var i = 0, len = pool.length; i < len; i++) {
	if ( validGame(pool[i], theirState) && boardStates.indexOf(pool[i] | theirState) != -1 ) {
	    legalMoves.push(pool[i]);
	}
    }
    return legalMoves;
}

/* generateGraph: array -> object
 * 
 * Create an adjacency list where the edges are one `validStep` away
 * from the node.
 * 
 * Example: generateGraph([6594, 6596, ...])
 *          -> { 6594: [6596, 6600, ...],
 *               6596: [6594, 6600, ...]
 *             }
 */
function Graph(arr) {
    var graph = {};

    for (var i = 0, len = arr.length; i < len; i++) {
	graph[arr[i]] = [];
	for (var j = 0; j < len; j++) {
	    for (var j = 0; j < len; j++) {
		if (validStep(arr[i], arr[j])) {
		    graph[arr[i]].push(arr[j]);
		}
	    }
	}
    }

    return graph;
}

Graph.prototype.search = function() {
    return 'To be implemented.'
};

/* translate: number-> array(number)
 *
 * Specialized function to translate a 3x3 board to its possible positions
 * on a 5x5 board.
 */
function translate(n) {
    var result = [],
	indexes = [1,2,5,6,7,10,11,12];

    for (var i = 0; i < indexes.length; i++) {
	result.push(n << indexes[i]);
    }
    return result;
}

/* dedupe: array -> array
 * 
 * Dedupe an array and return it.
 */
function dedupe(arr) {
    for (var i = 0, len = arr.length; i < len; i ++) {
	if (arr.indexOf(arr[i], i + 1) !== -1) {
	    arr.splice(i,1,"~~DELETE~~");
	}
    }
    while (arr.indexOf("~~DELETE~~") !== -1) {
	arr.splice(arr.indexOf("~~DELETE~~"), 1);
    }
    return arr;
}

/* setFlags: array -> number
 * 
 * Receive an array of indexes and return a number with those indexes set.
 * 
 * Example: setFlags([1,2,3]) -> 14
 */
function setFlags (arr) {
    var ret = 0;
    arr.forEach(function (idx) {
	ret += 1 << idx;
    });
    return ret;
}

/* getFlags: number -> array
 * 
 * Convert a bit field to an array containing the indexes of set bits.
 * 
 * Example: getFlags(6) -> [1, 2]
 */
function getFlags (int) {
    var ret = [],
	i;
    for (i = 0; i < 31; i++) {
	if (int & 1 << i) {
	    ret.push(i)
	}
    }
    return ret;    
}

