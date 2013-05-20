///<reference path="_ref.ts" />

///<reference path=../lib/xm/regexp.ts" />

describe('RexExpGlue', () => {

	it('ok', (done:() => void) => {
		setTimeout(() => {
			expect(true).to.equal(true);
			done();
		}, 10);
	});

	it('', (done:() => void) => {
		setTimeout(() => {
			expect(true).to.equal(false);
			done();
		}, 10);
	});
});