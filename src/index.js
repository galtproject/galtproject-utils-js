const common = require("./common.js");
const geohash = require("./geohash.js");
const latLon = require("./latLon.js");
const geohashContour = require("./geohashContour.js");
const geohashExtra = require("./geohashExtra.js");
const contractPoint = require("./contractPoint.js");

const utm = require("./utm.js");
const coordinates = require("./coordinates.js");

geohash.contour = geohashContour;
geohash.extra = geohashExtra;

const all = common;
all.geohash = geohash;
all.latLon = latLon;
all.utm = utm;
all.coordinates = coordinates;
all.contractPoint = contractPoint;

module.exports = all;
