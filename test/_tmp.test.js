var expect = require('expect.js');
process.env['mocha-unfunk-color'] = true;
describe('RexExpGlue', function () {
    it('ok', function (done) {
        setTimeout(function () {
            expect(true).to.equal(true);
            done();
        }, 10);
    });
    it('', function (done) {
        setTimeout(function () {
            expect(true).to.equal(false);
            done();
        }, 10);
    });
});
