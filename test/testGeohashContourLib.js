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

    it('should correct split and merge', function () {
        let splitResult = geohashContourUtils.splitContours(["w9cx6wbuuyu", "w9cx71g9s1b", "w9cwg7dkdrp", "w9cwfqk3f0m"], ["w9cx6r8hun8", "w9cx61yk800", "w9cx73ghs00", "w9cx7rfxspb"]);
        
        console.log(splitResult);
        assert.deepEqual(splitResult, {
            base: [ 'w9cx63zs884', 'w9cx71gk90n', 'w9cx71g9s1b', 'w9cwg7dkdrp', 'w9cwfqk3f0m' ],
            split: [ 'w9cx63zs884', 'w9cx71gk90n', 'w9cx6wbuuyu']
        });

        splitResult = geohashContourUtils.splitContours(["w9cx6wbuuyu", "w9cx71g9s1b", "w9cwg7dkdrp", "w9cwfqk3f0m"], [ "u401", "u410", "u411" ]);

        assert.deepEqual(splitResult, {
            base: [ "w9cx6wbuuyu", "w9cx71g9s1b", "w9cwg7dkdrp", "w9cwfqk3f0m" ],
            split: [  ]
        });

        let mergeResult = geohashContourUtils.mergeContours([ 'w9cx71g9s1b', 'w9cwg7dkdrp', 'w9cwfqk3f0m', 'w9cx63zs884', 'w9cx71gk90n' ], [ 'w9cx6wbuuyu', 'w9cx63zs884', 'w9cx71gk90n' ]);

        assert.deepEqual(mergeResult, [ 'w9cx71g9s1b', 'w9cwg7dkdrp', 'w9cwfqk3f0m', 'w9cx6wbuuyu' ]);

        mergeResult = geohashContourUtils.mergeContours([ 'w9cx71g9s1b', 'w9cwg7dkdrp', 'w9cwfqk3f0m', 'w9cx63zs884', 'w9cx71gk90n' ], [ "u401", "u410", "u411" ]);

        assert.deepEqual(mergeResult, [ ]);
    });

    it('should correct sort in clockwise direction', function () {
        assert.deepEqual(geohashContourUtils.sortClockwise([ "w9cx6wbuuyu", "w9cwfqk3f0m", "w9cx71g9s1b", "w9cwg7dkdrp"]),
            ["w9cx6wbuuyu", "w9cx71g9s1b", "w9cwg7dkdrp", "w9cwfqk3f0m"]);
        
        assert.deepEqual(geohashContourUtils.sortClockwise([ "w9cx6wbuuyu", "w9cwfqk3f0m", "w9cx71g9s1b", "w9cwg7dkdrp"], true),
            ["w9cx6wbuuyu", "w9cwfqk3f0m", "w9cwg7dkdrp", "w9cx71g9s1b"]);
    });
});