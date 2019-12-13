const common = require("./common.js");
const geohash = require("./geohash.js");
const geohashContour = require("./geohashContour.js");
const geohashExtra = require("./geohashExtra.js");
const geohashPseudo = require("./geohashPseudo.js");

const utm = require("./utm.js");
const coordinates = require("./coordinates.js");

geohash.contour = geohashContour;
geohash.extra = geohashExtra;
geohash.pseudo = geohashPseudo;

const all = common;
all.geohash = geohash;
all.utm = utm;
all.coordinates = coordinates;

module.exports = all;
