///<reference path="_ref.ts" />
///<reference path="../src/xm/regexp.ts" />

declare var assert:chai.Assert;
declare var _:UnderscoreStatic;

describe('quick tests', () => {

	before(()=> {

	});

	it('wait a bit', (done:() => void) => {
		setTimeout(()=> {
			assert.ok(1);
			done();
		}, 50);
	});

	describe('assert deepEqual', () => {
		it('yo?', () => {
			assert.deepEqual([1, 2, 3], [1, 2, 3], 'yo!');
		});
	});
});