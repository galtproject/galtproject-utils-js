/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const Utm = require('./utm');
const geolocationUtils = require('geolocation-utils');

module.exports = class LatLon {
  static shift(latitude, longitude, dx, dy) {
    const utmPoint = Utm.fromLatLon(latitude, longitude);
    utmPoint.x += dx;
    utmPoint.y += dy;

    const resultLatLon = Utm.toLatLon(utmPoint);

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

  // https://github.com/substack/point-in-polygon
  static isInside(point, polygon, excludeCollinear = false) {
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

      if(excludeCollinear) {

      }

      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }


  static pointOnSegment(point, sp1, sp2) {
    const POS_EPS = 0.0000001;
    // compare versus epsilon for floating point values, or != 0 if using integers
    if (MathUtils.abs((point[1] - sp1[1]) * (sp2[0] - sp1[0]) - (point[0] - sp1[0]) * (sp2[1] - sp1[1])) > POS_EPS) {
      return false;
    }

    let dotproduct = (point[0] - sp1[0]) * (sp2[0] - sp1[0]) + (point[1] - sp1[1]) * (sp2[1] - sp1[1]);
    if (dotproduct < 0) {
      return false;
    }

    let squaredlengthba = (sp2[0] - sp1[0]) * (sp2[0] - sp1[0]) + (sp2[1] - sp1[1]) * (sp2[1] - sp1[1]);
    if (dotproduct > squaredlengthba) {
      return false;
    }

    return true;
  }

  // https://stackoverflow.com/a/24392281/6053486
  static intersectsLines(point1Line1, point2Line1, point1Line2, point2Line2) {
    const a = point1Line1[0],
        b = point1Line1[1];

    const c = point2Line1[0],
        d = point2Line1[1];

    const p = point1Line2[0],
        q = point1Line2[1];

    const r = point2Line2[0],
        s = point2Line2[1];

    let det, gamma, lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) {
      return false;
    } else {
      lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
      gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
      return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
  };
};
