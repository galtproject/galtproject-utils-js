const common = require("./common.js");
const geohash = require("./geohash.js");
const geohashContour = require("./geohashContour.js");
const geohashExtra = require("./geohashExtra.js");
const contractPoint = require("./contractPoint.js");

const utm = require("./utm.js");
const latLon = require("./latLon.js");
const coordinates = require("./coordinates.js");

geohash.contour = geohashContour;
geohash.extra = geohashExtra;

const all = common;
all.geohash = geohash;
all.utm = utm;
all.latLon = latLon;
all.coordinates = coordinates;
all.contractPoint = contractPoint;

module.exports = all;
