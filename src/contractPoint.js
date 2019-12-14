/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const BN = require("bn.js");
const web3Abi = require('web3-eth-abi');
const Utm = require('./utm');
const LatLon = require('./latLon');

const Z_RESERVED_MASK = new BN('00000000000000000000000ffffffffffffffffffffffffffffffffffffffff', 16);
const Z_HEIGHT_MASK =   new BN('00000000000000000000000ffffffff00000000000000000000000000000000', 16);
const Z_LAT_MASK =      new BN('0000000000000000000000000000000ffffffffffffffff0000000000000000', 16);
const Z_LON_MASK =      new BN('00000000000000000000000000000000000000000000000ffffffffffffffff', 16);

module.exports = class ContractPoint {

  static decodeToLatLonHeight(contractPoint) {
    const xyResult = ContractPoint.decodeToXY(contractPoint);
    return {
      height: xyResult.z,
      lat: xyResult.x / 10 ** 10,
      lon: xyResult.y / 10 ** 10
    };
  }

  static decodeToLatLon(contractPoint, arrayMode = false) {
    const latLonHeight = ContractPoint.decodeToLatLonHeight(contractPoint);
    if (arrayMode) {
      return [latLonHeight.lat, latLonHeight.lon];
    } else {
      return {lat: latLonHeight.lat, lon: latLonHeight.lon};
    }
  }

  static decodeToXY(contractPoint) {
    contractPoint = new BN(contractPoint);

    const z = contractPoint.and(Z_HEIGHT_MASK).shrn(64 * 2);
    const x = contractPoint.and(Z_LAT_MASK).shrn(64);
    const y = contractPoint.and(Z_LON_MASK);

    const encodedHeight = web3Abi.encodeParameter('uint256', z.toString(10));
    const decodedHeight = web3Abi.decodeParameter('int32', encodedHeight);

    const encodedX = web3Abi.encodeParameter('uint256', x.toString(10));
    const decodedX = web3Abi.decodeParameter('int64', encodedX);

    const encodedY = web3Abi.encodeParameter('uint256', y.toString(10));
    const decodedY = web3Abi.decodeParameter('int64', encodedY);

    return { z: parseInt(decodedHeight, 10), x: parseInt(decodedX, 10), y: parseInt(decodedY, 10) };
  }

  static encodeFromLatLng(lat, lon) {
    return ContractPoint.encodeFromLatLngHeight(lat, lon);
  }

  static encodeFromLatLngHeight(lat, lon, height = 0) {
    return ContractPoint.encodeFromXY(Math.round(lat * 10 ** 10), Math.round(lon * 10 ** 10), height).toString(10);
  }

  static encodeFromXY(x, y, z = 0) {
    x = web3Abi.decodeParameter('uint256', web3Abi.encodeParameter('int256', x));
    y = web3Abi.decodeParameter('uint256', web3Abi.encodeParameter('int256', y));
    z = web3Abi.decodeParameter('uint256', web3Abi.encodeParameter('int256', z));

    y = (new BN(y));
    x = (new BN(x)).ishln(64);
    z = (new BN(z)).ishln(64 * 2);

    return (y.or(x).or(z)).and(Z_RESERVED_MASK);
  }

  static decodeToUtm(contractPoint) {
    const latLon = ContractPoint.decodeToLatLon(contractPoint, true);
    return Utm.fromLatLon(latLon[0], latLon[1]);
  }

  static encodeFromUtm(utm) {
    const latLon = Utm.toLatLon(utm);
    return ContractPoint.encodeFromLatLng(latLon.lat, latLon.lon);
  }

  static contourArea(contour) {
    const area =  Math.abs(Utm.area(contour.map((contractPoint) => {
      const coors = ContractPoint.decodeToLatLon(contractPoint);
      return Utm.fromLatLon(coors.lat, coors.lon);
    })));
    return Math.round(area * 100) / 100;
  }

  static shift(contractPoint, dx, dy) {
    const latLonHeight = ContractPoint.decodeToLatLonHeight(contractPoint);
    const resultLatLon = LatLon.shift(latLonHeight.lat, latLonHeight.lon, dx, dy);
    return ContractPoint.encodeFromLatLngHeight(resultLatLon.lat, resultLatLon.lon, latLonHeight.height);
  }
};
