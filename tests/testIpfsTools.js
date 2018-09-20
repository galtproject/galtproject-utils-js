const utils = require('../');
const assert = require('assert');

describe('#ipfsHashToBytes32()', () => {
    it('should convert ipfs hash to its bytes32 representation', function() {
         assert.equal(
             utils.ipfsHashToBytes32('QmNSUYVKDSvPUnRLKmuxk9diJ6yS96r1TrAXzjTiBcCLAL'),
             '0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231');
    });

    it('should throw if ipfs hash is invalid', function() {
        assert.throws(() => utils.ipfsHashToBytes32("QmNSUYVKDSvPUnR"), Error);
    });

    it('should throw if ipfs hash string doesnt start with Qm', function() {
        assert.throws(() => utils.ipfsHashToBytes32("blahblah"), TypeError);
    });

    it('should throw if ipfs hash is not a string', function() {
        assert.throws(() => utils.ipfsHashToBytes32(123), Error);
    });

    it('should throw if ipfs hash string is empty', function() {
        assert.throws(() => utils.ipfsHashToBytes32(""), Error);
    });
});

describe('#bytes32ToIpfsHash()', () => {
    it('should convert bytes32 hash representation to a valid ipfs hash', function() {
        assert.equal(
            utils.bytes32ToIpfsHash('0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231'),
            'QmNSUYVKDSvPUnRLKmuxk9diJ6yS96r1TrAXzjTiBcCLAL');
    });

    it('should throw if bytes32 has an invalid length', function() {
        assert.throws(() => utils.bytes32ToIpfsHash("0x0df2"), Error);
    });

    it('should throw if bytes32 string doesnt start with 0x', function() {
        assert.throws(() => utils.bytes32ToIpfsHash(
            "0f017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231"
        ), TypeError);
    });

    it('should throw if bytes32 is not a string', function() {
        assert.throws(() => utils.bytes32ToIpfsHash(123), Error);
    });

    it('should throw if bytes32 string is empty', function() {
        assert.throws(() => utils.bytes32ToIpfsHash(""), Error);
    });
});
