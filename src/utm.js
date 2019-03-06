const common = require('./common');

module.exports = class Utm {
    static area(polygon) {
        let area = 0; // Accumulates area in the loop	
        let j = polygon.length - 1; // The last vertex is the 'previous' one to the first	

        let scaleSum = 0;
        for (let i = 0; i < polygon.length; i++) {
            area += (polygon[j].x + polygon[i].x) * (polygon[j].y - polygon[i].y);
            scaleSum += polygon[i].scale;
            j = i; // j is previous vertex to i	
        }

        area = area / ((scaleSum / polygon.length) ** 2);

        return area / 2;
    }
    
    static uncompress(compressedUtm) {
        const mgrsLatBands = 'CDEFGHJKLMNPQRSTUVWXX';
        
        let x = compressedUtm[0];
        let y = compressedUtm[1];

        let latBandNumber = Math.round(compressedUtm[2] / (10 ** 9));
        let latBand = mgrsLatBands[latBandNumber];
        let isNorth = Math.round(compressedUtm[2] / (10 ** 6) - latBandNumber * 10 ** 3);
        let zone = Math.round(compressedUtm[2] / (10 ** 3) - isNorth * 10 ** 3 - latBandNumber * 10 ** 6);
        let scale = compressedUtm[2] - (zone * 10 ** 3) - (isNorth * 10 ** 6) - (latBandNumber * 10 ** 9);
        return {
            x,
            y,
            h: isNorth ? 'N' : 'S',
            latBandNumber,
            latBand,
            zone,
            scale
        }
    }

    static toString(utm) {
        return `${utm.latBand}${utm.zone} ${common.roundToDecimal(utm.x, 6)}E ${common.roundToDecimal(utm.y, 6)}N`;
    }
};
