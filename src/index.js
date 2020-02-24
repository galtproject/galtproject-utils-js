/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const common = require("./common.js");
const geohash = require("./geohash.js");
const geohashContour = require("./geohashContour.js");
const geohashExtra = require("./geohashExtra.js");
const contractPoint = require("./contractPoint.js");

const utm = require("./utm.js");
const coordinates = require("./coordinates.js");

geohash.contour = geohashContour;
geohash.extra = geohashExtra;

const all = common;
all.geohash = geohash;
all.utm = utm;
all.coordinates = coordinates;
all.contractPoint = contractPoint;

module.exports = all;
