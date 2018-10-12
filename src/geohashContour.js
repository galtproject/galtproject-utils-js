const ngeohash = require('ngeohash');
const _ = require('lodash');
const Geohash = require('./geohash');
const geojsonArea = require('@mapbox/geojson-area');

module.exports = class GeohashContour {
    static decodeToLatLng(geohash) {
        const {latitude, longitude} = ngeohash.decode(geohash);
        return {lat: latitude, lon: longitude};
    }

    static geohashesPolygonArea(contour){
        return geojsonArea.ring(contour.map((geohash) => {
            const coors = GeohashContour.decodeToLatLng(geohash);
            return [coors.lat, coors.lon];
        }));
    }
    
    static approximate(contour, numberOfChars, processCallback) {
        let maxLat;
        let minLat;
        let maxLon;
        let minLon;

        const polygon = [];

        contour.forEach((geohash) => {
            const coordinates = GeohashContour.decodeToLatLng(geohash);
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

        const allGeohashes = ngeohash.bboxes(minLat, minLon, maxLat, maxLon, numberOfChars);

        const geohashesInside = [];
        const parentsToChildren = {};
        const parentsForMerge = [];

        allGeohashes.forEach((geohash, index) => {

            if (Geohash.isGeohashInsidePolygon(geohash, polygon)) {

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

    static isGeohashInsidePolygon(geohash, polygon) {
        const neChild = Geohash.getChildByDirection(Geohash.getChildByDirection(geohash, 'ne'), 'ne');
        const seChild = Geohash.getChildByDirection(Geohash.getChildByDirection(geohash, 'se'), 'se');
        const nwChild = Geohash.getChildByDirection(Geohash.getChildByDirection(geohash, 'nw'), 'nw');
        const swChild = Geohash.getChildByDirection(Geohash.getChildByDirection(geohash, 'sw'), 'sw');

        const neCoor = GeohashContour.decodeToLatLng(neChild);
        const seCoor = GeohashContour.decodeToLatLng(seChild);
        const nwCoor = GeohashContour.decodeToLatLng(nwChild);
        const swCoor = GeohashContour.decodeToLatLng(swChild);

        return Geohash.isInside([neCoor.lat, neCoor.lon], polygon)
            && Geohash.isInside([seCoor.lat, seCoor.lon], polygon)
            && Geohash.isInside([nwCoor.lat, nwCoor.lon], polygon)
            && Geohash.isInside([swCoor.lat, swCoor.lon], polygon);
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

    static filterByInsideContour(geohashes, contour) {
        const polygon = [];

        contour.forEach((geohash) => {
            const coordinates = GeohashContour.decodeToLatLng(geohash);
            polygon.push([coordinates.lat, coordinates.lon]);
        });

        return geohashes.filter((geohash) => {
            return Geohash.isGeohashInsidePolygon(geohash, polygon);
        })
    }

    static sortGeohashesByNeighbourDirection(existsGeohashesList, geohashesToAddList) {
        if (!geohashesToAddList.length) {
            return geohashesToAddList;
        }

        existsGeohashesList = _.clone(existsGeohashesList);
        let actualGeohashesToAdd = _.clone(geohashesToAddList);

        let preparedGeohashes = [];
        let i = 0;
        while (preparedGeohashes.length < geohashesToAddList.length) {
            const geohash = geohashesToAddList[i];
            i++;
            if (!geohash) {
                break;
            }
            if (_.includes(existsGeohashesList, geohash)) {
                actualGeohashesToAdd.splice(actualGeohashesToAdd.indexOf(geohash), 1);
                continue;
            }
            const neighbour = Geohash.getNeighbourWithDirection(geohash, existsGeohashesList);
            if (!neighbour.geohash) {
                continue;
            }
            preparedGeohashes.push({
                geohash: geohash,
                neighbour: neighbour.geohash,
                direction: neighbour.direction
            });
            existsGeohashesList.push(geohash);
            actualGeohashesToAdd.splice(actualGeohashesToAdd.indexOf(geohash), 1);
        }

        if (preparedGeohashes.length > 0 && actualGeohashesToAdd.length > 0) {
            const additionalPreparedGeohashes = Geohash.sortGeohashesByNeighbourDirection(existsGeohashesList, actualGeohashesToAdd);
            if (additionalPreparedGeohashes.length) {
                preparedGeohashes = _.concat(additionalPreparedGeohashes, preparedGeohashes);
            }
        }

        return preparedGeohashes;
    }


    static sortGeohashesByFreeTwoDirections(geohashesToRemoveList) {
        if (!geohashesToRemoveList.length) {
            return geohashesToRemoveList;
        }

        geohashesToRemoveList = _.uniq(geohashesToRemoveList);

        let preparedGeohashes = [];
        let i = 0;
        while (preparedGeohashes.length < geohashesToRemoveList.length) {
            const geohash = geohashesToRemoveList[i];
            i++;
            if (!geohash) {
                break;
            }

            // TODO: add algorithm for get geohashes in order without neighbour in two directions

            preparedGeohashes.push({
                geohash: geohash,
                direction1: 'e',
                direction2: 's'
            });
        }

        return preparedGeohashes;
    }
};