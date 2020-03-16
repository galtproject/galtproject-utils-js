/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const tokenDataLib = require('../src/tokenData');
const assert = require('assert');

describe('tokenData lib', () => {
    it('should convert old data to new', function () {
        const result = tokenDataLib.getHumanAddressFromIpld({
            humanAddress: {"floor":"1","litera":"2","cityStreet":"Smugglers Way","countryRegion":"Andromeda, Bir Tawil"}
        });
        assert.equal(result.city, "");
        assert.equal(result.floor, "1");
        assert.equal(result.roomNumber, "2");
        assert.equal(result.street, "Smugglers Way");
        assert.equal(result.region, "Bir Tawil");
        assert.equal(result.country, "Andromeda");
    });

    it('should correctly handle new data', function () {
        const result = tokenDataLib.getHumanAddressFromIpld({
            protocolVersion: 2,
            humanAddress: {"floor":"1","roomNumber":"2","street":"Smugglers Way","country":"Andromeda","region":"Bir Tawil"}
        });
        assert.equal(result.city, undefined);
        assert.equal(result.floor, "1");
        assert.equal(result.roomNumber, "2");
        assert.equal(result.street, "Smugglers Way");
        assert.equal(result.region, "Bir Tawil");
        assert.equal(result.country, "Andromeda");
    });

    it('should filter not related to token type fields', function () {
        const result = tokenDataLib.getHumanAddressFromIpld({
            protocolVersion: 2,
            humanAddress: {"floor":"1","roomNumber":"2","street":"Smugglers Way","country":"Andromeda","region":"Bir Tawil"}
        }, tokenDataLib.TOKEN_TYPE_BY_NAME.LAND);

        assert.equal(result.city, undefined);
        assert.equal(result.floor, undefined);
        assert.equal(result.roomNumber, undefined);
        assert.equal(result.street, "Smugglers Way");
        assert.equal(result.region, "Bir Tawil");
        assert.equal(result.country, "Andromeda");
    });

    it('should correctly convert old contract string', function () {
        const result = tokenDataLib.getHumanAddressFromContractString('countryRegion=Andromeda, Bir Tawil|\ncityStreet=Smugglers Way|\nfloor=1');
        assert.equal(result.city, '');
        assert.equal(result.street, "Smugglers Way");
        assert.equal(result.region, "Bir Tawil");
        assert.equal(result.country, "Andromeda");
        assert.equal(result.floor, "1");

        const newHumanAddressString = tokenDataLib.generateHumanAddressContractString(result);
        assert.equal(newHumanAddressString, "cn=Andromeda|\nfl=1|\nrg=Bir Tawil|\nsr=Smugglers Way");

        const newLandHumanAddressString = tokenDataLib.generateHumanAddressContractString(result, tokenDataLib.TOKEN_TYPE_BY_NAME.LAND);
        assert.equal(newLandHumanAddressString, "cn=Andromeda|\nrg=Bir Tawil|\nsr=Smugglers Way");
    });
});
