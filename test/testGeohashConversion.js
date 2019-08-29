const utils = require('../src/common');
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

describe('#geohashToGeohash5()', () => {
    it('should convert geohash string to a numerical representation', function() {
        assert.equal(utils.geohashToGeohash5("s"), "24");
        assert.equal(utils.geohashToGeohash5("qwerqwerqwer"), "824642203853484471");
    });

    it('should throw if unsupported symbol received', function() {
        assert.throws(() => utils.geohashToGeohash5("asdf123"), RangeError);
    });

    it('should throw if geohash string contains more than 12 symbols', function() {
        assert.throws(() => utils.geohashToGeohash5("thirteensymbo"), RangeError);
    });

    it('should throw if geohash is not a string', function() {
        assert.throws(() => utils.geohashToGeohash5(123), Error);
    });

    it('should throw if geohash string is empty', function() {
        assert.throws(() => utils.geohashToGeohash5(""), Error);
    });
});

describe('#geohash5ToTokenId()', () => {
    it('should convert geohash number to a tokenId representation', function() {
        assert.equal(utils.geohash5ToTokenId("824642203853484471"), "452312848583266388373324160190187140051835877600158453279955829734764147127");
    });
    it('should convert geohash tokenId to a number representation', function() {
        assert.equal(utils.tokenIdToGeohash5("452312848583266388373324160190187140051835877600158453279955829734764147127"), "824642203853484471");
    });
});

describe('#isGeohash()', () => {
    it('should detect geohash by tokenId', function() {
        assert.equal(utils.isGeohash("452312848583266388373324160190187140051835877600158453279955829734764147127"), true);
    });
});

describe('#isPack()', () => {
    it('should detect pack by tokenId', function() {
        assert.equal(utils.isPack("904625697166532776746648320380374280103671755200316906558262375061821325316"), true);
    });
});

// Example:
// Hex: 0x01000000000000000000000000000000000000000000000000000007044b32c8
// TokenId: 452312848583266388373324160190187140051835877600158453279131187561047470792
// Geohash5: 30136808136
// Geohash: w24qdq8

describe('#tokenIdToHex()', () => {
    it('should convert tokenId to hex', function() {
        assert.equal(utils.tokenIdToHex("452312848583266388373324160190187140051835877600158453279131187561047470792"), '0x01000000000000000000000000000000000000000000000000000007044b32c8');
    });
    it('should convert hex to tokenId', function() {
        assert.equal(utils.tokenIdHexToTokenId("0x01000000000000000000000000000000000000000000000000000007044b32c8"), '452312848583266388373324160190187140051835877600158453279131187561047470792');
    });
});

describe('#geohashToTokenId()', () => {
    it('should convert geohash to tokenId', function() {
        assert.equal(utils.geohashToTokenId("w24qdq8"), '452312848583266388373324160190187140051835877600158453279131187561047470792');
    });
    it('should convert tokenId to geohash', function() {
        assert.equal(utils.tokenIdToGeohash("452312848583266388373324160190187140051835877600158453279131187561047470792"), 'w24qdq8');
    });
});

describe('#geohashToTokenIdHex()', () => {
    it('should convert geohash to tokenIdHex', function() {
        assert.equal(utils.geohashToTokenIdHex("w24qdq8"), '0x01000000000000000000000000000000000000000000000000000007044b32c8');
    });
    it('should convert tokenIdHex to geohash', function() {
        assert.equal(utils.tokenIdHexToGeohash("0x01000000000000000000000000000000000000000000000000000007044b32c8"), 'w24qdq8');
    });
    it('should convert tokenIdHex to geohash5', function() {
        assert.equal(utils.tokenIdHexToGeohash5("0x01000000000000000000000000000000000000000000000000000007044b32c8"), '30136808136');
    });
    it('should convert tokenId to hex', function() {
        assert.equal(utils.tokenIdToHex("452312848583266388373324160190187140051835877600158453279131187561047470792"), '0x01000000000000000000000000000000000000000000000000000007044b32c8');
    });
});


// 0x00004627
const height = 17959;
// 0xfffbb722
const negativeHeight = -280798;
// overflowed height
const overflowedHeight = 2147483648;
// underflowed height
const underflowedHeight = -2147483649;
// u33d9u9n4juh
const geohash5 = '940245506947434320';
const positiveGeohash5z = new BN('0000000000000000000000000000000000004627000000000d0c6c4e93424750', 16);
const negativeGeohash5z = new BN('00000000000000000000000000000000fffbb722000000000d0c6c4e93424750', 16);

describe('#geohash5ToGeohash5z()', () => {
    it('should encode positive height into geohash5', function() {
        const res = utils.geohash5ToGeohash5z(height, geohash5);
        assert.equal(res.toString(10), positiveGeohash5z.toString(10));
    });

    it('should encode negative height into geohash5', function() {
        const res = utils.geohash5ToGeohash5z(negativeHeight, geohash5);
        assert.equal(res.toString(10), negativeGeohash5z.toString(10));
    });

    it('throws on overflowed height encoded', function() {
        assert.throws(() => {
            utils.geohash5ToGeohash5z(overflowedHeight, geohash5)
        }, RangeError('Height overflow'));
    });

    it('throws on overflowed height encoded', function() {
        assert.throws(() => {
            utils.geohash5ToGeohash5z(underflowedHeight, geohash5)
        }, RangeError('Height overflow'));
    });
});

describe('#geohash5zToGeohash5()', () => {
    it('should decode positive height and geohash5', async function() {
        const res = utils.geohash5zToGeohash5(positiveGeohash5z);

        assert.equal(res.height, height);
        assert.equal(res.geohash5, geohash5);
    });

    it('should decode negative height and geohash5', async function() {
        const res = utils.geohash5zToGeohash5(negativeGeohash5z);

        assert.equal(res.height, negativeHeight);
        assert.equal(res.geohash5, geohash5);
    });
});
