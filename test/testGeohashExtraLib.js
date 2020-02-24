/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const geohashExtraUtils = require('../src/geohashExtra');
const assert = require('assert');

describe('geohash utils', () => {
    it('should detect right neighbours', function () {
        assert.deepEqual(geohashExtraUtils.autoBboxes("w24rjp5hr6e2", "w24q1sw2x3gr"), ["w24q1", "w24q4", "w24q5", "w24qh", "w24qj", "w24q3", "w24q6", "w24q7", "w24qk", "w24qm", "w24q9", "w24qd", "w24qe", "w24qs", "w24qt", "w24qc", "w24qf", "w24qg", "w24qu", "w24qv", "w24r1", "w24r4", "w24r5", "w24rh", "w24rj"]);
    });
});
