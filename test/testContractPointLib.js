/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const geohashPseudo = require('../src/contractPoint');
const assert = require('assert');

describe('contractPoint utils', () => {
  it('should convert latLone to contractPoint and vise versa', function () {
    const latLon = {lat: 102.1112223334, lon: 80.5556667778};
    const height = 11;
    const result = geohashPseudo.encodeFromLatLng(latLon.lat, latLon.lon, height);
    const decoded = geohashPseudo.decodeToLatLon(result);
    assert.equal(latLon.lat, decoded.lat);
    assert.equal(latLon.lon, decoded.lon);
    assert.equal(height, decoded.height);
  });
});
