///<reference path="_ref.ts" />
///<reference path="../src/xm/regexp.ts" />

declare var assert:chai.Assert;
declare var _:UnderscoreStatic;

describe('chai equality', () => {

	before(()=>{

	});
	describe('assert deepEqual', () => {
		it('bleh', () => {
			assert.deepEqual([1,2,3], [1,2,3], 'yo');
		});
	});
});
