const common = require("./common.js");
const geohash = require("./geohash.js");
const geohashContour = require("./geohashContour.js");
const geohashExtra = require("./geohashExtra.js");

const utm = require("./utm.js");

geohash.contour = geohashContour;
geohash.extra = geohashExtra;

const all = common;
all.geohash = geohash;
all.utm = utm;

module.exports = all;
