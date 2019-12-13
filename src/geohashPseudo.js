/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const BN = require("bn.js");
const bs58 = require('bs58');
const web3Abi = require('web3-eth-abi');
const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const base32Array = base32.split('');


const Z_RESERVED_MASK = new BN('00000000000000000000000ffffffffffffffffffffffffffffffffffffffff', 16);
const Z_HEIGHT_MASK =   new BN('00000000000000000000000ffffffff00000000000000000000000000000000', 16);
const Z_LAT_MASK =      new BN('0000000000000000000000000000000ffffffffffffffff0000000000000000', 16);
const Z_LON_MASK =      new BN('00000000000000000000000000000000000000000000000ffffffffffffffff', 16);

module.exports = class GeohashPseudo {
  static decodeToLatLon(pseudoGeohash) {
    pseudoGeohash = new BN(pseudoGeohash);

    const height = pseudoGeohash.and(Z_HEIGHT_MASK).shrn(64 * 2);
    const lat = pseudoGeohash.and(Z_LAT_MASK).shrn(64);
    const lon = pseudoGeohash.and(Z_LON_MASK);

    const encodedHeight = web3Abi.encodeParameter('uint256', height.toString(10));
    const decodedHeight = web3Abi.decodeParameter('int32', encodedHeight);

    const encodedLat = web3Abi.encodeParameter('uint256', lat.toString(10));
    const decodedLat = web3Abi.decodeParameter('int64', encodedLat);

    const encodedLon = web3Abi.encodeParameter('uint256', lon.toString(10));
    const decodedLon = web3Abi.decodeParameter('int64', encodedLon);

    return { height: parseInt(decodedHeight, 10), lat: parseInt(decodedLat, 10), lon: parseInt(decodedLon, 10) };
  }

  // 0xReserved....Height........lat..................lon..................
  static encodeFromLatLng(lat, lon, height = 0) {
    lat = web3Abi.decodeParameter('uint256', web3Abi.encodeParameter('int256', lat));
    lon = web3Abi.decodeParameter('uint256', web3Abi.encodeParameter('int256', lon));

    lon = (new BN(lon));
    lat = (new BN(lat)).ishln(64);
    height = (new BN(height)).ishln(64 * 2);

    return (lon.or(lat).or(height)).and(Z_RESERVED_MASK);
  }
};
