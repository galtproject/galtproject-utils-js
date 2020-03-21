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
const GeohashExtra = require('./geohashExtra');
const Coordinates = require('./coordinates');
const LatLon = require('./latLon');
const martinezRueda = require('martinez-polygon-clipping');

const XYZ_MASK =         new BN('00000000000000000000000ffffffffffffffffffffffffffffffffffffffff', 16);
const XY_MASK =          new BN('0000000000000000000000000000000ffffffffffffffffffffffffffffffff', 16);
const HEIGHT_MASK =      new BN('00000000000000000000000ffffffff00000000000000000000000000000000', 16);
const LAT_MASK =         new BN('0000000000000000000000000000000ffffffffffffffff0000000000000000', 16);
const LON_MASK =         new BN('00000000000000000000000000000000000000000000000ffffffffffffffff', 16);

module.exports = class ContractPoint {

  static decodeToLatLonHeight(contractPoint) {
    if(!contractPoint) {
      return null;
    }
    const xyResult = ContractPoint.decodeToXY(contractPoint);
    return {
      height: xyResult.z / 100,
      lat: xyResult.x / 10 ** 10,
      lon: xyResult.y / 10 ** 10
    };
  }

  static decodeToLatLon(contractPoint, arrayMode = false) {
    if(!contractPoint) {
      return null;
    }
    const latLonHeight = ContractPoint.decodeToLatLonHeight(contractPoint);
    if (arrayMode) {
      return [latLonHeight.lat, latLonHeight.lon];
    } else {
      return {lat: latLonHeight.lat, lon: latLonHeight.lon};
    }
  }

  static decodeToXY(contractPoint) {
    if(!contractPoint) {
      return null;
    }
    contractPoint = new BN(contractPoint);

    const z = contractPoint.and(HEIGHT_MASK).shrn(64 * 2);
    const x = contractPoint.and(LAT_MASK).shrn(64);
    const y = contractPoint.and(LON_MASK);

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
    return ContractPoint.encodeFromXY(Math.round(lat * 10 ** 10), Math.round(lon * 10 ** 10), height * 100).toString(10);
  }

  static encodeFromXY(x, y, z = 0) {
    x = web3Abi.decodeParameter('uint256', web3Abi.encodeParameter('int256', x));
    y = web3Abi.decodeParameter('uint256', web3Abi.encodeParameter('int256', y));
    z = web3Abi.decodeParameter('uint256', web3Abi.encodeParameter('int256', z));

    y = (new BN(y));
    x = (new BN(x)).ishln(64);
    z = (new BN(z)).ishln(64 * 2);

    return (y.and(LON_MASK).or(x).and(XY_MASK).or(z)).and(XYZ_MASK);
  }

  static decodeToUtm(contractPoint) {
    if(!contractPoint) {
      return null;
    }
    const latLon = ContractPoint.decodeToLatLon(contractPoint, true);
    return Utm.fromLatLon(latLon[0], latLon[1]);
  }

  static encodeFromUtm(utm) {
    const latLon = Utm.toLatLon(utm);
    return ContractPoint.encodeFromLatLng(latLon.lat, latLon.lon);
  }

  static getAngle (point1, point2, degree = false) {
    const utmPoint1 = this.decodeToUtm(point1);
    const utmPoint2 = this.decodeToUtm(point2);
    return Utm.getAngle(utmPoint1, utmPoint2, degree);
  }

  static contourArea(contour) {
    const area =  Math.abs(Utm.area(contour.map((contractPoint) => {
      const coors = ContractPoint.decodeToLatLon(contractPoint);
      return Utm.fromLatLon(coors.lat, coors.lon);
    })));
    return Math.round(area * 100) / 100;
  }

  static shift(contractPoint, dx, dy, dangle = 0) {
    const latLonHeight = ContractPoint.decodeToLatLonHeight(contractPoint);
    const resultLatLon = LatLon.shift(latLonHeight.lat, latLonHeight.lon, dx, dy, dangle);
    return ContractPoint.encodeFromLatLngHeight(resultLatLon.lat, resultLatLon.lon, latLonHeight.height);
  }

  static shiftContour(contour, dx, dy, dangle = 0) {
    const utmContour = contour.map(cpoint => {
      return ContractPoint.decodeToUtm(cpoint);
    });
    const shiftPolygon = Coordinates.polygonShift(utmContour.map(point => ([point.x, point.y])), dx, dy, dangle);
    return shiftPolygon.map((point, index) => {
      const utmPoint = utmContour[index];
      utmPoint.x = point[0];
      utmPoint.y = point[1];
      return ContractPoint.encodeFromUtm(utmPoint);
    });
  }

  static decodeToGeohash(contractPoint, precision = 12) {
    const latLon = ContractPoint.decodeToLatLon(contractPoint);
    return GeohashExtra.encodeFromLatLng(latLon.lat, latLon.lon, precision);
  }

  static encodeFromGeohash(geohash) {
    const latLon = GeohashExtra.decodeToLatLon(geohash);
    return ContractPoint.encodeFromLatLng(latLon.lat, latLon.lon);
  }

  //TODO: find the better solution do tetect contract point
  static isContractPoint(value) {
    try {
      const bn = (new BN(value.toString(10))).toString(16);
      // console.log('bn', bn, bn.replace(/^f+/g, ''), bn.replace(/^([^0]+0+)/g, ''));
      return bn.length === 26 || bn.replace(/^f+/g, '').length === 26 || bn.replace(/^(.{0,8}0+)/g, '').length === 26;
    } catch (e) {
      return false;
    }
  }

  /**
   * Overlay operations with contours
   * @param redContour
   * @param blueContour
   * @param operation
   * @returns [geohash]
   */
  static overlay(redContour, blueContour, operation) {
    const redPoints = redContour.map((cpoint) => ContractPoint.decodeToLatLon(cpoint, true));
    redPoints.push(redPoints[0]);

    const bluePoints = blueContour.map((cpoint) => ContractPoint.decodeToLatLon(cpoint, true));
    bluePoints.push(bluePoints[0]);

    const overlayResult = martinezRueda[operation]([ redPoints ], [ bluePoints ]);

    let contour = [];
    if(overlayResult && overlayResult[0] && overlayResult[0][0] && overlayResult[0][0].length) {
      contour = overlayResult[0][0].map((point) => ContractPoint.encodeFromLatLng(point[0], point[1]));
    }

    contour.splice(-1, 1);

    return {
      result: overlayResult,
      contour: contour,
      sortedContour: contour
    };
  }

  static intersects(contour1, contour2) {
    const overlayResult = ContractPoint.overlay(contour1, contour2, "intersection").result;
    return !!(overlayResult && overlayResult[0] && overlayResult[0].length === 1);
  }

  static isContractPointInside(cpoint, contour, excludeCollinear = false) {
    const latLon = ContractPoint.decodeToLatLon(cpoint);
    return LatLon.isInside([latLon.lat, latLon.lon], contour.map(c => ContractPoint.decodeToLatLon(c, true)), excludeCollinear);
  }

  static contourInsideAnother(contour1, contour2, excludeCollinear = false) {
    return contour1.filter(c => ContractPoint.isContractPointInside(c, contour2, excludeCollinear)).length === contour1.length;
  }

  static intersectsLines(cpoint1Line1, cpoint2Line1, cpoint1Line2, cpoint2Line2, excludeCollinear = false){
    return LatLon.intersectsLines(
        ContractPoint.decodeToLatLon(cpoint1Line1, true),
        ContractPoint.decodeToLatLon(cpoint2Line1, true),
        ContractPoint.decodeToLatLon(cpoint1Line2, true),
        ContractPoint.decodeToLatLon(cpoint2Line2, true),
        excludeCollinear
    );
  }

  static polygonCenter(contour) {
    const latLonCenter = Coordinates.polygonCenter(contour.map(c => ContractPoint.decodeToLatLon(c, true)));
    return ContractPoint.encodeFromLatLng(latLonCenter[0], latLonCenter[1]);
  }

  static pointOnSegment(point, sp1, sp2) {
    return LatLon.pointOnSegment(
        ContractPoint.decodeToLatLon(point, true),
        ContractPoint.decodeToLatLon(sp1, true),
        ContractPoint.decodeToLatLon(sp2, true)
    )
  }
};
