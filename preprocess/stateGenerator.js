/* stateGenerator.js
 *
 * Here we are able to generate all the pertinent states needed for 
 * the game. A state is the numerical representation of `n` pieces
 * on a 5x5 board, and it is determined by setting the bit that 
 * corresponds with the cell on the board. E.g., a state where only 
 * one piece is on the board in the bottom right corner would be 
 * represented by setting the first bit in the number, resulting in
 * a state of `1`. (For other reasons, the corner cells are off limits, 
 * and this is an impossible state.) 
 * 
 * The states we generate are in two categories, `singlePlayer` and 
 * `gameState`. For the former, we must generate the states for 1 - 3 bits,
 * and for the latter, we must generate the states for 1 - 6 bits.
 * 
 * For ease of creation, we will actually first generate a state on a 3x3
 * board (since a legal game state will only be on a 3x3 board), and then
 * we translate that state to all the available positions on the 5x5 board.
 *
 * Note that we must dedupe the results.
 *
 * This file can be `require`d by another module, or, it can be called from
 * the CLI with the `-w` argument, which will result in writing the exported
 * objects to json files in the `../lib` folder.
 */

var fs = require('fs');
var path = require('path');
var WRITE_MODE = process.argv[2] === '-w';
var generatorFunctions = require('./generators');

// Put all generator functions in global scope
for (var func in generatorFunctions) {
    global[func] = generatorFunctions[func];
}



/*-----------------------------------*\
 |        Array: Game States         |
 |         - singlePlayer.json       |
 |         - fullGame.json           |
\*-----------------------------------*/

var singlePlayerStates = {};
var gameStates = {};

for (var i = 1; i <= 6; i++ ) {

    var current = generateStates(9, i) // n choose k bits on 3x3 board
	.map(make9Into25) // redraw on 5x5 board
	.map(translate) // translate 3x3 across 5x5
	.reduce(function(a, b) {return a.concat(b)}) 
	.filter(function(state) {
	    return !tooManyEdgePoints(state) // remove illegal states
	});
    
    // Dedupe it, add it to gameStates
    gameStates[i + '-pc'] = dedupe(current);

    // And singlePlayer if under 3 pcs
    if (i <=3) {
	singlePlayerStates[i + '-pc'] = dedupe(current);
    }
}

/* For flexibility, we will temporarily keep the objects as-is, and
 * create a concatenated array for each object. This may turn out to be
 * the only one needed.
 */

gameStates.all = [];
singlePlayerStates.all = [];
for (var i = 1; i <= 6; i++) {
    gameStates['all'] = gameStates['all'].concat(gameStates[i + '-pc']);
    if (i <= 3) {
	singlePlayerStates['all'] = singlePlayerStates['all']
	    .concat(singlePlayerStates[i + '-pc']);
    }
}


/*-----------------------------------*\
 |        Graph: moveGraph           |
 |          - moveGraph.json         |
\*-----------------------------------*/




/*-----------------------------------*\
 |      Interesting Indexes          |
 |        - winningStates.json       |
 |        - edges.json               |
 |        - attacking.json           |
\*-----------------------------------*/

var winningStates = [],
    winningIndexes = [
	[0,1,2], [3,4,5], [6,7,8],
	[0,3,6], [1,4,7], [2,5,8],
	[0,4,8], [2,4,6]
    ];

for (var i = 0; i < winningIndexes.length; i++) {
    var curr = winningIndexes[i]
	.map(function(idx) {
	    return 1 << idx;
	})
	.reduce(function(a, b) {
	    return a | b;
	});

    winningStates.push(curr);
}

winningStates = winningStates.map(make9Into25)
    .map(translate)
    .reduce(function(a, b) {return a.concat(b)});


var edges = {},
    edgeIndexes = [
	[0,1,2,3,4],    [20,21,22,23,24],
	[0,5,10,15,20], [4,9,14,19,24]
    ];

edges.bottom = setFlags(edgeIndexes[0]);
edges.top    = setFlags(edgeIndexes[1]);
edges.left   = setFlags(edgeIndexes[2]);
edges.right  = setFlags(edgeIndexes[3]);

/*-----------------------------------*\
 |      Pass this file along to      |
 |         those who want it         | \*-----------------------------------*/

if (WRITE_MODE) {
    fs.mkdirSync(path.join(process.env.PWD, '../lib'));
    var single = fs.createWriteStream('../lib/singlePlayer.json');
    var fullGame = fs.createWriteStream('../lib/fullGame.json');
    var winningStatesFile = fs.createWriteStream('../lib/winningStates.json');
    var edgesFile = fs.createWriteStream('../lib/edges.json');

    single.write(JSON.stringify(singlePlayerStates.all, null, 2));
    fullGame.write(JSON.stringify(gameStates.all));
    winningStatesFile.write(JSON.stringify(winningStates));
    edgesFile.write(JSON.stringify(edges));
    
    single.close();
    fullGame.close();
    winningStatesFile.close();
    edgesFile.close();
}

module.exports = {
    singlePlayer: singlePlayerStates.all,
    fullGame: gameStates.all,
    winningStates: winningStates,
    edges: edges
};
