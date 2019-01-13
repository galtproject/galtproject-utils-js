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
};
