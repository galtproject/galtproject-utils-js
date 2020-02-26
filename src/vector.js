/*
 * Copyright ©️ 2018 Galt•Project Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2018 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const clone = require('lodash/clone');

module.exports = class Vector {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
  }

  rotate(radians) {
    let cx = 0,
        cy = 0,
        // radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (this.x - cx)) - (sin * (this.y - cy)) + cx,
        ny = (cos * (this.y - cy)) + (sin * (this.x - cx)) + cy;

    this.x = nx;
    this.y = ny;
  }

  applyToUtm(utmObj) {
    const newUtmObj = clone(utmObj);
    newUtmObj.x += this.x;
    newUtmObj.y += this.y;
    return newUtmObj;
  }
};
