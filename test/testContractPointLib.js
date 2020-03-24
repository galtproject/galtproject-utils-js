/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const contractPoint = require('../src/contractPoint');
const utmLib = require('../src/utm');
const commonLib = require('../src/common');
const coordinatesLib = require('../src/coordinates');
const latLonLib = require('../src/latLon');
const geohashExtra = require('../src/geohashExtra');
const assert = require('assert');

describe('contractPoint utils', () => {
  it('should convert latLon to contractPoint and vise versa', function () {
    const latLon = {lat: 10.1112223334, lon: 80.5556667778};
    const height = 11;
    const contractPointResult = contractPoint.encodeFromLatLngHeight(latLon.lat, latLon.lon, height);
    assert.equal(contractPointResult, '374310603614897501116278129316596581877122');
    assert.equal(contractPoint.isContractPoint(contractPointResult), true);
    const decoded = contractPoint.decodeToLatLonHeight(contractPointResult);
    assert.equal(latLon.lat, decoded.lat);
    assert.equal(latLon.lon, decoded.lon);
    assert.equal(height, decoded.height);

    const geohashFromContractPoint = contractPoint.decodeToGeohash(contractPointResult, 12);
    const geohashFromLatLon = geohashExtra.encodeFromLatLng(latLon.lat, latLon.lon, 12);
    assert.equal(geohashFromContractPoint, geohashFromLatLon);

    const contractPointFromGeohash = contractPoint.encodeFromGeohash(geohashFromContractPoint);
    const latLonFromGeohash = contractPoint.decodeToLatLon(contractPointFromGeohash);

    assert.equal(Math.round(latLonFromGeohash.lat * 10 ** 6) / 10 ** 6, Math.round(latLon.lat * 10 ** 6) / 10 ** 6);
    assert.equal(Math.round(latLonFromGeohash.lon * 10 ** 6) / 10 ** 6, Math.round(latLon.lon * 10 ** 6) / 10 ** 6);

    const utmFromLatLonResult = utmLib.fromLatLon(latLon.lat, latLon.lon);
    const utmFromContractPointResult = contractPoint.decodeToUtm(contractPointResult);
    assert.deepEqual(utmFromLatLonResult, utmFromContractPointResult);
    assert.equal(contractPoint.isContractPoint(utmFromContractPointResult), false);

    const contractPointWithoutHeight = contractPoint.encodeFromLatLng(latLon.lat, latLon.lon);
    assert.equal(contractPointWithoutHeight, '1865191306566061141651549275522');
    assert.equal(contractPoint.isContractPoint(contractPointWithoutHeight), true);
    const contourPointFromUtmResult = contractPoint.encodeFromUtm(utmFromContractPointResult);
    assert.equal(contourPointFromUtmResult, contractPointWithoutHeight);

    const latLonHeight = contractPoint.decodeToLatLonHeight(contractPointWithoutHeight);
    assert.equal(latLon.lat, latLonHeight.lat);
    assert.equal(latLon.lon, latLonHeight.lon);
    assert.equal(latLonHeight.height, 0);

    const anotherCPoint = '3504908379293184276105216900222897518066954';
    const anotherDecoded = contractPoint.decodeToLatLonHeight(anotherCPoint, true);
    assert.equal(anotherDecoded.lat,  40.7557149511);
    assert.equal(anotherDecoded.lon, -73.9653141238);

    const anotherEncoded = contractPoint.encodeFromLatLngHeight(anotherDecoded.lat, anotherDecoded.lon, anotherDecoded.height);
    assert.equal(anotherEncoded, anotherCPoint);
  });

  it('should convert negative latLon to contractPoint and vise versa', function () {
    [{lat: -38.0731887304, lon: 146.1784383491}, {lat: -38.0731887304, lon: -146.1784383491}, {lat: 38.0731887304, lon: -146.1784383491}].forEach(negativeLatLon => {
      const negativeContractPointWithoutHeight = contractPoint.encodeFromLatLng(negativeLatLon.lat, negativeLatLon.lon);

      assert.equal(contractPoint.isContractPoint(negativeContractPointWithoutHeight), true);

      const negativeLatLonHeight = contractPoint.decodeToLatLonHeight(negativeContractPointWithoutHeight);
      assert.equal(negativeLatLon.lat, negativeLatLonHeight.lat);
      assert.equal(negativeLatLon.lon, negativeLatLonHeight.lon);
      assert.equal(negativeLatLonHeight.height, 0);
    })
  });

  it('should shift correctly', function () {
    const baseContractPoint = '340282359897729907752972374757912920387';

    [{dx: 5, dy: 0}, {dx: 0, dy: 5}, {dx: 5, dy: 5}, {dx: -5, dy: 0}, {dx: 0, dy: -5}, {dx: -5, dy: -5}, {dx: 5, dy: -5}, {dx: -5, dy: 5}].forEach((shiftMeters) => {
      const resultContractPoint = contractPoint.shift(baseContractPoint, shiftMeters.dx, shiftMeters.dy);

      assert.equal(contractPoint.isContractPoint(resultContractPoint), true);

      const basePointUtm = contractPoint.decodeToUtm(baseContractPoint);
      const resultPointUtm = contractPoint.decodeToUtm(resultContractPoint);

      assert.equal(roundToDecimal(basePointUtm.x + shiftMeters.dx), roundToDecimal(resultPointUtm.x));
      assert.equal(roundToDecimal(basePointUtm.y + shiftMeters.dy), roundToDecimal(resultPointUtm.y));

      if(!shiftMeters.dx || !shiftMeters.dy) {
        const angle = contractPoint.getAngle(baseContractPoint, resultContractPoint);
        const resultPointUtmByAngle = contractPoint.decodeToUtm(contractPoint.shift(baseContractPoint, 5, 0, angle));
        assert.equal(roundToDecimal(resultPointUtmByAngle.x), roundToDecimal(resultPointUtm.x));
        assert.equal(roundToDecimal(resultPointUtmByAngle.y), roundToDecimal(resultPointUtm.y));
      }
    });

    function roundToDecimal(value, decimal = 4) {
      return Math.round(value * 10 ** decimal) / 10 ** decimal;
    }
  });

  it('should calculate area correctly', function () {
    const basePointLatLon = {lat: 50.111222333444, lon: 80.555666777888};

    [5, 50, 500].forEach((shiftMeters) => {
      const firstPoint = basePointLatLon;
      const secondPoint = latLonLib.shift(basePointLatLon.lat, basePointLatLon.lon, shiftMeters, 0);
      const thirdPoint = latLonLib.shift(basePointLatLon.lat, basePointLatLon.lon, 0, shiftMeters);
      const fourthPoint = latLonLib.shift(basePointLatLon.lat, basePointLatLon.lon, shiftMeters * -1, 0);

      const latLonPoints = [firstPoint, secondPoint, thirdPoint, fourthPoint];
      const latLonArea = Math.abs(latLonLib.area(latLonPoints));
      assert.equal(latLonArea, shiftMeters * shiftMeters);

      const contractPointArea = contractPoint.contourArea(latLonPoints.map(l => contractPoint.encodeFromLatLng(l.lat, l.lon)));
      assert.equal(latLonArea, contractPointArea);
    });
  });

  it('should check isContractPoint correctly', function () {
    ['dr72j3f7enwc'].forEach(geohash => {
      const geohash5 = commonLib.geohashToGeohash5(geohash);
      const geohash5z = commonLib.geohash5ToGeohash5z('0', geohash5);
      assert.equal(contractPoint.isContractPoint(geohash5z), false);
    });

    ['11215706813718168087817046853794346353862874'].forEach(cPoint => {
      assert.equal(contractPoint.isContractPoint(cPoint), true);
    });
  })

  it('should detect intersection correctly', function () {
    const firstCpointContour = [
        [40.7562988228, -73.9653340837],
        [40.7562193716, -73.9651486588],
        [40.7560675629, -73.9652563551],
        [40.756148433, -73.9654464625]
    ].map(latLon => contractPoint.encodeFromLatLng(latLon[0], latLon[1]));

    const secondCpointContour = [
      [40.7562442001, -73.9653200364],
      [40.7562080214, -73.9652011022],
      [40.7561129637, -73.9652666565],
      [40.7561690052, -73.9653912096]
    ].map(latLon => contractPoint.encodeFromLatLng(latLon[0], latLon[1]));

    assert.equal(contractPoint.intersects(secondCpointContour, firstCpointContour), true);
    assert.equal(contractPoint.intersects(firstCpointContour, secondCpointContour), true);

    assert.equal(contractPoint.contourInsideAnother(secondCpointContour, firstCpointContour), true);
    assert.equal(contractPoint.contourInsideAnother(firstCpointContour, secondCpointContour), false);

    const thirdCpointContour = [
      [40.7562708166, -73.9648513109],
      [40.7561975136, -73.9646732123],
      [40.7560142559, -73.9648018963],
      [40.7560914581, -73.9649830833]
    ].map(latLon => contractPoint.encodeFromLatLng(latLon[0], latLon[1]));

    assert.equal(contractPoint.contourInsideAnother(secondCpointContour, thirdCpointContour), false);
    assert.equal(contractPoint.contourInsideAnother(thirdCpointContour, secondCpointContour), false);

    assert.equal(contractPoint.intersects(secondCpointContour, thirdCpointContour), false);
    assert.equal(contractPoint.intersects(firstCpointContour, thirdCpointContour), false);

    const collinearContour1 = [
      '3504908379293184277775089960751380970484929',
      '3504908379293184267663027581401573803463709',
      '3504908379293184275610438330677859925195924',
      '3504908379293184272425294371702652776185295',
      '3504908379293184279042971574425585869879316',
      '3504908379293184291505241382486358460634246'
    ];
    const collinearContour2 = [
      '3504908379293184276105216900222897518066954',
      '3504908379293184272425294371702652776185295',
      '3504908379293184275610438330677859925195924',
      '3504908379293184265220051476743923045052113',
      '3504908379293184244717583796716105286622206',
      '3504908379293184247067791225427070709953585',
      '3504908379293184236739256304372281954668313',
      '3504908379293184244006351132210159812812507',
      '3504908379293184253809172293908300056543103',
      '3504908379293184256283083588377561732987908',
      '3504908379293184266518849833485665153149377',
      '3504908379293184267199165754924073416653579'
    ];
    assert.equal(contractPoint.contourInsideAnother(collinearContour1, collinearContour2, true), false);
    assert.equal(contractPoint.contourInsideAnother(collinearContour1, collinearContour2, false), false);
  });

  it('should shift contours correctly', function () {
    const xyContour = [[1,1], [1, 6], [6,6], [6,1]];
    const shiftXyContour = coordinatesLib.polygonShift(xyContour, 1, 1);
    assert.deepEqual(shiftXyContour, [ [ 2, 2 ], [ 2, 7 ], [ 7, 7 ], [ 7, 2 ] ]);
    const scaleShiftXyContour = coordinatesLib.polygonShift(xyContour, 1, 1, 0, 1.5, 2);
    assert.deepEqual(scaleShiftXyContour, [ [ 2, 2 ], [ 2, 12 ], [ 9.5, 12 ], [ 9.5, 2 ] ]);

    const contour = ["1541479122161945249910271880695790555702792","1541479122161945249208096567530036475396425","1541479122161945238956078740892994940597092","1541479122161945238772515190615511192922166","1541479122161945213581051187747388800371546","1541479122161945213764633184768946257598245","1541479122161945194213814584759730558206740","1541479122161945194067089182397444785122260","1541479122161945168895178728247454517303973","1541479122161945169041922577353813999940226","1541479122161945158902208528637516215387332","1541479122161945159554171804434632896202487","1541479122161945164924221918476294176703444","1541479122161945165071556063393012365017015","1541479122161945177642864575673482114950130","1541479122161945177502724660945510651759807","1541479122161945187296027302701616766515371","1541479122161945187436185664173661939257465","1541479122161945200048722649458872537051043","1541479122161945199901388504542154348759201","1541479122161945209600096242688277882827113","1541479122161945209747448834349069780670726","1541479122161945222388781187133340988541032","1541479122161945222236669335501532026360168","1541479122161945231970518121108072256258841","1541479122161945232120932872285099939690724","1541479122161945244778276998925351038359972","1541479122161945244544077136165534571492987"];
    const shiftContourByMeters = contractPoint.shiftContourMeters(contour, 5.5, 3.37, 0, 1.15, 1.15);
    assert.deepEqual(shiftContourByMeters, [ '10094016080221715730275674758395', '10094015272697047159566345466554', '10094003482866400817728040193931', '10094003271761861638195932024700', '10093974301593015735114148232776', '10093974512716001658719965953803', '10093952029270922299307169743245', '10093951860538554257085901651255', '10093922912837842635782351749897', '10093923081607104166151038945300', '10093911420922113084353304545759', '10093912170726919448425446839810', '10093918346272560212688008207361', '10093918515724351273783948842003', '10093932972714383001065193623794', '10093932811545180029064841656695', '10093944073854286095031099356565', '10093944235041935811105160875458', '10093958739458546551893662860493', '10093958570025202234871431802455', '10093969723535411754098754070232', '10093969892987202815194694680064', '10093984430515719168291841820594', '10093984255585245117304164357439', '10093995449512270902029114218495', '10093995622505836825277288761615', '10094010178444203763936568410605', '10094009909103293543703405782603' ])
    const shiftContourByLatLon = contractPoint.shiftContourLatLon(contour, 0.000031, 0.000085, 0, 1.054, 1.141);
    assert.deepEqual(shiftContourByLatLon, [ '1541479122161945255628762543545751557512792', '1541479122161945254888660724564450639359820', '1541479122161945244083037661531311751007589', '1541479122161945243889568209686245974179152', '1541479122161945217337767511846486407245635', '1541479122161945217531255410435625893625868', '1541479122161945196924692753599865136137486', '1541479122161945196770053698029957965475897', '1541479122161945170238858013320531967719557', '1541479122161945170393515515634512847932941', '1541479122161945159706265209322368152309974', '1541479122161945160393424872812122657333629', '1541479122161945166053457803692498089240303', '1541479122161945166208760942049058803789464', '1541479122161945179458909636242040053197307', '1541479122161945179311206556443847673905960', '1541479122161945189633340457305059214392908', '1541479122161945189781080430591399012787663', '1541479122161945203074689653822039965801322', '1541479122161945202919404962209552960828571', '1541479122161945213141834211352364374830121', '1541479122161945213297155796452998798906281', '1541479122161945226621109913684891964332998', '1541479122161945226460789260940282251745713', '1541479122161945236720259572183102445394794', '1541479122161945236878790890752562331474974', '1541479122161945250219642225555973446177673', '1541479122161945249972787896361592226965527' ])
  });
});
