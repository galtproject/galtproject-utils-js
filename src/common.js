const BN = require("bn.js");
const bs58 = require('bs58');
const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const base32Array = base32.split('');

const GEOHASH_MASK = new BN('0100000000000000000000000000000000000000000000000000000000000000', 16);
const PACK_MASK = new BN('0200000000000000000000000000000000000000000000000000000000000000', 16);

// 12 symbols each of 5 bits length = 60 bits
const limit = new BN('1 152 921 504 606 846 975');

let decodeMap = {};

for (let i = 0; i < base32.length; i++) {
    decodeMap[base32[i]] = i;
}

/**
 * Convert geohash string representation into numeric where each symbol
 * encoded into 5 bits.
 *
 * For ex. 'qwerqwerqwer' will be converted into BN of `824642203853484471`
 *
 * @param {string} input geohash to encode, for ex. 'sezu06`
 * @returns {BN} bignumber for given geohash
 */
function geohashToNumber(input) {
    if (typeof input !== "string") {
        throw new TypeError("Geohash should be a string");
    }

    if (input === "") {
        throw new TypeError("Geohash shouldn't be empty");
    }

    const output = new BN('0');

    for (let i = 0; i < input.length; i++) {
        let v = input[i];
        if (base32Array.indexOf(v) === -1) {
            throw new RangeError(`Character '${v}' no allowed`);
        }

        output.ior(new BN(decodeMap[v]));
        if (i !== input.length - 1) {
            output.ishln(5);
        }
    }

    return output;
}

/**
 * Convert a numerical representation of geohash into a string one.
 *
 * For ex. '824642203853484471' will be converted into `qwerqwerqwer`
 *
 * @param {string} input bignumber as a string
 * @returns {string} geohash
 */
function numberToGeohash(input) {
    const num = new BN(input);
    if (num.gt(limit)) {
        throw new Error("Geohash number is greater than limit");
    }

    const output = [];
    const fiveBits = new BN(31);

    while (!num.isZero()) {
        // get right 5 bytes
        const d = num.and(fiveBits);
        output.push(base32[d]);
        num.ishrn(5);
    }

    output.reverse();
    return output.join('');
}

/**
 * Convert geohash string representation into numeric with toString(10) calling.
 * @param geohash
 * @returns {string}
 */
function geohashToGeohash5(geohash) {
    return geohashToNumber(geohash).toString(10);
}

function geohash5ToTokenId(geohash) {
    return (new BN(geohash.toString(10))).xor(GEOHASH_MASK).toString(10);
}

function geohashToTokenId(geohash) {
    return geohash5ToTokenId(geohashToGeohash5(geohash));
}

function geohashToTokenIdHex(geohash) {
    return tokenIdToHex(geohashToTokenId(geohash));
}

function tokenIdToGeohash5(tokenId) {
    return (new BN(tokenId.toString(10))).xor(GEOHASH_MASK).toString(10);
}

function tokenIdToGeohash(tokenId) {
    return numberToGeohash(tokenIdToGeohash5(tokenId));
}

function tokenIdHexToTokenId(tokenIdHex) {
    return new BN(tokenIdHex.replace("0x", ""), 16).toString(10);
}

function tokenIdHexToGeohash5(tokenIdHex) {
    return tokenIdToGeohash5(tokenIdHexToTokenId(tokenIdHex));
}

function tokenIdHexToGeohash(tokenIdHex) {
    return numberToGeohash(tokenIdHexToGeohash5(tokenIdHex));
}

function tokenIdToHex(tokenId) {
    const geohash16 = (new BN(tokenId)).toString(16);
    let hex;
    if(geohash16.length === 64) {
        hex = geohash16;
    } else {
        hex = "0".repeat(64 - geohash16.length) + geohash16;
    }
    return "0x" + hex;
}

function isPack(tokenId) {
    return (new BN(tokenId.toString(10))).and(PACK_MASK).eq(PACK_MASK);
}

function isGeohash(tokenId) {
    return (new BN(tokenId.toString(10))).and(GEOHASH_MASK).eq(GEOHASH_MASK);
}

// https://ethereum.stackexchange.com/a/39961/20417
function ipfsHashToBytes32(ipfsHash) {
    if (typeof ipfsHash !== "string") {
        throw new TypeError("IPFS hash should be a string");
    }

    if (ipfsHash === "") {
        throw new TypeError("IPFS hash shouldn't be empty");
    }

    if (ipfsHash.length !== 46) {
        throw new TypeError("IPFS hash should have exactly 46 symbols");
    }

    if (!ipfsHash.startsWith("Qm")) {
        throw new TypeError("IPFS hash should start with 'Qm'");
    }

    const bytes = bs58.decode(ipfsHash);
    const hexString = bytes.toString("hex");

    return "0x" + hexString.substr(4);
}

function bytes32ToIpfsHash(bytes32) {
    if (typeof bytes32 !== "string") {
        throw new TypeError("bytes32 should be a string");
    }

    if (bytes32 === "") {
        throw new TypeError("bytes32 shouldn't be empty");
    }

    if (bytes32.length !== 66) {
        throw new TypeError("bytes32 should have exactly 66 symbols (with 0x)");
    }

    if (!(bytes32.startsWith("0x") || bytes32.startsWith("0X"))) {
        throw new TypeError("bytes32 hash should start with '0x'");
    }

    const hexString = "1220" + bytes32.substr(2);
    const bytes = Buffer.from(hexString, 'hex');

    return bs58.encode(bytes);
}

module.exports = {
    geohashToNumber,
    numberToGeohash,
    geohashToGeohash5,
    geohash5ToTokenId,
    geohashToTokenId,
    geohashToTokenIdHex,
    tokenIdToGeohash5,
    tokenIdToGeohash,
    tokenIdHexToGeohash5,
    tokenIdHexToGeohash,
    tokenIdToHex,
    ipfsHashToBytes32,
    bytes32ToIpfsHash,
    isPack,
    isGeohash
};