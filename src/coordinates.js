/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const common = require('./common');
const _ = require('lodash');

module.exports = class Utm {
  static polygonCenter(polygon) {
    const points = _.clone(polygon);

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
};
