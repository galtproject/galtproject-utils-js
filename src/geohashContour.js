const ngeohash = require('ngeohash');
const _ = require('lodash');
const Geohash = require('./geohash');
const GeohashExtra = require('./geohashExtra');
const geojsonArea = require('@mapbox/geojson-area');

module.exports = class GeohashContour {
    /**
     * Get area of geohashes contour in meters
     * @param contour
     * @returns {*}
     */
    static area(contour){
        return geojsonArea.ring(contour.map((geohash) => {
            const coors = GeohashExtra.decodeToLatLng(geohash);
            return [coors.lat, coors.lon];
        }));
    }

    /**
     * Find geohash, which contains in contour by geohash precision
     * @param contour
     * @param precision
     * @param processCallback
     * @returns {Array}
     */
    static approximate(contour, precision, processCallback) {
        let maxLat;
        let minLat;
        let maxLon;
        let minLon;

        const polygon = [];

        contour.forEach((geohash) => {
            const coordinates = GeohashExtra.decodeToLatLng(geohash);
            polygon.push([coordinates.lat, coordinates.lon]);

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

        const allGeohashes = ngeohash.bboxes(minLat, minLon, maxLat, maxLon, precision);

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

        const neCoor = GeohashExtra.decodeToLatLng(neChild);
        const seCoor = GeohashExtra.decodeToLatLng(seChild);
        const nwCoor = GeohashExtra.decodeToLatLng(nwChild);
        const swCoor = GeohashExtra.decodeToLatLng(swChild);

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
            const coordinates = GeohashExtra.decodeToLatLng(geohash);
            polygon.push([coordinates.lat, coordinates.lon]);
        });

        return geohashes.filter((geohash) => {
            return GeohashContour.isGeohashInside(geohash, polygon);
        })
    }
};