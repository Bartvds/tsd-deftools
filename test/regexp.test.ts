///<reference path="_ref.ts" />
///<reference path="../src/xm/regexp.ts" />

declare var assert:chai.Assert;

describe('xm.RexExpGlue', () => {

	var exp:xm.RegExpGlue;
	var e:RegExp;

	it('be defined', () => {
		assert.ok(xm.RegExpGlue);
	});
	it('be a constructor', () => {
		assert.ok(new (xm.RegExpGlue)());
	});
	it('be static accesible', () => {
		assert.ok(xm.RegExpGlue.get())
	});
	it('extract RegExp bodies', () => {
		exp = xm.RegExpGlue.get();
		assert.strictEqual(exp.getBody(/abc/), 'abc');
		assert.strictEqual(exp.getBody(/defg/), 'defg');
		assert.strictEqual(exp.getBody(/^line$/), '^line$');
		assert.strictEqual(exp.getBody(/x y[\w -]*]+/), 'x y[\\w -]*]+');
		assert.strictEqual(exp.getBody(/ \d \d /), ' \\d \\d ');
	});
	it('extract RegExp flags', () => {
		exp = xm.RegExpGlue.get();
		assert.strictEqual(exp.getFlags(/defg/i), 'i');
		assert.strictEqual(exp.getFlags(/abc/), '');
		assert.strictEqual(exp.getFlags(/ \d\d/gm), 'gm');
		assert.strictEqual(exp.getFlags(/xyz/gim), 'gim');
	});
	it('clean RegExp flags', () => {
		exp = xm.RegExpGlue.get();
		assert.strictEqual(exp.getCleanFlags('abci'), 'i');
		assert.strictEqual(exp.getCleanFlags('abcgmmmi'), 'gmi');
		assert.strictEqual(exp.getCleanFlags('gixsm'), 'gim');
		assert.strictEqual(exp.getCleanFlags('gixsmqrst'), 'gim');
	});

	describe('be initialised', () => {
		it('by contructor', () => {
			exp = new (xm.RegExpGlue)();
			assert.instanceOf(exp, xm.RegExpGlue);
			assert.lengthOf(exp.parts, 0);

			exp = new (xm.RegExpGlue)(/alpha/);
			assert.lengthOf(exp.parts, 1);

			exp = new (xm.RegExpGlue)(/alpha/, /bravo/);
			assert.lengthOf(exp.parts, 2);
		});
		it('by RegExpGlue.get()', () => {
			exp = xm.RegExpGlue.get();
			assert.instanceOf(exp, xm.RegExpGlue);
			assert.lengthOf(exp.parts, 0);

			exp = xm.RegExpGlue.get(/alpha/);
			assert.lengthOf(exp.parts, 1);

			exp = xm.RegExpGlue.get(/alpha/, /bravo/);
			assert.lengthOf(exp.parts, 2);
		});
	});

	describe('append()', () => {
		it('to same instance', () => {
			exp = xm.RegExpGlue.get()
			assert.ok(exp);
			assert.strictEqual(exp, exp.append());
		});
		it('add parts', () => {
			exp = xm.RegExpGlue.get();
			assert.lengthOf(exp.parts, 0);

			exp.append(/alpha/);
			assert.lengthOf(exp.parts, 1);

			exp.append(/bravo/, /charlie/);
			assert.lengthOf(exp.parts, 3);
		});
	});

	describe('join()', () => {

		beforeEach(() => {
			exp = xm.RegExpGlue.get(/alpha/, /123/, /bravo/i);
		});
		it('into a RegExp', () => {
			e = exp.join();
			assert.instanceOf(e, RegExp);
		});
		it('into a basic glued RegExp', () => {
			e = exp.join();
			assert.strictEqual('' + e, '/alpha123bravo/');
		});
		it('with flags appended', () => {
			e = exp.join('gm');
			assert.strictEqual('' + e, '/alpha123bravo/gm');
		});
		it('use seperators to glue', () => {
			e = exp.join('', / +/);
			assert.strictEqual('' + e, '/alpha +123 +bravo/');
			e = exp.join('gi', / +/);
			assert.strictEqual('' + e, '/alpha +123 +bravo/gi');
		});
		after(() => {
			exp = null;
		});
	});
});