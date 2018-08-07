const utils = require('../');
const BN = require('bn.js');
const assert = require('assert');

describe('#geohashToNumber()', () => {
    it('should convert geohash string to a numerical representation', function() {
         assert.equal(utils.geohashToNumber("s"), 24);
         assert.equal(utils.geohashToNumber("qwerqwerqwer"), 824642203853484471);
    });

    it('should throw if unsupported symbol received', function() {
        assert.throws(() => utils.geohashToNumber("asdf123"), RangeError);
    });

    it('should throw if geohash string contains more than 12 symbols', function() {
        assert.throws(() => utils.geohashToNumber("thirteensymbo"), RangeError);
    });

    it('should throw if geohash is not a string', function() {
        assert.throws(() => utils.geohashToNumber(123), Error);
    });

    it('should throw if geohash string is empty', function() {
        assert.throws(() => utils.geohashToNumber(""), Error);
    });
});

describe('#numberToGeohash()', () => {
    it('should convert geohash number to a string representation', function() {
        assert.equal(utils.numberToGeohash(24), "s");
    });

    it('should convert geohash bignumber to a string representation', function() {
        assert.equal(utils.numberToGeohash(new BN('824642203853484471')), "qwerqwerqwer");
    });

    it('should convert geohash string to a string representation', function() {
        assert.equal(utils.numberToGeohash('824642203853484471'), "qwerqwerqwer");
    });

    it('should throw if geohash numerical representatino is greater than a limit', function() {
        assert.throws(() => utils.numberToGeohash(new BN('1 152 921 504 606 846 976')), Error);
    });
});
