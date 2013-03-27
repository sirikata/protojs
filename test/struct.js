var assert = require('assert');

describe('Structures', function () {

	describe('I64', function () {
		it('should toNumber() return right result', function () {
			assert(new I64(0, 0, 1).toNumber(), 0);
			assert(new I64(0, 0, -1).toNumber(), 0);
			assert(new I64(1, 2, 1).toNumber(), 0);
			assert(new I64(100, 2000, 1).toNumber(), 0);
		});

		it('should toString() return right result', function () {
			assert(new I64(0, 0, 1).toString(), '');
			assert(new I64(0, 0, -1).toString(), '');
			assert(new I64(1, 2, 1).toString(), 0);
			assert(new I64(100, 2000, 1).toString(), 0);
		});
	});

});
