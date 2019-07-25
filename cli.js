#!/usr/bin/env node
const Table = require('cli-table');
const utils = require('./src/common');
const latLon = require('./src/latLon');
const utm = require('./src/utm');
const ngeohash = require('ngeohash');


require('yargs')
  .scriptName("galtproject-geodesic")
  .usage('$0 <cmd> [args]')
  .command('geohash [geohash]', 'describe geohash string', (yargs) => {
    yargs.positional('geohash', {
      type: 'string',
      describe: 'geohash'
    })
  }, function (argv) {
    printGeohashConversionTable(argv.geohash);
  })
  .command('geohash5 [geohash5]', 'describe geohash number', (yargs) => {
    yargs.positional('geohash5', {
      type: 'string',
      describe: 'geohash5'
    })
  }, function (argv) {
    printGeohash5ConversionTable(argv.geohash5);
  })
  .command('latlon [lat] [lon]', 'describe latitude and latitude', (yargs) => {
    yargs.positional('lat', {
      type: 'string',
      describe: 'latitude'
    })
    .positional('lon', {
      type: 'string',
      describe: 'longitude'
    })
  }, function (argv) {
    printLatLonConversionTable(argv.lat, argv.lon);
  })
  .help()
  .argv;

function printGeohashConversionTable(geohash) {
  const table = new Table({
    head: ['Geohash', geohash],
    colWidths: [20, 40]
  });

  const {latitude, longitude} = ngeohash.decode(geohash);

  table.push(
    ['Geohash5', utils.geohashToNumber(geohash)],
    ['Lat/Lon', `${latitude} ${longitude}`],
    ['UTM', utm.toString(latLon.toUtm(latitude, longitude))]
  );

  console.log(table.toString());
}

function printGeohash5ConversionTable(geohash5) {
  const table = new Table({
    head: ['Geohash5', geohash5],
    colWidths: [20, 40]
  });

  const {latitude, longitude} = ngeohash.decode(utils.numberToGeohash(geohash5));

  table.push(
    ['Geohash', utils.numberToGeohash(geohash5)],
    ['Lat/Lon', `${latitude} ${longitude}`],
    ['UTM', utm.toString(latLon.toUtm(latitude, longitude))]
  );

  console.log(table.toString());
}

function printLatLonConversionTable(lat, lon) {
  const table = new Table({
    head: ['Lat/Lon', `${lat} ${lon}`],
    colWidths: [20, 40]
  });

  const geohash = ngeohash.encode(lat, lon, '12');

  table.push(
    ['Geohash', geohash],
    ['Geohash5', utils.geohashToNumber(geohash)],
    ['UTM', utm.toString(latLon.toUtm(parseInt(lat), parseInt(lon)))]
  );

  console.log(table.toString());
}
