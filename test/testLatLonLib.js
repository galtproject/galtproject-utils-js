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
const assert = require('assert');

describe('latLon utils', () => {
  it('should shift correctly', function () {
    const basePointLatLon = {lat: 50.111222333444, lon: 80.555666777888};

    [{dx: 5, dy: 0}, {dx: 0, dy: 5}, {dx: 5, dy: 5}, {dx: -5, dy: 0}, {dx: 0, dy: -5}, {dx: -5, dy: -5}, {dx: 5, dy: -5}, {dx: -5, dy: 5}].forEach((shiftMeters) => {
      const resultPointLatLon = latLonLib.shift(basePointLatLon.lat, basePointLatLon.lon, shiftMeters.dx, shiftMeters.dy);

      const basePointUtm = utmLib.fromLatLon(basePointLatLon.lat, basePointLatLon.lon);
      const resultPointUtm = utmLib.fromLatLon(resultPointLatLon.lat, resultPointLatLon.lon);
      assert.equal(roundToDecimal(basePointUtm.x + shiftMeters.dx), roundToDecimal(resultPointUtm.x));
      assert.equal(roundToDecimal(basePointUtm.y + shiftMeters.dy), roundToDecimal(resultPointUtm.y));

      const baseCalculatedPointLatLon = latLonLib.shift(resultPointLatLon.lat, resultPointLatLon.lon, shiftMeters.dx * -1, shiftMeters.dy * -1);
      assert.equal(roundToDecimal(baseCalculatedPointLatLon.lon, 10), roundToDecimal(basePointLatLon.lon, 10));
      assert.equal(roundToDecimal(baseCalculatedPointLatLon.lat, 10), roundToDecimal(basePointLatLon.lat, 10));
    });

    function roundToDecimal(value, decimal = 4) {
      return Math.round(value * 10 ** decimal) / 10 ** decimal;
    }
  })

  it('should detect point on segment correctly', function () {
    // y shift: 0 meters, x shift: 20 meters
    assert.equal(latLonLib.pointOnSegment([40.7560669086, -73.9657481913], [40.7560485796, -73.9657051325], [40.756082385, -73.9657839884]), true);
    // y shift: 0.01 meters, x shift: 20 meters
    assert.equal(latLonLib.pointOnSegment([40.7560669873, -73.9657481336], [40.7560485796, -73.9657051325], [40.7560669873, -73.9657481336]), true);
    // y shift: 0.1 meters, x shift: 20 meters
    assert.equal(latLonLib.pointOnSegment([40.7560669873, -73.9657481336], [40.7560485796, -73.9657051325], [40.7560676952, -73.9657476141]), false);
  })
});
