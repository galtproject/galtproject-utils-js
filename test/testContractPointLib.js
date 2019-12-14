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
const latLonLib = require('../src/latLon');
const geohashExtra = require('../src/geohashExtra');
const geohashContour = require('../src/geohashContour');
const assert = require('assert');
const clone = require('lodash/clone');

describe('contractPoint utils', () => {
  it('should convert latLon to contractPoint and vise versa', function () {
    const latLon = {lat: 10.1112223334, lon: 80.5556667778};
    const height = 11;
    const contractPointResult = contractPoint.encodeFromLatLngHeight(latLon.lat, latLon.lon, height);
    // assert.equal(contractPointResult, '3743106037995514404663181823400999601538');
    const decoded = contractPoint.decodeToLatLonHeight(contractPointResult);
    assert.equal(latLon.lat, decoded.lat);
    assert.equal(latLon.lon, decoded.lon);
    assert.equal(height, decoded.height);

    const utmFromLatLonResult = utmLib.fromLatLon(latLon.lat, latLon.lon);
    const utmFromContractPointResult = contractPoint.decodeToUtm(contractPointResult);
    assert.deepEqual(utmFromLatLonResult, utmFromContractPointResult);

    const contractPointWithoutHeight = contractPoint.encodeFromLatLng(latLon.lat, latLon.lon);
    // assert.equal(contractPointWithoutHeight, '1865191306566061141651549275522');
    const contourPointFromUtmResult = contractPoint.encodeFromUtm(utmFromContractPointResult);
    assert.equal(contourPointFromUtmResult, contractPointWithoutHeight);

    const latLonHeight = contractPoint.decodeToLatLonHeight(contractPointWithoutHeight);
    assert.equal(latLon.lat, latLonHeight.lat);
    assert.equal(latLon.lon, latLonHeight.lon);
    assert.equal(latLonHeight.height, 0);
  });

  it.only('should convert negative latLon to contractPoint and vise versa', function () {
    [{lat: -38.0731887304, lon: 146.1784383491}, {lat: -38.0731887304, lon: -146.1784383491}, {lat: 38.0731887304, lon: -146.1784383491}].forEach(negativeLatLon => {
      const negativeContractPointWithoutHeight = contractPoint.encodeFromLatLng(negativeLatLon.lat, negativeLatLon.lon);

      const negativeLatLonHeight = contractPoint.decodeToLatLonHeight(negativeContractPointWithoutHeight);
      assert.equal(negativeLatLon.lat, negativeLatLonHeight.lat);
      assert.equal(negativeLatLon.lon, negativeLatLonHeight.lon);
      assert.equal(negativeLatLonHeight.height, 0);
    })
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
      console.log('latLonArea', latLonArea);
      // assert.equal(latLonArea, shiftMeters * shiftMeters);

      const contractPointArea = contractPoint.contourArea(latLonPoints.map(l => contractPoint.encodeFromLatLng(l.lat, l.lon)));
      console.log('contractPointArea', contractPointArea);
      // assert.equal(latLonArea, contractPointArea);
    });
  })
});
