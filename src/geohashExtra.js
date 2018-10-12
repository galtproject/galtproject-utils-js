/**
 * Extra geohash operations, which requires some dependencies like ngeohash and lodash
 */
const ngeohash = require('ngeohash');
const _ = require('lodash');
const Geohash = require('./geohash');

module.exports = class GeohashContour {
    static decodeToLatLng(geohash) {
        const {latitude, longitude} = ngeohash.decode(geohash);
        return {lat: latitude, lon: longitude};
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