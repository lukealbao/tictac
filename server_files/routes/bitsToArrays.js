
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

