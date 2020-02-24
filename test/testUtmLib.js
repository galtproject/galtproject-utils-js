/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const utmUtils = require('../src/utm');
const assert = require('assert');

describe('utm utils', () => {
  it('should correctly calculate utm area', function () {
    const latLonContour = [
      [1.2291728239506483, 104.51007032766938],
      [1.2037726398557425, 104.50989866629243],
      [1.2036009784787893, 104.53199403360486],
      [1.227113390341401, 104.53336732462049]
    ];

    const utmContor = latLonContour.map((latLon) => {
      return utmUtils.fromLatLon(latLon[0], latLon[1]);
    });

    assert.equal(utmUtils.area(utmContor), -6841437.324010665);
  });

  it('should correctly uncompress', function () {
    const result = utmUtils.uncompress([443413.9761, 136017.8858, 10001048000.9997]);
    assert.equal(result.x, 443413.9761);
    assert.equal(result.y, 136017.8858);
    assert.equal(result.h, 'N');
    assert.equal(result.latBandNumber, 10);
    assert.equal(result.latBand, 'N');
    assert.equal(result.zone, 48);
    assert.equal(result.scale - 0.9997 < 0.00001, true);
  });

  it('should correctly convert toString', function () {
    const result = utmUtils.toString({
      x: 443413.9761,
      y: 136017.8858,
      h: 'N',
      latBandNumber: 10,
      latBand: 'N',
      zone: 48,
      scale: 0.9997005462646484
    });
    assert.equal(result, 'N48 443413.9761E 136017.8858N');
  });

  it('should correctly convert latLon to utm', function () {
    const latLonToCheck = [
      [-74.0550677213, -90.318972094],
      [25.5888986977, -125.9639064827],
      [11.9419456134, 30.6196556841],
      [66.9375384427, -9.6290061374],
      [-1.9773564645, 134.3986143967]
    ];

    const shouldBeUtmByIndex = [
      {zone: 15, h: 'S', x: 582184.914156, y: 1779969.098105, convergence: -2.578020654, scale: 0.99968257906},
      {zone: 10, h: 'N', x: 202270.551102, y: 2833486.274605, convergence: -1.281088775, scale: 1.000694737455},
      {zone: 36, h: 'N', x: 240753.909523, y: 1321248.884905, convergence: -0.492818697, scale: 1.000431591336},
      {zone: 29, h: 'N', x: 472503.837058, y: 7424555.961089, convergence: -0.578738506, scale: 0.999609252979},
      {zone: 53, h: 'S', x: 433119.186937, y: 9781429.716413, convergence: 0.020751304, scale: 0.999655369864}
    ];

    latLonToCheck.forEach((latLon, index) => {
      const resultUtm = utmUtils.fromLatLon(latLon[0], latLon[1]);

      assert.equal(shouldBeUtmByIndex[index].zone, resultUtm.zone);
      assert.equal(shouldBeUtmByIndex[index].h, resultUtm.h);
      assert.equal(shouldBeUtmByIndex[index].x, resultUtm.x);
      assert.equal(shouldBeUtmByIndex[index].y, resultUtm.y);
      assert.equal(shouldBeUtmByIndex[index].scale, resultUtm.scale);
      assert.equal(shouldBeUtmByIndex[index].convergence, resultUtm.convergence);

      const resultLatLon = utmUtils.toLatLon(resultUtm);

      assert.equal(Math.abs(resultLatLon.lat - latLon[0]) < 0.00000001, true);
      assert.equal(Math.abs(resultLatLon.lon - latLon[1]) < 0.00000001, true);
    });
  });
});
