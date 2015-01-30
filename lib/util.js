//                            ~ util.js ~
/*----------------------------------------------------------------------*\
 |                   General Utility Function Library                   |
\*----------------------------------------------------------------------*/

module.exports = {
    range: range,
    dedupe: dedupe,
    clone: clone
}

function range (start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
	range[idx] = start;
    }

    return range;
}

function dedupe (arr) {
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

function clone (object) {  // Shallow Copy - only one level deep
    var shadow = {};
    for (var key in object) {
	shadow[key] = object[key];
    }
}
