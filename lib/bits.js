//                            ~ bits.js ~
/*----------------------------------------------------------------------*\
 | Helper function for bitwise operations.                              |
\*----------------------------------------------------------------------*/

module.exports = {
    getFlags: getFlags,
    setFlags: setFlags,
    countFlags: countFlags,
    stringifyBitArray: stringifyBitArray,
    oneStepAway: oneStepAway
};

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

function setFlags (arr) {
    var ret = 0;
    arr.forEach(function (idx) {
	ret += 1 << idx;
    });
    return ret;
}

function countFlags (int) {
    return (int.toString(2).match(/1/g) || []).length;
}

function stringifyBitArray (n, width) {
    var string = n.toString(2),
	pad = width - string.length;

    for (var i = 0; i < pad; i++) {
	string = "0" + string;
    }
    return string;
}

function oneStepAway (state1, state2) {
    var commonCount = countFlags(state1 & state2),
	state1Count = countFlags(state1),
	state2Count = countFlags(state2);
    
    if (state1Count < state2Count) {
	return Boolean(state1 === (state1 & state2)
		       && state2Count - state1Count === 1);
    } else if (state1Count === state2Count) {
	return Boolean(commonCount === state1Count - 1);
    } else {
	return false;
    }
}

