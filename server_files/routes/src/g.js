/* Wrote functions
 *
 * pad(string) >> string with padded 0s
 * 
 * pretty print >> 5 per line
 * 
 * 1. Generate all states
 * 2. Prune states
 *    a. Corners
 *    b. Multiple edges
 *    c. Multiple wins
 * 3. Validate state
 * 4. Determine winning state
 * 5. Determine trapped state
 */

module.exports = {
    getMoves: getMoves,
    generateStates: generateStates,
    generateGameStates: generateGameStates,
    validGame: validGame,
    countBits: countBits,
    tooManyEdgePoints: tooManyEdgePoints,
    stringifyBitArray: stringifyBitArray,
    prettyPrint: prettyPrint,
    make9Into25: make9Into25,
    generateBoard: generateBoard,
    show: show,
    generateGraph: generateGraph,
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
    
/* prettyPrint: string -> string
 * 
 * Generate a pretty format string from a bit array by inserting newlines
 * at each square row. Used to easily visualize game states from a stringified
 * bit array.
 * 
 * Example: prettyPrint("0110") -> "01\n10"
 */
function prettyPrint(bitArray) {
    var bitArray = stringifyBitArray(bitArray, 25),
	rowLength = Math.sqrt(bitArray.length),
	arr = bitArray.split("");
    
    // Make sure it's square
    if (rowLength % 1 !== 0) {
	throw Error("The length of the input must be a square number.");
    }

    for (i = 0; i < rowLength; i++) {
	arr.splice(i * rowLength + i, 0, "\n");
    }

    return arr.join("");
}

/* make9into25: number, number, number -> number
 * 
 * Take a number that represents a 2d bitfield on a specific square space.
 * Add `n` rows to the field, maintaining a 0-index origin on the shape, 
 * and return the resulting transformed number.
 * 
 * Example: addRows(9) -> 17, as seen here:
 * 
 *         000
 *   10 -> 010
 *   01    001
 *
 * @param {number} input, the bitfield to be transformed
 * @param {number} len, the original length of the field
 * @param {number} n, the number of rows to add
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

function show(n) {
    console.log(prettyPrint(n));
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
function generateGraph(arr) {
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

