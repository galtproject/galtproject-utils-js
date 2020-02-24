/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const Utm = require('./utm');
const Vector = require('./vector');
const geolocationUtils = require('geolocation-utils');

module.exports = class LatLon {
  static shift(latitude, longitude, dx, dy, dangle = 0) {
    const utmPoint = Utm.fromLatLon(latitude, longitude);

    const vector = new Vector({
      x: dx,
      y: dy
    });

    vector.rotate(dangle);

    const resultLatLon = Utm.toLatLon(vector.applyToUtm(utmPoint));

    // https://www.gislounge.com/how-to-calculate-the-boundaries-of-an-utm-zone/
    const zoneDegreeEast = (utmPoint.zone * 6) - 180;
    const zoneDegreeWest = zoneDegreeEast - 6;

    let isResultUtmValid = resultLatLon.lon < zoneDegreeEast && resultLatLon.lon > zoneDegreeWest;
    if(isResultUtmValid) {
      return resultLatLon;
    }
    console.log('utm invalid');
    const angle = Math.atan2(dy, dx);   //radians
    let brng = 180*angle/Math.PI;  //degrees

    brng += dangle;

    let dist = Math.sqrt(dx * dx + dy * dy) / 1000;

    // 25.010148443969
    return geolocationUtils.moveTo({lat: latitude, lon: longitude}, {heading: brng, distance: dist * 1000});
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
