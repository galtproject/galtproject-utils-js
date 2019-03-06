const utmUtils = require('../src/utm');
const latLonUtils = require('../src/latLon');
const assert = require('assert');

describe('utm utils', () => {
    it('should correctly calculate utm area', function () {
        const latLonContour = [
            [1.2291728239506483, 104.51007032766938],
            [1.2037726398557425, 104.50989866629243],
            [1.2036009784787893, 104.53199403360486],
            [1.227113390341401, 104.53336732462049]
        ];
        
        const utmContor = latLonContour.map((latLon) => {
            return latLonUtils.toUtm(latLon[0], latLon[1]);
        });

        assert.equal(utmUtils.area(utmContor), -6841437.324010707);
    });
    
    it('should correctly uncompress', function() {
        const result = utmUtils.uncompress([443413.9761,136017.8858,10001048000.9997]);
        assert.equal(result.x, 443413.9761);
        assert.equal(result.y, 136017.8858);
        assert.equal(result.h, 'N');
        assert.equal(result.latBandNumber, 10);
        assert.equal(result.latBand, 'N');
        assert.equal(result.zone, 48);
        assert.equal(result.scale - 0.9997 < 0.00001, true);
    })
});
