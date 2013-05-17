///<reference path="../src/lib/core.ts" />
///<reference path="_ref.ts" />

console.log('yo!');

var expect = require('expect.js');

describe('kitteh', () => {
	describe('can', () => {
		it('be true', () => {
			expect(true, 'true').to.be(true);
		});
		describe('has', () => {
			it('pass test', () => {
				expect(true, 'valuuue').to.be(true);
			});
			it('fail test', () => {
				expect(false, 'valuuue').to.be(true);
			});
		});
	});
});