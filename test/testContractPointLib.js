/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const contractPoint = require('../src/contractPoint');
const utmLib = require('../src/utm');
const commonLib = require('../src/common');
const latLonLib = require('../src/latLon');
const geohashExtra = require('../src/geohashExtra');
const assert = require('assert');

describe('contractPoint utils', () => {
  it('should convert latLon to contractPoint and vise versa', function () {
    const latLon = {lat: 10.1112223334, lon: 80.5556667778};
    const height = 11;
    const contractPointResult = contractPoint.encodeFromLatLngHeight(latLon.lat, latLon.lon, height);
    assert.equal(contractPointResult, '3743106037995514404663181823400999601538');
    assert.equal(contractPoint.isContractPoint(contractPointResult), true);
    const decoded = contractPoint.decodeToLatLonHeight(contractPointResult);
    assert.equal(latLon.lat, decoded.lat);
    assert.equal(latLon.lon, decoded.lon);
    assert.equal(height, decoded.height);

    const geohashFromContractPoint = contractPoint.decodeToGeohash(contractPointResult, 12);
    const geohashFromLatLon = geohashExtra.encodeFromLatLng(latLon.lat, latLon.lon, 12);
    assert.equal(geohashFromContractPoint, geohashFromLatLon);

    const contractPointFromGeohash = contractPoint.encodeFromGeohash(geohashFromContractPoint);
    const latLonFromGeohash = contractPoint.decodeToLatLon(contractPointFromGeohash);

    assert.equal(Math.round(latLonFromGeohash.lat * 10 ** 6) / 10 ** 6, Math.round(latLon.lat * 10 ** 6) / 10 ** 6);
    assert.equal(Math.round(latLonFromGeohash.lon * 10 ** 6) / 10 ** 6, Math.round(latLon.lon * 10 ** 6) / 10 ** 6);

    const utmFromLatLonResult = utmLib.fromLatLon(latLon.lat, latLon.lon);
    const utmFromContractPointResult = contractPoint.decodeToUtm(contractPointResult);
    assert.deepEqual(utmFromLatLonResult, utmFromContractPointResult);
    assert.equal(contractPoint.isContractPoint(utmFromContractPointResult), false);

    const contractPointWithoutHeight = contractPoint.encodeFromLatLng(latLon.lat, latLon.lon);
    assert.equal(contractPointWithoutHeight, '1865191306566061141651549275522');
    assert.equal(contractPoint.isContractPoint(contractPointWithoutHeight), true);
    const contourPointFromUtmResult = contractPoint.encodeFromUtm(utmFromContractPointResult);
    assert.equal(contourPointFromUtmResult, contractPointWithoutHeight);

    const latLonHeight = contractPoint.decodeToLatLonHeight(contractPointWithoutHeight);
    assert.equal(latLon.lat, latLonHeight.lat);
    assert.equal(latLon.lon, latLonHeight.lon);
    assert.equal(latLonHeight.height, 0);
  });

  it('should convert negative latLon to contractPoint and vise versa', function () {
    [{lat: -38.0731887304, lon: 146.1784383491}, {lat: -38.0731887304, lon: -146.1784383491}, {lat: 38.0731887304, lon: -146.1784383491}].forEach(negativeLatLon => {
      const negativeContractPointWithoutHeight = contractPoint.encodeFromLatLng(negativeLatLon.lat, negativeLatLon.lon);

      assert.equal(contractPoint.isContractPoint(negativeContractPointWithoutHeight), true);

      const negativeLatLonHeight = contractPoint.decodeToLatLonHeight(negativeContractPointWithoutHeight);
      assert.equal(negativeLatLon.lat, negativeLatLonHeight.lat);
      assert.equal(negativeLatLon.lon, negativeLatLonHeight.lon);
      assert.equal(negativeLatLonHeight.height, 0);
    })
  });

  it('should shift correctly', function () {
    const baseContractPoint = '340282359897729907752972374757912920387';

    [{dx: 5, dy: 0}, {dx: 0, dy: 5}, {dx: 5, dy: 5}, {dx: -5, dy: 0}, {dx: 0, dy: -5}, {dx: -5, dy: -5}, {dx: 5, dy: -5}, {dx: -5, dy: 5}].forEach((shiftMeters) => {
      const resultContractPoint = contractPoint.shift(baseContractPoint, shiftMeters.dx, shiftMeters.dy);

      assert.equal(contractPoint.isContractPoint(resultContractPoint), true);

      const basePointUtm = contractPoint.decodeToUtm(baseContractPoint);
      const resultPointUtm = contractPoint.decodeToUtm(resultContractPoint);
      assert.equal(roundToDecimal(basePointUtm.x + shiftMeters.dx), roundToDecimal(resultPointUtm.x));
      assert.equal(roundToDecimal(basePointUtm.y + shiftMeters.dy), roundToDecimal(resultPointUtm.y));
    });

    function roundToDecimal(value, decimal = 4) {
      return Math.round(value * 10 ** decimal) / 10 ** decimal;
    }
  });

  it('should calculate area correctly', function () {
    const basePointLatLon = {lat: 50.111222333444, lon: 80.555666777888};

    [5, 50, 500].forEach((shiftMeters) => {
      const firstPoint = basePointLatLon;
      const secondPoint = latLonLib.shift(basePointLatLon.lat, basePointLatLon.lon, shiftMeters, 0);
      const thirdPoint = latLonLib.shift(basePointLatLon.lat, basePointLatLon.lon, 0, shiftMeters);
      const fourthPoint = latLonLib.shift(basePointLatLon.lat, basePointLatLon.lon, shiftMeters * -1, 0);

      const latLonPoints = [firstPoint, secondPoint, thirdPoint, fourthPoint];
      const latLonArea = Math.abs(latLonLib.area(latLonPoints));
      assert.equal(latLonArea, shiftMeters * shiftMeters);

      const contractPointArea = contractPoint.contourArea(latLonPoints.map(l => contractPoint.encodeFromLatLng(l.lat, l.lon)));
      assert.equal(latLonArea, contractPointArea);
    });
  });

  it('should check isContractPoint correctly', function () {
    ['dr72j3f7enwc'].forEach(geohash => {
      const geohash5 = commonLib.geohashToGeohash5(geohash);
      const geohash5z = commonLib.geohash5ToGeohash5z('0', geohash5);
      assert.equal(contractPoint.isContractPoint(geohash5z), false);
    })
  })
});
