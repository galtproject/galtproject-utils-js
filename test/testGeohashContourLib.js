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
        
        assert.deepEqual(splitResult, {
            base: [ "w9cwg7dkdrp", "w9cwfqk3f0m", "w9cx63zs884", "w9cx71gk90n", "w9cx71g9s1b" ],
            split: [ "w9cx63zs884", "w9cx6wbuuyu", "w9cx71gk90n" ]
        });

        splitResult = geohashContourUtils.splitContours(["w24q8wyzcj3", "w24q8tzncuz", "w24q8w5b8bx", "w24q8wgu6ux"], ["w24q8wdrn06", "w24q8wsd109", "w24q8w69s0d"]);

        assert.deepEqual(splitResult, {
            base: ["w24q8tzncuz", "w24q8w5b8bx", "w24q8w7yf1b", "w24q8wsd109", "w24q8wegdqe", "w24q8wgu6ux", "w24q8wyzcj3"],
            split: [ "w24q8w7yf1b", "w24q8wegdqe", "w24q8wsd109" ]
        });
        
        /*
               _
          _   |_|
         |_|
           
         */
        const notIntersectContoursSplitPossible = geohashContourUtils.splitPossible(["w9cx6wbuuyu", "w9cx71g9s1b", "w9cwg7dkdrp", "w9cwfqk3f0m"], [ "u401", "u410", "u411" ]);

        assert.equal(notIntersectContoursSplitPossible,false);
        
        /*
            _
          _| |_
         |_| |_|
           |_|
         */
        let intersectContoursSplitPossible = geohashContourUtils.splitPossible(["w24q8w5b8bx", "w24q8tzncuz", "w24q8wyzcj3", "w24q8wgu6ux"], ["w24q8wdkjb6", "w24q8wxm7b7", "w24q8y2jcbt", "w24q8w4w7bd"]);
        assert.equal(intersectContoursSplitPossible, false);

        /*   .
          __/_\__
         |_/___\_|
          /_____\
         */ 
        intersectContoursSplitPossible = geohashContourUtils.splitPossible(["w24qgqd27yx", "w24qgusp7zp", "w24qg9s2rzz"], ["w24qgqgd4y9", "w24qgqstryd", "w24qgm6hwyc"]);
        assert.equal(intersectContoursSplitPossible, false);
        
        let mergeResult = geohashContourUtils.mergeContours([ 'w9cx71g9s1b', 'w9cwg7dkdrp', 'w9cwfqk3f0m', 'w9cx63zs884', 'w9cx71gk90n' ], [ 'w9cx6wbuuyu', 'w9cx63zs884', 'w9cx71gk90n' ]);

        assert.deepEqual(mergeResult, [ "w9cwg7dkdrp", "w9cwfqk3f0m", "w9cx63zs884", "w9cx6wbuuyu", "w9cx71gk90n", "w9cx71g9s1b" ]);

        mergeResult = geohashContourUtils.mergeContours([ 'w9cx71g9s1b', 'w9cwg7dkdrp', 'w9cwfqk3f0m', 'w9cx63zs884', 'w9cx71gk90n' ], [ "u401", "u410", "u411" ]);

        assert.deepEqual(mergeResult, [ ]);

        mergeResult = geohashContourUtils.mergeContours([ 'w24qf7uc60s8', 'w24qfktnrmy4', 'w24qfkfeqxp7' ], [ 
            'w24r407j3nm8',
            'w24r40ptz160',
            'w24qfr2eqww0',
            'w24r4241fndj',
            'w24qfrydmn3m',
            'w24qfqqj8t5g',
            'w24qfq6pqydp',
            'w24qfmt8e75u',
            'w24qfktnrmy4',
            'w24qfkfeqxp7',
            'w24qf7uc60s8',
            'w24qf6s32p85' 
        ]);

        // TODO: should work
        // assert.deepEqual(mergeResult, [ 
        //     "w24qf6s32p85",
        //     "w24r407j3nm8",
        //     "w24r40ptz160",
        //     "w24qfr2eqww0",
        //     "w24r4241fndj",
        //     "w24qfrydmn3m",
        //     "w24qfqqj8t5g",
        //     "w24qfq6pqydp",
        //     "w24qfmt8e75u",
        //     "w24qfktnrmy4",
        //     "w24qf7uc60s8" 
        // ]);
    });

    it('should correct sort in clockwise direction', function () {
        assert.deepEqual(geohashContourUtils.sortClockwise([ "w9cx6wbuuyu", "w9cwfqk3f0m", "w9cx71g9s1b", "w9cwg7dkdrp"]),
            ["w9cx6wbuuyu", "w9cx71g9s1b", "w9cwg7dkdrp", "w9cwfqk3f0m"]);
        
        assert.deepEqual(geohashContourUtils.sortClockwise([ "w9cx6wbuuyu", "w9cwfqk3f0m", "w9cx71g9s1b", "w9cwg7dkdrp"], true),
            ["w9cx6wbuuyu", "w9cwfqk3f0m", "w9cwg7dkdrp", "w9cx71g9s1b"]);
    });

    it('should correct sort in clockwise direction', function () {
        assert.deepEqual(geohashContourUtils.area([ "w9cx6wbuuyu", "w9cx71g9s1b", "w9cwg7dkdrp", "w9cwfqk3f0m"]), 33780459.29545421);
    });
});
