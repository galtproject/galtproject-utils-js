/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const contractPoint = require('../src/contractPoint');
const utm = require('../src/utm');
const geohashExtra = require('../src/geohashExtra');
const geohashContour = require('../src/geohashContour');
const assert = require('assert');
const clone = require('lodash/clone');

describe('contractPoint utils', () => {
  it('should convert latLon to contractPoint and vise versa', function () {
    const latLon = {lat: 10.1112223334, lon: 80.5556667778};
    const height = 11;
    const contractPointResult = contractPoint.encodeFromLatLngHeight(latLon.lat, latLon.lon, height);
    assert.equal(contractPointResult, '3743106037995514404663181823400999601538');
    const decoded = contractPoint.decodeToLatLonHeight(contractPointResult);
    assert.equal(latLon.lat, decoded.lat);
    assert.equal(latLon.lon, decoded.lon);
    assert.equal(height, decoded.height);

    const utmFromLatLonResult = utm.fromLatLon(latLon.lat, latLon.lon);
    const utmFromContractPointResult = contractPoint.decodeToUtm(contractPointResult);
    assert.deepEqual(utmFromLatLonResult, utmFromContractPointResult);

    const contractPointWithoutHeight = contractPoint.encodeFromLatLng(latLon.lat, latLon.lon);
    const contourPointFromUtmResult = contractPoint.encodeFromUtm(utmFromContractPointResult);
    assert.equal(contourPointFromUtmResult, contractPointWithoutHeight);
  });

  it('should calculate area correctly', function () {
    const basePointLatLon = {lat: 10.111222333444, lon: 80.555666777888};

    const basePointUtm = utm.fromLatLon(basePointLatLon.lat, basePointLatLon.lon);
    const secondPointUtm = clone(basePointUtm);
    secondPointUtm.x += 5;
    const thirdPointUtm = clone(secondPointUtm);
    thirdPointUtm.y += 5;
    const fourthPointUtm = clone(thirdPointUtm);
    fourthPointUtm.x -= 5;

    const utmPoints = [basePointUtm, secondPointUtm, thirdPointUtm, fourthPointUtm];
    const utmArea = Math.abs(utm.area(utmPoints));
    assert.equal(utmArea, 25);

    const contractPointArea = contractPoint.contourArea(utmPoints.map(contractPoint.encodeFromUtm));
    assert.equal(utmArea, contractPointArea);
  })
});
