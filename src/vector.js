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
  constructor(data, cData = {x: 0, y: 0}) {
    this.x = data.x;
    this.y = data.y;

    this.cx = cData.x;
    this.cy = cData.y;
  }

  rotate(radians) {
    let cx = this.cx,
        cy = this.cy,
        // radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (this.x - cx)) - (sin * (this.y - cy)) + cx,
        ny = (cos * (this.y - cy)) + (sin * (this.x - cx)) + cy;

    this.x = nx;
    this.y = ny;
  }

  mul(scaleX, scaleY) {
    const diffX = this.x - this.cx;
    const diffY = this.y - this.cy;

    this.x = this.cx + diffX * scaleX;
    this.y = this.cy + diffY * scaleY;
  }

  applyToUtm(utmObj) {
    const newUtmObj = clone(utmObj);
    newUtmObj.x += this.x;
    newUtmObj.y += this.y;
    return newUtmObj;
  }
};
