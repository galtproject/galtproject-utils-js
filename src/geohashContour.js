const ngeohash = require('ngeohash');
const _ = require('lodash');
const Geohash = require('./geohash');
const GeohashExtra = require('./geohashExtra');
const geojsonArea = require('@mapbox/geojson-area');
const overlayPslg = require('overlay-pslg');

module.exports = class GeohashContour {
    /**
     * Get area of geohashes contour in meters
     * @param contour
     * @returns [lat, lon]
     */
    static area(contour) {
        return Math.abs(geojsonArea.ring(contour.map((geohash) => {
            const coors = GeohashExtra.decodeToLatLon(geohash);
            return [coors.lat, coors.lon];
        })));
    }

    /**
     * Sort geohashes of contour in clockwise direction
     * @param contour
     * @param antiClockwise
     * @returns {*}
     */
    static sortClockwise(contour, antiClockwise = false) {
        if(!contour.length || contour.length === 1) {
            return contour;
        }
        let points = contour.map((geohash) => {
            const coors = GeohashExtra.decodeToLatLon(geohash);
            return {x: coors.lat, y: coors.lon};
        });

        // Find min max to get center
        // Sort from top to bottom
        points.sort((a, b) => a.y - b.y);

        // Get center y
        const cy = (points[0].y + points[points.length - 1].y) / 2;

        // Sort from right to left
        points.sort((a, b) => b.x - a.x);

        // Get center x
        const cx = (points[0].x + points[points.length - 1].x) / 2;

        // Center point
        const center = {x: cx, y: cy};

        // Pre calculate the angles as it will be slow in the sort
        // As the points are sorted from right to left the first point
        // is the rightmost

        // Starting angle used to reference other angles
        let startAng;
        points.forEach(point => {
            let ang = Math.atan2(point.y - center.y, point.x - center.x);
            if (!startAng) {
                startAng = ang
            }
            else {
                if (ang < startAng) {  // ensure that all points are clockwise of the start point
                    ang += Math.PI * 2;
                }
            }
            point.angle = ang; // add the angle to the point
        });
        
        // Sort clockwise;
        points.sort((a, b) => a.angle - b.angle);
        
        if(antiClockwise) {
            const ccwPoints = points.reverse();

            // move the last point back to the start
            ccwPoints.unshift(ccwPoints.pop());
            points = ccwPoints;
        }
        
        return points.map((point) => {
            return GeohashExtra.encodeFromLatLng(point.x, point.y, contour[0].length);
        })
    }

    /**
     * Overlay operations with contours
     * @param redContour
     * @param blueContour
     * @param operation
     * @returns [geohash]
     */
    static overlay(redContour, blueContour, operation) {
        const redPoints = [], redEdges = [];
        const bluePoints = [], blueEdges = [];

        redContour.map((geohash, index) => {
            const coors = GeohashExtra.decodeToLatLon(geohash);
            redPoints.push([coors.lat, coors.lon]);
            redEdges.push([index, (redContour.length - 1 === index) ? 0 : index + 1]);
        });

        blueContour.map((geohash, index) => {
            const coors = GeohashExtra.decodeToLatLon(geohash);
            bluePoints.push([coors.lat, coors.lon]);
            blueEdges.push([index, (blueContour.length - 1 === index) ? 0 : index + 1]);
        });

        const overlayResult = overlayPslg(redPoints, redEdges, bluePoints, blueEdges, operation);
        return overlayResult.points.map((point) => {
            return GeohashExtra.encodeFromLatLng(point[0], point[1], redContour[0].length);
        });
    }

    /**
     * Split contours and returns result contours
     * @param baseContour
     * @param splitContour
     * @returns {base, split}
     */
    static splitContours(baseContour, splitContour) {
        return {
            base: GeohashContour.overlay(baseContour, splitContour, "rsub"),
            split: GeohashContour.overlay(baseContour, splitContour, "and")
        };
    }

    static mergePossible(baseContour, mergeContour) {
        let mergePossible = false;
        baseContour.some(geohash => {
            mergePossible = mergePossible || mergeContour.indexOf(geohash) !== -1;
            return mergePossible;
        });

        if (mergePossible) {
            return mergePossible;
        }

        return GeohashContour.overlay(baseContour, mergeContour, "and").length > 0;
    }

    /**
     * Merge contours and returns result contour
     * @param baseContour
     * @param mergeContour
     * @param filterByDuplicates
     * @returns [geohash]
     */
    static mergeContours(baseContour, mergeContour, filterByDuplicates = true) {
        if (!GeohashContour.mergePossible(baseContour, mergeContour)) {
            return [];
        }
        const resultContour = GeohashContour.overlay(baseContour, mergeContour, "or");

        if (filterByDuplicates) {
            return resultContour.filter(geohash => {
                return baseContour.indexOf(geohash) === -1 || mergeContour.indexOf(geohash) === -1;
            });
        } else {
            return resultContour;
        }
    }

    static bboxes(contour, precision) {
        let maxLat;
        let minLat;
        let maxLon;
        let minLon;

        contour.forEach((geohash) => {
            const coordinates = GeohashExtra.decodeToLatLon(geohash);

            if (_.isNil(maxLat) || coordinates.lat > maxLat) {
                maxLat = coordinates.lat;
            }
            if (_.isNil(minLat) || coordinates.lat < minLat) {
                minLat = coordinates.lat;
            }
            if (_.isNil(maxLon) || coordinates.lon > maxLon) {
                maxLon = coordinates.lon;
            }
            if (_.isNil(minLon) || coordinates.lon < minLon) {
                minLon = coordinates.lon;
            }
        });

        return ngeohash.bboxes(minLat, minLon, maxLat, maxLon, precision);
    }

    /**
     * Find geohash, which contains in contour by geohash precision
     * @param contour
     * @param precision
     * @param processCallback
     * @returns {Array}
     */
    static approximate(contour, precision, processCallback) {
        const polygon = contour.map((geohash) => {
            const coordinates = GeohashExtra.decodeToLatLon(geohash);
            return [coordinates.lat, coordinates.lon];
        });

        const allGeohashes = GeohashContour.bboxes(contour, precision);

        const geohashesInside = [];
        const parentsToChildren = {};
        const parentsForMerge = [];

        allGeohashes.forEach((geohash, index) => {
            if (GeohashContour.isGeohashInside(geohash, polygon)) {

                geohashesInside.push(geohash);

                const parent = Geohash.getParent(geohash);
                if (!parentsToChildren[parent]) {
                    parentsToChildren[parent] = [];
                }
                parentsToChildren[parent].push(geohash);

                if (parentsToChildren[parent].length === 32) {
                    parentsForMerge.push(parent);
                }
            }

            const geohashNumber = index + 1;
            if (processCallback && index && (index % 1000 === 0 || allGeohashes.length === geohashNumber)) {
                processCallback("entryCheck", geohashNumber, allGeohashes.length);
            }
        });

        for (let i = 0; i < parentsForMerge.length; i++) {
            const geohashParent = parentsForMerge[i];

            parentsToChildren[geohashParent].forEach((geohash) => {
                geohashesInside.splice(geohashesInside.indexOf(geohash), 1);
            });
            geohashesInside.push(geohashParent);

            const parentOfParent = Geohash.getParent(geohashParent);
            if (!parentsToChildren[parentOfParent]) {
                parentsToChildren[parentOfParent] = [];
            }
            parentsToChildren[parentOfParent].push(geohashParent);

            if (parentsToChildren[parentOfParent].length === 32) {
                parentsForMerge.push(parentOfParent);
            }

            const geohashNumber = i + 1;
            if (processCallback && i && (i % 100 === 0 || parentsForMerge.length === geohashNumber)) {
                processCallback("parentsMerge", geohashNumber, parentsForMerge.length);
            }
        }

        return geohashesInside;
    }

    static isGeohashInside(geohash, latLngPolygon) {
        const neChild = Geohash.getChildByDirection(Geohash.getChildByDirection(geohash, 'ne'), 'ne');
        const seChild = Geohash.getChildByDirection(Geohash.getChildByDirection(geohash, 'se'), 'se');
        const nwChild = Geohash.getChildByDirection(Geohash.getChildByDirection(geohash, 'nw'), 'nw');
        const swChild = Geohash.getChildByDirection(Geohash.getChildByDirection(geohash, 'sw'), 'sw');

        const neCoor = GeohashExtra.decodeToLatLon(neChild);
        const seCoor = GeohashExtra.decodeToLatLon(seChild);
        const nwCoor = GeohashExtra.decodeToLatLon(nwChild);
        const swCoor = GeohashExtra.decodeToLatLon(swChild);

        return GeohashContour.isInside([neCoor.lat, neCoor.lon], latLngPolygon)
            && GeohashContour.isInside([seCoor.lat, seCoor.lon], latLngPolygon)
            && GeohashContour.isInside([nwCoor.lat, nwCoor.lon], latLngPolygon)
            && GeohashContour.isInside([swCoor.lat, swCoor.lon], latLngPolygon);
    }

    // https://github.com/substack/point-in-polygon
    static isInside(point, polygon) {
        let x;
        let y;
        let xi;
        let xj;
        let yi;
        let yj;

        x = point[0], y = point[1];

        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            xi = polygon[i][0], yi = polygon[i][1];
            xj = polygon[j][0], yj = polygon[j][1];

            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }

    /**
     * Filter geohashes list by contains in contour
     * @param geohashes
     * @param contour
     * @returns {*}
     */
    static filterByInside(geohashes, contour) {
        const polygon = [];

        contour.forEach((geohash) => {
            const coordinates = GeohashExtra.decodeToLatLon(geohash);
            polygon.push([coordinates.lat, coordinates.lon]);
        });

        return geohashes.filter((geohash) => {
            return GeohashContour.isGeohashInside(geohash, polygon);
        })
    }
};