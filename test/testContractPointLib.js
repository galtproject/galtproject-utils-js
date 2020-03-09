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
const vectorLib = require('../src/vector');
const commonLib = require('../src/common');
const latLonLib = require('../src/latLon');
const geohashExtra = require('../src/geohashExtra');
const assert = require('assert');

describe('contractPoint utils', () => {
  it('should convert latLon to contractPoint and vise versa', function () {
    const latLon = {lat: 10.1112223334, lon: 80.5556667778};
    const height = 11;
    const contractPointResult = contractPoint.encodeFromLatLngHeight(latLon.lat, latLon.lon, height);
    assert.equal(contractPointResult, '374310603614897501116278129316596581877122');
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

    const anotherCPoint = '3504908379293184276105216900222897518066954';
    const anotherDecoded = contractPoint.decodeToLatLonHeight(anotherCPoint, true);
    assert.equal(anotherDecoded.lat,  40.7557149511);
    assert.equal(anotherDecoded.lon, -73.9653141238);

    const anotherEncoded = contractPoint.encodeFromLatLngHeight(anotherDecoded.lat, anotherDecoded.lon, anotherDecoded.height);
    assert.equal(anotherEncoded, anotherCPoint);
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

      if(!shiftMeters.dx || !shiftMeters.dy) {
        const angle = contractPoint.getAngle(baseContractPoint, resultContractPoint);
        const resultPointUtmByAngle = contractPoint.decodeToUtm(contractPoint.shift(baseContractPoint, 5, 0, angle));
        assert.equal(roundToDecimal(resultPointUtmByAngle.x), roundToDecimal(resultPointUtm.x));
        assert.equal(roundToDecimal(resultPointUtmByAngle.y), roundToDecimal(resultPointUtm.y));
      }
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

  it.only('should check isContractPoint correctly', function () {
    ['dr72j3f7enwc'].forEach(geohash => {
      const geohash5 = commonLib.geohashToGeohash5(geohash);
      const geohash5z = commonLib.geohash5ToGeohash5z('0', geohash5);
      assert.equal(contractPoint.isContractPoint(geohash5z), false);
    });

    ['11215706813718168087817046853794346353862874'].forEach(cPoint => {
      assert.equal(contractPoint.isContractPoint(cPoint), true);
    });
  })

  it('should detect intersection correctly', function () {
    const firstCpointContour = [
        [40.7562988228, -73.9653340837],
        [40.7562193716, -73.9651486588],
        [40.7560675629, -73.9652563551],
        [40.756148433, -73.9654464625]
    ].map(latLon => contractPoint.encodeFromLatLng(latLon[0], latLon[1]));

    const secondCpointContour = [
      [40.7562442001, -73.9653200364],
      [40.7562080214, -73.9652011022],
      [40.7561129637, -73.9652666565],
      [40.7561690052, -73.9653912096]
    ].map(latLon => contractPoint.encodeFromLatLng(latLon[0], latLon[1]));

    assert.equal(contractPoint.intersects(secondCpointContour, firstCpointContour), true);
    assert.equal(contractPoint.intersects(firstCpointContour, secondCpointContour), true);

    assert.equal(contractPoint.contourInsideAnother(secondCpointContour, firstCpointContour), true);
    assert.equal(contractPoint.contourInsideAnother(firstCpointContour, secondCpointContour), false);

    const thirdCpointContour = [
      [40.7562708166, -73.9648513109],
      [40.7561975136, -73.9646732123],
      [40.7560142559, -73.9648018963],
      [40.7560914581, -73.9649830833]
    ].map(latLon => contractPoint.encodeFromLatLng(latLon[0], latLon[1]));

    assert.equal(contractPoint.contourInsideAnother(secondCpointContour, thirdCpointContour), false);
    assert.equal(contractPoint.contourInsideAnother(thirdCpointContour, secondCpointContour), false);

    assert.equal(contractPoint.intersects(secondCpointContour, thirdCpointContour), false);
    assert.equal(contractPoint.intersects(firstCpointContour, thirdCpointContour), false);


    const collinearContour1 = [
      '3504908379293184277775089960751380970484929',
      '3504908379293184267663027581401573803463709',
      '3504908379293184275610438330677859925195924',
      '3504908379293184272425294371702652776185295',
      '3504908379293184279042971574425585869879316',
      '3504908379293184291505241382486358460634246'
    ];
    const collinearContour2 = [
      '3504908379293184276105216900222897518066954',
      '3504908379293184272425294371702652776185295',
      '3504908379293184275610438330677859925195924',
      '3504908379293184265220051476743923045052113',
      '3504908379293184244717583796716105286622206',
      '3504908379293184247067791225427070709953585',
      '3504908379293184236739256304372281954668313',
      '3504908379293184244006351132210159812812507',
      '3504908379293184253809172293908300056543103',
      '3504908379293184256283083588377561732987908',
      '3504908379293184266518849833485665153149377',
      '3504908379293184267199165754924073416653579'
    ];
    assert.equal(contractPoint.contourInsideAnother(collinearContour1, collinearContour2, true), false);
    assert.equal(contractPoint.contourInsideAnother(collinearContour1, collinearContour2, false), true);
  });
});
