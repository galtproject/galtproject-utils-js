const geohashContourUtils = require('../src/geohashContour');
const assert = require('assert');

describe('geohashContour utils', () => {
    it('should correct approximate', function () {
        const containsGeohashes = geohashContourUtils.approximate(["w9cx6wbuuyu", "w9cx7qpmkt3", "w9cwg7dkdrp"], 6);

        assert.deepEqual(containsGeohashes, [ 'w9cx5h', 'w9cx5j', 'w9cx5n', 'w9cx5p', 'w9cx70', 'w9cx71', 'w9cx6f',
            'w9cx74', 'w9cx6g', 'w9cx75', 'w9cx6u', 'w9cx7h', 'w9cx6v', 'w9cx7j' ]);
    });
    
    it('should correct filter by inside contour', function () {
        assert.deepEqual(geohashContourUtils.filterByInside([ 'w9cx5h', 'w9cx5j', 'gfpb'], 
            ["w9cx6wbuuyu", "w9cx7qpmkt3", "w9cwg7dkdrp"]), ['w9cx5h', 'w9cx5j']);
    });
});