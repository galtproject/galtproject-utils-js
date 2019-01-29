/**
 * Extra geohash operations, which requires some dependencies like ngeohash and lodash
 */
const ngeohash = require('ngeohash');
const _ = require('lodash');
const Geohash = require('./geohash');

module.exports = class GeohashContour {
    static decodeToLatLon(geohash, arrayMode = false) {
        const {latitude, longitude} = ngeohash.decode(geohash);
        
        if(arrayMode) {
            return [latitude, longitude];
        } else {
            return {lat: latitude, lon: longitude};
        }
    }
    static encodeFromLatLng(lat, lng, precision) {
        if(!precision) {
            precision = 'auto';
        }
        return ngeohash.encode(lat, lng, precision);
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

    static autoBboxes(leftBoundGeohash, rightBoundGeohash, preferredGeohashes = 10, startPrecision = 1) {
        let leftBoundPoint = this.decodeToLatLon(leftBoundGeohash);
        let rightBoundPoint = this.decodeToLatLon(rightBoundGeohash);

        let minLat = Math.min(leftBoundPoint.lat, rightBoundPoint.lat);
        let minLon = Math.min(leftBoundPoint.lon, rightBoundPoint.lon);

        let maxLat = Math.max(leftBoundPoint.lat, rightBoundPoint.lat);
        let maxLon = Math.max(leftBoundPoint.lon, rightBoundPoint.lon);

        let resultGeohashes;
        let precision = startPrecision;

        do {
            resultGeohashes = ngeohash.bboxes(minLat, minLon, maxLat, maxLon, precision);
            precision++;
            if(precision > 13) {
                break;
            }
        } while(resultGeohashes.length < preferredGeohashes);

        const parentsToChildren = {};
        const parentsForMerge = [];

        resultGeohashes.forEach((geohash) => {
            const parent = Geohash.getParent(geohash);
            if (!parentsToChildren[parent]) {
                parentsToChildren[parent] = [];
            }
            parentsToChildren[parent].push(geohash);

            if (parentsToChildren[parent].length === 32) {
                parentsForMerge.push(parent);
            }
        });

        for (let i = 0; i < parentsForMerge.length; i++) {
            const geohashParent = parentsForMerge[i];

            parentsToChildren[geohashParent].forEach((geohash) => {
                resultGeohashes.splice(resultGeohashes.indexOf(geohash), 1);
            });
            resultGeohashes.push(geohashParent);

            const parentOfParent = Geohash.getParent(geohashParent);
            if (!parentsToChildren[parentOfParent]) {
                parentsToChildren[parentOfParent] = [];
            }
            parentsToChildren[parentOfParent].push(geohashParent);

            if (parentsToChildren[parentOfParent].length === 32) {
                parentsForMerge.push(parentOfParent);
            }
        }

        return resultGeohashes;
    }
};
