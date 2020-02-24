/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const common = require('./common');
const BN = require("bn.js");
const web3Utils = require('web3-utils');
const uniq = require('lodash/uniq');

module.exports = class Utm {
  static area(polygon) {
    function toBN(number) {
      return new BN(web3Utils.toWei(number.toString(), 'ether').toString(10));
    }
    let area = toBN(0); // Accumulates area in the loop
    let j = polygon.length - 1; // The last vertex is the 'previous' one to the first

    let scales = [];
    const zones = [];
    let scaleSum = toBN(0);
    for (let i = 0; i < polygon.length; i++) {
      const ixBn = toBN(polygon[i].x);
      const iyBn = toBN(polygon[i].y);

      const jxBn = toBN(polygon[j].x);
      const jyBn = toBN(polygon[j].y);

      area = area.add(jxBn.add(ixBn).mul(jyBn.sub(iyBn)));
      scales.push(polygon[i].scale);
      zones.push(polygon[i].zone);
      scaleSum = scaleSum.add(toBN(polygon[i].scale));
      j = i; // j is previous vertex to i
    }

    scales = scales.map(s => Math.round(s * 10 ** 5));

    if(uniq(scales).length === 1) {
      // the same scales, no need to apply it
      area = area.div(toBN(1));
    } else {
      const scaleSumDivLength = (scaleSum.mul(toBN(10 ** 18)).div(toBN(polygon.length))).div(toBN(1));

      area = area.mul(toBN(1)).div(scaleSumDivLength.pow(new BN('2')));
    }

    return parseFloat((area / 10 ** 18).toString(10)) / 2;
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

  static fromLatLon(_lat, _lon) {
    if (!(_lat >= -80 && _lat <= 84)) throw new Error('Outside UTM limits');

    const falseEasting = 500e3;

    const falseNorthing = 10000e3;

    let zone = Math.floor((_lon + 180) / 6) + 1; // longitudinal zone
    let λ0 = ((zone - 1) * 6 - 180 + 3).toRadians(); // longitude of central meridian

    // ---- handle Norway/Svalbard exceptions
    // grid zones are 8° tall; 0°N is offset 10 into latitude bands array
    const latBandNumber = Math.floor(_lat / 8 + 10);
    const mgrsLatBands = 'CDEFGHJKLMNPQRSTUVWXX'; // X is repeated for 80-84°N
    const latBand = mgrsLatBands.charAt(latBandNumber);
    // adjust zone & central meridian for Norway
    if (zone === 31 && latBandNumber === 17 && _lon >= 3) {
      zone++;
      λ0 += (6).toRadians();
    }
    // adjust zone & central meridian for Svalbard
    if (zone === 32 && (latBandNumber === 19 || latBandNumber === 20) && _lon < 9) {
      zone--;
      λ0 -= (6).toRadians();
    }
    if (zone === 32 && (latBandNumber === 19 || latBandNumber === 20) && _lon >= 9) {
      zone++;
      λ0 += (6).toRadians();
    }
    if (zone === 34 && (latBandNumber === 19 || latBandNumber === 20) && _lon < 21) {
      zone--;
      λ0 -= (6).toRadians();
    }
    if (zone === 34 && (latBandNumber === 19 || latBandNumber === 20) && _lon >= 21) {
      zone++;
      λ0 += (6).toRadians();
    }
    if (zone === 36 && (latBandNumber === 19 || latBandNumber === 20) && _lon < 33) {
      zone--;
      λ0 -= (6).toRadians();
    }
    if (zone === 36 && (latBandNumber === 19 || latBandNumber === 20) && _lon >= 33) {
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
      scale,
      latBand,
      latBandNumber
    };
  }

  static toLatLon(utmObj) {
    const {zone: z, h} = utmObj;

    const falseEasting = 500e3, falseNorthing = 10000e3;

    const a = 6378137;
    const f = 1 / 298.257223563;
    // const { a, f } = this.datum.ellipsoid; // WGS-84: a = 6378137, f = 1/298.257223563;

    const k0 = 0.9996; // UTM scale on the central meridian

    const x = utmObj.x - falseEasting;                            // make x ± relative to central meridian
    const y = h === 'S' ? utmObj.y - falseNorthing : utmObj.y; // make y ± relative to equator

    // ---- from Karney 2011 Eq 15-22, 36:

    const e = Math.sqrt(f * (2 - f)); // eccentricity
    const n = f / (2 - f);        // 3rd flattening
    const n2 = n * n, n3 = n * n2, n4 = n * n3, n5 = n * n4, n6 = n * n5;

    const A = a / (1 + n) * (1 + 1 / 4 * n2 + 1 / 64 * n4 + 1 / 256 * n6); // 2πA is the circumference of a meridian

    const η = x / (k0 * A);
    const ξ = y / (k0 * A);

    const β = [null, // note β is one-based array (6th order Krüger expressions)
      1 / 2 * n - 2 / 3 * n2 + 37 / 96 * n3 - 1 / 360 * n4 - 81 / 512 * n5 + 96199 / 604800 * n6,
      1 / 48 * n2 + 1 / 15 * n3 - 437 / 1440 * n4 + 46 / 105 * n5 - 1118711 / 3870720 * n6,
      17 / 480 * n3 - 37 / 840 * n4 - 209 / 4480 * n5 + 5569 / 90720 * n6,
      4397 / 161280 * n4 - 11 / 504 * n5 - 830251 / 7257600 * n6,
      4583 / 161280 * n5 - 108847 / 3991680 * n6,
      20648693 / 638668800 * n6];

    let ξʹ = ξ;
    for (let j = 1; j <= 6; j++) {
      ξʹ -= β[j] * Math.sin(2 * j * ξ) * Math.cosh(2 * j * η);
    }

    let ηʹ = η;
    for (let j = 1; j <= 6; j++) {
      ηʹ -= β[j] * Math.cos(2 * j * ξ) * Math.sinh(2 * j * η);
    }

    const sinhηʹ = Math.sinh(ηʹ);
    const sinξʹ = Math.sin(ξʹ), cosξʹ = Math.cos(ξʹ);

    const τʹ = sinξʹ / Math.sqrt(sinhηʹ * sinhηʹ + cosξʹ * cosξʹ);

    let δτi = null;
    let τi = τʹ;
    do {
      const σi = Math.sinh(e * Math.atanh(e * τi / Math.sqrt(1 + τi * τi)));
      const τiʹ = τi * Math.sqrt(1 + σi * σi) - σi * Math.sqrt(1 + τi * τi);
      δτi = (τʹ - τiʹ) / Math.sqrt(1 + τiʹ * τiʹ)
        * (1 + (1 - e * e) * τi * τi) / ((1 - e * e) * Math.sqrt(1 + τi * τi));
      τi += δτi;
    } while (Math.abs(δτi) > 1e-12); // using IEEE 754 δτi -> 0 after 2-3 iterations
    // note relatively large convergence test as δτi toggles on ±1.12e-16 for eg 31 N 400000 5000000
    const τ = τi;

    const φ = Math.atan(τ);

    let λ = Math.atan2(sinhηʹ, cosξʹ);

    // ---- convergence: Karney 2011 Eq 26, 27

    let p = 1;
    for (let j = 1; j <= 6; j++) {
      p -= 2 * j * β[j] * Math.cos(2 * j * ξ) * Math.cosh(2 * j * η);
    }
    let q = 0;
    for (let j = 1; j <= 6; j++) {
      q += 2 * j * β[j] * Math.sin(2 * j * ξ) * Math.sinh(2 * j * η);
    }

    const γʹ = Math.atan(Math.tan(ξʹ) * Math.tanh(ηʹ));
    const γʺ = Math.atan2(q, p);

    const γ = γʹ + γʺ;

    // ---- scale: Karney 2011 Eq 28

    const sinφ = Math.sin(φ);
    const kʹ = Math.sqrt(1 - e * e * sinφ * sinφ) * Math.sqrt(1 + τ * τ) * Math.sqrt(sinhηʹ * sinhηʹ + cosξʹ * cosξʹ);
    const kʺ = A / a / Math.sqrt(p * p + q * q);

    const k = k0 * kʹ * kʺ;

    // ------------

    const λ0 = ((z - 1) * 6 - 180 + 3).toRadians(); // longitude of central meridian
    λ += λ0; // move λ from zonal to global coordinates

    // round to reasonable precision
    const lat = Number(φ.toDegrees().toFixed(11)); // nm precision (1nm = 10^-11°)
    const lon = Number(λ.toDegrees().toFixed(11)); // (strictly lat rounding should be φ⋅cosφ!)
    const convergence = Number(γ.toDegrees().toFixed(9));
    const scale = Number(k.toFixed(12));

    return {
      lat,
      lon,
      convergence,
      scale
    };
  }
};


if (typeof Number.prototype.toRadians === 'undefined') {
  Number.prototype.toRadians = function () {
    return (this * Math.PI) / 180;
  };
}

if (typeof Number.prototype.toDegrees === 'undefined') {
  Number.prototype.toDegrees = function () {
    return this * (180 / Math.PI);
  };
}
