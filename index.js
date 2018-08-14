const BN = require("bn.js");
const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const base32Array = base32.split('');

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
function geohashToGeohash5(geohash){
    return geohashToNumber(geohash).toString(10);
}

module.exports = {
    geohashToNumber,
    numberToGeohash,
    geohashToGeohash5
};