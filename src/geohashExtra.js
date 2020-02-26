/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

/**
 * Extra geohash operations, which requires some dependencies like ngeohash and lodash
 */
const ngeohash = require('ngeohash');

const clone = require('lodash/clone');
const concat = require('lodash/concat');
const uniq = require('lodash/uniq');
const includes = require('lodash/includes');

const Geohash = require('./geohash');
const Utm = require('./utm');

module.exports = class GeohashExtra {
  static decodeToLatLon(geohash, arrayMode = false) {
    const {latitude, longitude} = ngeohash.decode(geohash);

    if (arrayMode) {
      return [latitude, longitude];
    } else {
      return {lat: latitude, lon: longitude};
    }
  }

  static encodeFromLatLng(lat, lng, precision) {
    if (!precision) {
      precision = 'auto';
    }
    return ngeohash.encode(lat, lng, precision);
  }

  static decodeToUtm(geohash) {
    const latLon = GeohashExtra.decodeToLatLon(geohash, true);
    return Utm.fromLatLon(latLon[0], latLon[1]);
  }

  static encodeFromUtm(utm, precision) {
    const latLon = Utm.toLatLon(utm);
    return GeohashExtra.encodeFromLatLng(latLon.lat, latLon.lon, precision);
  }

  static sortGeohashesByNeighbourDirection(existsGeohashesList, geohashesToAddList) {
    if (!geohashesToAddList.length) {
      return geohashesToAddList;
    }

    existsGeohashesList = clone(existsGeohashesList);
    let actualGeohashesToAdd = clone(geohashesToAddList);

    let preparedGeohashes = [];
    let i = 0;
    while (preparedGeohashes.length < geohashesToAddList.length) {
      const geohash = geohashesToAddList[i];
      i++;
      if (!geohash) {
        break;
      }
      if (includes(existsGeohashesList, geohash)) {
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
        preparedGeohashes = concat(additionalPreparedGeohashes, preparedGeohashes);
      }
    }

    return preparedGeohashes;
  }


  static sortGeohashesByFreeTwoDirections(geohashesToRemoveList) {
    if (!geohashesToRemoveList.length) {
      return geohashesToRemoveList;
    }

    geohashesToRemoveList = uniq(geohashesToRemoveList);

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
      if (precision > 13) {
        break;
      }
    } while (resultGeohashes.length < preferredGeohashes);

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
