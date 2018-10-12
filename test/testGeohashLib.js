const geohashUtils = require('../src/geohash');
const assert = require('assert');

describe('geohash utils', () => {
    it('should detect right neighbours', function () {
        assert.equal(geohashUtils.neighbourByDirection("u44", "e"), "u45");
        assert.equal(geohashUtils.neighbourByDirection("gfp", "e"), "u40");

        assert.deepEqual(geohashUtils.allNeighbours("gfp"), ["gfr", "u42", "u40", "u1b", "gcz", "gcy", "gfn", "gfq"]);

        assert.equal(geohashUtils.directionOfNeighbour("gfp", "u40"), "e");

        assert.equal(geohashUtils.isNeighbourOnSameLevel("gfp", "u40", "e"), true);
        assert.equal(geohashUtils.isNeighbourOnSameLevel("gfp1", "u40", "e"), false);
        assert.equal(geohashUtils.isNeighbourOnSameLevel("gfp1", "u45", "e"), false);

        assert.equal(geohashUtils.isNeighbourOnDiffLevel("u40", "u410", "e"), true);
        assert.equal(geohashUtils.isNeighbourOnDiffLevel("gfpb", "u40", "e"), true);
        assert.equal(geohashUtils.isNeighbourOnDiffLevel("gfp", "u400", "e"), true);
        assert.equal(geohashUtils.isNeighbourOnDiffLevel("gfp", "u40", "e"), false);
        assert.equal(geohashUtils.isNeighbourOnDiffLevel("gfp8", "u40", "e"), false);

        assert.equal(geohashUtils.getGeohashBorder("gfpb"), "se");
        assert.equal(geohashUtils.getGeohashBorder("gfp8"), "s");
        assert.equal(geohashUtils.getGeohashBorder("gfpe"), null);

        assert.deepEqual(geohashUtils.getNeighbourWithDirection("gfpe", ["u40", "gfpg", "gfpf"]), {geohash: "gfpg", direction: "e"});
    });

    it('should detect right borders', function () {
        assert.equal(geohashUtils.getGeohashBorder("gfpb"), "se");
        assert.equal(geohashUtils.getGeohashBorder("gfp8"), "s");
        assert.equal(geohashUtils.getGeohashBorder("gfpe"), null);
    });

    it('should detect right parent and children', function () {
        assert.equal(geohashUtils.getParent("gfpe"), "gfp");
        
        assert.equal(geohashUtils.getChildByDirection("gfp", "sw"), "gfp0");
        assert.deepEqual(geohashUtils.getChildrenByDirection("gfp", "w"), ["gfp0", "gfp1", "gfp4", "gfp5", "gfph", "gfpj", "gfpn", "gfpp"]);
        
        assert.deepEqual(geohashUtils.getChildren("gfp"), ['gfp0', 'gfp1', 'gfp2', 'gfp3', 'gfp4', 'gfp5', 'gfp6', 'gfp7', 
            'gfp8', 'gfp9', 'gfpb', 'gfpc', 'gfpd', 'gfpe', 'gfpf', 'gfpg', 'gfph', 'gfpj', 'gfpk', 'gfpm', 'gfpn', 
            'gfpp', 'gfpq', 'gfpr', 'gfps', 'gfpt', 'gfpu', 'gfpv', 'gfpw', 'gfpx', 'gfpy', 'gfpz']);

        assert.deepEqual(geohashUtils.getFullParentsFromGeohashList(['gfp0', 'gfp1', 'gfp2', 'gfp3', 'gfp4', 'gfp5', 'gfp6', 'gfp7',
            'gfp8', 'gfp9', 'gfpb', 'gfpc', 'gfpd', 'gfpe', 'gfpf', 'gfpg', 'gfph', 'gfpj', 'gfpk', 'gfpm', 'gfpn',
            'gfpp', 'gfpq', 'gfpr', 'gfps', 'gfpt', 'gfpu', 'gfpv', 'gfpw', 'gfpx', 'gfpy', 'gfpz']), ["gfp"]);
        
        assert.deepEqual(geohashUtils.getFullParentsFromGeohashList(['gfp0', 'gfp1', 'gfp2', 'gfp3', 'gfp4', 'gfp5', 'gfp6', 'gfp7',
            'gfp8', 'gfp9', 'gfpb', 'gfpc', 'gfpd', 'gfpe', 'gfpf', 'gfpg', 'gfph', 'gfpj', 'gfpk', 'gfpm', 'gfpn',
            'gfpp', 'gfpq', 'gfpr', 'gfps', 'gfpt', 'gfpu', 'gfpv', 'gfpw', 'gfpx', 'gfpy']), []);
    });
});