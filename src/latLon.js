module.exports = class LatLon {
    static toUtm(_lat, _lon) {
        if (!(_lat >= -80 && _lat <= 84)) throw new Error('Outside UTM limits');

        const falseEasting = 500e3;

        const falseNorthing = 10000e3;

        let zone = Math.floor((_lon + 180) / 6) + 1; // longitudinal zone
        let λ0 = ((zone - 1) * 6 - 180 + 3).toRadians(); // longitude of central meridian

        // ---- handle Norway/Svalbard exceptions
        // grid zones are 8° tall; 0°N is offset 10 into latitude bands array
        const latBand = Math.floor(_lat / 8 + 10);
        // adjust zone & central meridian for Norway
        if (zone === 31 && latBand === 17 && _lon >= 3) {
            zone++;
            λ0 += (6).toRadians();
        }
        // adjust zone & central meridian for Svalbard
        if (zone === 32 && (latBand === 19 || latBand === 20) && _lon < 9) {
            zone--;
            λ0 -= (6).toRadians();
        }
        if (zone === 32 && (latBand === 19 || latBand === 20) && _lon >= 9) {
            zone++;
            λ0 += (6).toRadians();
        }
        if (zone === 34 && (latBand === 19 || latBand === 20) && _lon < 21) {
            zone--;
            λ0 -= (6).toRadians();
        }
        if (zone === 34 && (latBand === 19 || latBand === 20) && _lon >= 21) {
            zone++;
            λ0 += (6).toRadians();
        }
        if (zone === 36 && (latBand === 19 || latBand === 20) && _lon < 33) {
            zone--;
            λ0 -= (6).toRadians();
        }
        if (zone === 36 && (latBand === 19 || latBand === 20) && _lon >= 33) {
            zone++;
            λ0 += (6).toRadians();
        }

        const φ = _lat.toRadians(); // latitude ± from equator

        const λ = _lon.toRadians() - λ0; // longitude ± from central meridian

        const a = 6378137;

        const f = 1 / 298.257223563;
        // WGS 84: a = 6378137, b = 6356752.314245, f = 1/298.257223563;

        const k0 = 0.9996; // UTM scale on the central meridian

        // ---- easting, northing: Karney 2011 Eq 7-14, 29, 35:

        const e = Math.sqrt(f * (2 - f)); // eccentricity
        // console.log('e', web3.utils.toWei(e.toString(), 'ether'));

        const cosλ = Math.cos(λ);

        const sinλ = Math.sin(λ);

        const tanλ = Math.tan(λ);

        const τ = Math.tan(φ); // τ ≡ tanφ, τʹ ≡ tanφʹ; prime (ʹ) indicates angles on the conformal sphere
        const σ = Math.sinh(e * Math.atanh((e * τ) / Math.sqrt(1 + τ * τ)));
        const τʹ = τ * Math.sqrt(1 + σ * σ) - σ * Math.sqrt(1 + τ * τ);

        const ξʹ = Math.atan2(τʹ, cosλ);
        const ηʹ = Math.asinh(sinλ / Math.sqrt(τʹ * τʹ + cosλ * cosλ));

        const A = 6367449.145823415; // 2πA is the circumference of a meridian

        const α = [
            null,
            837731820624470 / 10 ** 18,
            760852777357 / 10 ** 18,
            1197645503 / 10 ** 18,
            2429171 / 10 ** 18,
            5712 / 10 ** 18,
            15 / 10 ** 18
        ];

        let ξ = ξʹ;
        for (let j = 1; j <= 6; j++) {
            ξ += α[j] * Math.sin(2 * j * ξʹ) * Math.cosh(2 * j * ηʹ);
        }

        let η = ηʹ;
        for (let j = 1; j <= 6; j++) η += α[j] * Math.cos(2 * j * ξʹ) * Math.sinh(2 * j * ηʹ);

        let x = k0 * A * η;
        let y = k0 * A * ξ;

        // ---- convergence: Karney 2011 Eq 23, 24

        let pʹ = 1;
        for (let j = 1; j <= 6; j++) pʹ += 2 * j * α[j] * Math.cos(2 * j * ξʹ) * Math.cosh(2 * j * ηʹ);
        let qʹ = 0;
        for (let j = 1; j <= 6; j++) qʹ += 2 * j * α[j] * Math.sin(2 * j * ξʹ) * Math.sinh(2 * j * ηʹ);

        const γʹ = Math.atan((τʹ / Math.sqrt(1 + τʹ * τʹ)) * tanλ);
        const γʺ = Math.atan2(qʹ, pʹ);

        const γ = γʹ + γʺ;

        // ---- scale: Karney 2011 Eq 25

        const sinφ = Math.sin(φ);
        const kʹ = (Math.sqrt(1 - e * e * sinφ ** 2) * Math.sqrt(1 + τ * τ)) / Math.sqrt(τʹ * τʹ + cosλ * cosλ);
        const kʺ = (A / a) * Math.sqrt(pʹ * pʹ + qʹ * qʹ);

        const k = k0 * kʹ * kʺ;

        // ------------

        // shift x/y to false origins
        x += falseEasting; // make x relative to false easting
        if (y < 0) y += falseNorthing; // make y in southern hemisphere relative to false northing

        // round to reasonable precision
        x = Number(x.toFixed(6)); // nm precision
        y = Number(y.toFixed(6)); // nm precision
        const convergence = Number(γ.toDegrees().toFixed(9));
        const scale = Number(k.toFixed(12));

        const h = _lat >= 0 ? 'N' : 'S'; // hemisphere

        return {
            zone,
            h,
            x,
            y,
            convergence,
            scale
        };
    }
};

if (typeof Number.prototype.toRadians === 'undefined') {
    Number.prototype.toRadians = function() {
        return (this * Math.PI) / 180;
    };
}

if (typeof Number.prototype.toDegrees === 'undefined') {
    Number.prototype.toDegrees = function() {
        return this * (180 / Math.PI);
    };
}
