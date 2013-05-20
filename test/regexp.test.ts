///<reference path="_ref.ts" />
///<reference path="../src/xm/regexp.ts" />

describe('xm.RexExpGlue', () => {

	var exp:xm.RegExpGlue;
	var e:RegExp;

	it('should be defined', () => {
		expect(xm.RegExpGlue).to.be.ok();
	});
	it('should be a constructor', () => {
		expect(new (xm.RegExpGlue)()).to.be.ok();
	});
	it('should be static accesible', () => {
		expect(xm.RegExpGlue.get()).to.be.ok();
	});
	it('should extract RegExp bodies', () => {
		exp = xm.RegExpGlue.get();
		expect(exp.getBody(/abc/)).to.equal('abc');
		expect(exp.getBody(/defg/)).to.equal('defg');
		expect(exp.getBody(/^line$/)).to.equal('^line$');
		expect(exp.getBody(/x y[\w -]*]+/)).to.equal('x y[\\w -]*]+');
		expect(exp.getBody(/ \d \d /)).to.equal(' \\d \\d ');
	});
	it('should extract RegExp flags', () => {
		exp = xm.RegExpGlue.get();
		expect(exp.getFlags(/defg/i)).to.equal('i');
		expect(exp.getFlags(/abc/)).to.equal('');
		expect(exp.getFlags(/ \d\d/gm )).to.equal('gm');
		expect(exp.getFlags(/xyz/gim)).to.equal('gim');
	});
	it('should clean RegExp flags', () => {
		exp = xm.RegExpGlue.get();
		expect(exp.getCleanFlags('abci')).to.equal('i');
		expect(exp.getCleanFlags('abcgmi')).to.equal('gmi');
		expect(exp.getCleanFlags('gixsm')).to.equal('gim');
		expect(exp.getCleanFlags('gixsmqrst')).to.equal('gim');
	});

	describe('be initialised', () => {
		it('by contructor', () => {
			exp = new (xm.RegExpGlue)();
			expect(exp).to.be.a(xm.RegExpGlue);
			expect(exp.parts).have.length(0);

			exp = new (xm.RegExpGlue)(/alpha/);
			expect(exp.parts).have.length(1);

			exp = new (xm.RegExpGlue)(/alpha/, /bravo/);
			expect(exp.parts).have.length(2);
		});
		it('by RegExpGlue.get()', () => {
			exp = xm.RegExpGlue.get();
			expect(exp).to.be.a(xm.RegExpGlue);
			expect(exp.parts).have.length(0);

			exp = xm.RegExpGlue.get(/alpha/);
			expect(exp.parts).have.length(1);

			exp = xm.RegExpGlue.get(/alpha/, /bravo/);
			expect(exp.parts).have.length(2);
		});
	});

	describe('should append()', () => {
		it('to same instance', () => {
			exp = xm.RegExpGlue.get()
			expect(exp).to.be.ok();
			expect(exp).to.equal(exp.append());
		});
		it('add parts', () => {
			exp = xm.RegExpGlue.get();
			expect(exp.parts).have.length(0);

			exp.append(/alpha/);
			expect(exp.parts).have.length(1);

			exp.append(/bravo/, /charlie/);
			expect(exp.parts).have.length(3);
		});
	});

	describe('should join()', () => {

		beforeEach(() => {
			exp = xm.RegExpGlue.get(/alpha/, /123/, /bravo/i);
		});

		it('into a RegExp', () => {
			e = exp.join();
			expect(e).to.be.a(RegExp);
		});
		it('into a basic glued RegExp', () => {
			e = exp.join();
			expect(''+e).to.equal('/alpha123bravo/');
		});
		it('with flags appended', () => {
			e = exp.join('gm');
			expect(''+e).to.equal('/alpha123bravo/gm');
		});
		it('use seperators to glue', () => {
			e = exp.join('', / +/);
			expect(''+e).to.equal('/alpha +123 +bravo/');
			e = exp.join('gi', / +/);
			expect(''+e).to.equal('/alpha +123 +bravo/gi');
		});
	});
});