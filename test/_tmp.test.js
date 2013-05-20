var expect = require('expect.js');
process.env['mocha-unfunk-color'] = true;
var xm;
(function (xm) {
    var expTrim = /^\/(.*)\/([a-z]+)*$/gm;
    var flagFilter = /[gim]/;
    var RegExpGlue = (function () {
        function RegExpGlue() {
            var exp = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                exp[_i] = arguments[_i + 0];
            }
            this.parts = [];
            if(exp.length > 0) {
                this.append.apply(this, exp);
            }
        }
        RegExpGlue.get = function get() {
            var exp = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                exp[_i] = arguments[_i + 0];
            }
            var e = new RegExpGlue();
            return e.append.apply(e, exp);
        };
        RegExpGlue.prototype.append = function () {
            var _this = this;
            var exp = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                exp[_i] = arguments[_i + 0];
            }
            exp.forEach(function (value) {
                _this.parts.push('' + value);
            }, this);
            return this;
        };
        RegExpGlue.prototype.getBody = function (exp) {
            expTrim.lastIndex = 0;
            var trim = expTrim.exec('' + exp);
            if(!trim) {
                return '';
            }
            return typeof trim[1] !== 'undefined' ? trim[1] : '';
        };
        RegExpGlue.prototype.getFlags = function (exp) {
            expTrim.lastIndex = 0;
            var trim = expTrim.exec('' + exp);
            if(!trim) {
                return '';
            }
            return typeof trim[2] !== 'undefined' ? this.getCleanFlags(trim[2]) : '';
        };
        RegExpGlue.prototype.getCleanFlags = function (flags) {
            var ret = '';
            for(var i = 0; i < flags.length; i++) {
                var char = flags.charAt(i);
                if(flagFilter.test(char) && ret.indexOf(char) < 0) {
                    ret += char;
                }
            }
            return ret;
        };
        RegExpGlue.prototype.join = function (flags, seperator) {
            var glueBody = seperator ? this.getBody(seperator) : '';
            var chunks = [];
            flags = typeof flags !== 'undefined' ? this.getCleanFlags(flags) : '';
            this.parts.forEach(function (exp, index, arr) {
                expTrim.lastIndex = 0;
                var trim = expTrim.exec('' + exp);
                if(!trim) {
                    return;
                }
                if(trim.length < 2) {
                    console.log(trim);
                    return;
                }
                chunks.push(trim[1]);
            }, this);
            return new RegExp(chunks.join(glueBody), flags);
        };
        return RegExpGlue;
    })();
    xm.RegExpGlue = RegExpGlue;    
})(xm || (xm = {}));
describe('xm.RexExpGlue', function () {
    var exp;
    var e;
    it('should be defined', function () {
        expect(xm.RegExpGlue).to.be.ok();
    });
    it('should be a constructor', function () {
        expect(new (xm.RegExpGlue)()).to.be.ok();
    });
    it('should be static accesible', function () {
        expect(xm.RegExpGlue.get()).to.be.ok();
    });
    it('should extract RegExp bodies', function () {
        exp = xm.RegExpGlue.get();
        expect(exp.getBody(/abc/)).to.equal('abc');
        expect(exp.getBody(/defg/)).to.equal('defg');
        expect(exp.getBody(/^line$/)).to.equal('^line$');
        expect(exp.getBody(/x y[\w -]*]+/)).to.equal('x y[\\w -]*]+');
        expect(exp.getBody(/ \d \d /)).to.equal(' \\d \\d ');
    });
    it('should extract RegExp flags', function () {
        exp = xm.RegExpGlue.get();
        expect(exp.getFlags(/defg/i)).to.equal('i');
        expect(exp.getFlags(/abc/)).to.equal('');
        expect(exp.getFlags(/ \d\d/gm)).to.equal('gm');
        expect(exp.getFlags(/xyz/gim)).to.equal('gim');
    });
    it('should clean RegExp flags', function () {
    });
    describe('be initialised', function () {
        it('by contructor', function () {
            exp = new (xm.RegExpGlue)();
            expect(exp).to.be.a(xm.RegExpGlue);
            expect(exp.parts).have.length(0);
            exp = new (xm.RegExpGlue)(/alpha/);
            expect(exp.parts).have.length(1);
            exp = new (xm.RegExpGlue)(/alpha/, /bravo/);
            expect(exp.parts).have.length(2);
        });
        it('by RegExpGlue.get()', function () {
            exp = xm.RegExpGlue.get();
            expect(exp).to.be.a(xm.RegExpGlue);
            expect(exp.parts).have.length(0);
            exp = xm.RegExpGlue.get(/alpha/);
            expect(exp.parts).have.length(1);
            exp = xm.RegExpGlue.get(/alpha/, /bravo/);
            expect(exp.parts).have.length(2);
        });
    });
    describe('append()', function () {
        it('should return same instance', function () {
            exp = xm.RegExpGlue.get();
            expect(exp).to.be.ok();
            expect(exp).to.equal(exp.append());
        });
        it('should add parts', function () {
            exp = xm.RegExpGlue.get();
            expect(exp.parts).have.length(0);
            exp.append(/alpha/);
            expect(exp.parts).have.length(1);
            exp.append(/bravo/, /charlie/);
            expect(exp.parts).have.length(3);
        });
    });
    describe('should join()', function () {
        beforeEach(function () {
            exp = xm.RegExpGlue.get(/alpha/, /123/, /bravo/i);
        });
        it('into a RegExp', function () {
            e = exp.join();
            expect(e).to.be.a(RegExp);
        });
        it('into a basic glued RegExp', function () {
            e = exp.join();
            expect('' + e).to.equal('/alpha123bravo/');
        });
        it('with flags', function () {
            e = exp.join('gm');
            expect('' + e).to.equal('/alpha123bravo/gm');
        });
        it('use seperators to glued', function () {
            e = exp.join('', / +/);
            expect('' + e).to.equal('/alpha +123 +bravo/');
            e = exp.join('gi', / +/);
            expect('' + e).to.equal('/alpha +123 +bravo/gi');
        });
    });
});
