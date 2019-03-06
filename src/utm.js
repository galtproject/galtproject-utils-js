module.exports = class LatLon {
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

        let latBandNumber = compressedUtm[2] / (10 ** 9);
        let latBand = mgrsLatBands[latBandNumber];
        let isNorth = compressedUtm[2] / (10 ** 6) - latBand * 10 ** 3;
        let zone = compressedUtm[2] / ( 10 ** 3) - isNorth * 10 ** 3 - latBand * 10 ** 6;
        let scale = compressedUtm[2] - (zone * 10 ** 3) - (isNorth * 10 ** 6) - (latBand * 10 ** 9);
        return {
            x,
            y,
            latBand,
            isNorth,
            zone,
            scale
        }
    }
};
