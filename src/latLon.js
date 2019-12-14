/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const rEarth = 6378;
const Utm = require('./utm');
const geolib = require('geolib');
const mtLatlon = require('mt-latlon');
const geolocationUtils = require('geolocation-utils');

Number.prototype.toRad = function() {
  return this * Math.PI / 180;
}

Number.prototype.toDeg = function() {
  return this * 180 / Math.PI;
}

module.exports = class LatLon {
  static shift(latitude, longitude, dx, dy) {
    const utmPoint = Utm.fromLatLon(latitude, longitude);
    utmPoint.x += dx;
    utmPoint.y += dy;

    const resultLatLon = Utm.toLatLon(utmPoint);

    // https://www.gislounge.com/how-to-calculate-the-boundaries-of-an-utm-zone/
    const zoneDegreeEast = (utmPoint.zone * 6) - 180;
    const zoneDegreeWest = zoneDegreeEast - 6;

    // console.log('resultLatLon', resultLatLon);
    // console.log('zoneDegree', zoneDegreeEast, zoneDegreeWest);
    let isResultUtmValid = resultLatLon.lon < zoneDegreeEast && resultLatLon.lon > zoneDegreeWest;
    if(isResultUtmValid) {
      return resultLatLon;
    }
    console.log('utm invalid');
    const angle = Math.atan2(dy, dx);   //radians
    let brng = 180*angle/Math.PI;  //degrees

    let dist = Math.sqrt(dx * dx + dy * dy) / 1000;

    // 25.010148443969
    return geolocationUtils.moveTo({lat: latitude, lon: longitude}, {heading: brng, distance: dist * 1000});

    // 25.066212200798
    // const point = new mtLatlon(latitude, longitude);
    // const result = point.destinationPoint(brng,dist);
    // console.log('result', result);
    // return {
    //   lat: result._lat,
    //   lon: result._lon
    // }
    // 25.066212200798
    // const result = geolib.computeDestinationPoint({ latitude, longitude }, dist * 1000, brng);
    // console.log('result', result);
    // return {
    //   lat: result.latitude,
    //   lon: result.longitude
    // }
    // 25.011218773603
    // return {
    //   lat: latitude  + ((dy / 1000) / rEarth) * (180 / Math.PI),
    //   lon: longitude + ((dx / 1000) / rEarth) * (180 / Math.PI) / Math.cos(latitude * Math.PI/180)
    // };
  }

  static area(contour) {
    return Math.abs(Utm.area(contour.map((coors) => {
      return Utm.fromLatLon(coors.lat, coors.lon);
    })));
  }
};
