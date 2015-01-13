module.exports = {dedupe: dedupe};
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

