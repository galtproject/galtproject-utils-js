/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const vectorLib = require('./vector');
const clone = require('lodash/clone');

module.exports = class Coordinates {
  static polygonCenter(polygon) {
    const points = clone(polygon);

    points.sort((a, b) => a[1] - b[1]);
    // Get center y
    const cy = (points[0][1] + points[points.length - 1][1]) / 2;

    // Sort from right to left
    points.sort((a, b) => b[0] - a[0]);

    // Get center x
    const cx = (points[0][0] + points[points.length - 1][0]) / 2;

    // Center point
    return [cx, cy];
  }

  static getAngle(x1, y1, x2, y2, degree = false) {
    let angle = Math.atan2(y2 - y1, x2 - x1);
    return degree ? angle.toDegrees() : angle;
  }

  static polygonShift(polygon, dx, dy, angle = 0, scaleX = 1, scaleY = 1) {
    let firstPoint;
    return polygon.map((p, index) => {
      const shiftP = [p[0] + dx, p[1] + dy];
      if(!index) {
        firstPoint = shiftP;
        return shiftP;
      }
      const vector = new vectorLib({x: p[0] + dx, y: p[1] + dy}, {x: firstPoint[0], y: firstPoint[1]});
      vector.rotate(angle);
      if(scaleX !== 1 || scaleY !== 1) {
        vector.mul(scaleX, scaleY);
      }
      return [vector.x, vector.y];
    });
  }
};
