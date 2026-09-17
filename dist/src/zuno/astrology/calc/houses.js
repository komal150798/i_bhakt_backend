"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseSystemUnavailableError = void 0;
exports.trueObliquity = trueObliquity;
exports.localSiderealDegrees = localSiderealDegrees;
exports.eclipticLongitudeAtRightAscension = eclipticLongitudeAtRightAscension;
exports.declinationOfEclipticLongitude = declinationOfEclipticLongitude;
exports.midheaven = midheaven;
exports.ascendant = ascendant;
exports.computeHouseCusps = computeHouseCusps;
exports.eclipticToHorizontal = eclipticToHorizontal;
const astronomia_1 = require("astronomia");
const zodiac_1 = require("./zodiac");
const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;
function trueObliquity(julianDay) {
    return ((astronomia_1.nutation.meanObliquity(julianDay) +
        astronomia_1.nutation.nutation(julianDay)[1]) *
        DEG);
}
function localSiderealDegrees(julianDay, longitudeEast) {
    const greenwichSeconds = astronomia_1.sidereal.apparent(julianDay);
    const greenwichDegrees = (greenwichSeconds / 86400) * 360;
    return (0, zodiac_1.normaliseDegrees)(greenwichDegrees + longitudeEast);
}
function eclipticLongitudeAtRightAscension(rightAscensionDeg, obliquityDeg) {
    const ra = rightAscensionDeg * RAD;
    const eps = obliquityDeg * RAD;
    return (0, zodiac_1.normaliseDegrees)(Math.atan2(Math.sin(ra), Math.cos(ra) * Math.cos(eps)) * DEG);
}
function declinationOfEclipticLongitude(longitudeDeg, obliquityDeg) {
    return (Math.asin(Math.sin(obliquityDeg * RAD) * Math.sin(longitudeDeg * RAD)) * DEG);
}
function midheaven(ramcDeg, obliquityDeg) {
    return eclipticLongitudeAtRightAscension(ramcDeg, obliquityDeg);
}
function ascendant(ramcDeg, latitudeDeg, obliquityDeg) {
    const theta = ramcDeg * RAD;
    const phi = latitudeDeg * RAD;
    const eps = obliquityDeg * RAD;
    return (0, zodiac_1.normaliseDegrees)(Math.atan2(Math.cos(theta), -(Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) * DEG);
}
const PLACIDUS_LATITUDE_LIMIT = 66.0;
class HouseSystemUnavailableError extends Error {
    constructor(system, reason) {
        super(`House system ${system} is unavailable: ${reason}`);
        this.system = system;
        this.reason = reason;
        this.name = 'HouseSystemUnavailableError';
    }
}
exports.HouseSystemUnavailableError = HouseSystemUnavailableError;
function computeHouseCusps(system, ramcDeg, latitudeDeg, obliquityDeg) {
    const asc = ascendant(ramcDeg, latitudeDeg, obliquityDeg);
    switch (system) {
        case 'WHOLE_SIGN': {
            const signStart = Math.floor((0, zodiac_1.normaliseDegrees)(asc) / 30) * 30;
            return Array.from({ length: 12 }, (_, i) => (0, zodiac_1.normaliseDegrees)(signStart + i * 30));
        }
        case 'EQUAL':
            return Array.from({ length: 12 }, (_, i) => (0, zodiac_1.normaliseDegrees)(asc + i * 30));
        case 'PLACIDUS':
            return placidusCusps(ramcDeg, latitudeDeg, obliquityDeg, asc);
        default:
            throw new HouseSystemUnavailableError(system, `unknown house system "${system}"`);
    }
}
function placidusCusps(ramcDeg, latitudeDeg, obliquityDeg, asc) {
    if (Math.abs(latitudeDeg) > PLACIDUS_LATITUDE_LIMIT) {
        throw new HouseSystemUnavailableError('PLACIDUS', `latitude ${latitudeDeg.toFixed(2)} is inside the polar circle, where the semi-arcs Placidus divides do not exist`);
    }
    const mc = midheaven(ramcDeg, obliquityDeg);
    const solve = (base, fraction) => {
        let ra = (0, zodiac_1.normaliseDegrees)(ramcDeg + base + fraction * 90);
        for (let i = 0; i < 24; i++) {
            const lon = eclipticLongitudeAtRightAscension(ra, obliquityDeg);
            const dec = declinationOfEclipticLongitude(lon, obliquityDeg);
            const cosSd = -Math.tan(latitudeDeg * RAD) * Math.tan(dec * RAD);
            if (cosSd <= -1 || cosSd >= 1) {
                throw new HouseSystemUnavailableError('PLACIDUS', 'a cusp fell on a circumpolar arc, which Placidus does not define');
            }
            const semiDiurnal = Math.acos(cosSd) * DEG;
            const next = (0, zodiac_1.normaliseDegrees)(ramcDeg + base + fraction * semiDiurnal);
            if (Math.abs(shortestDelta(next, ra)) < 1e-9) {
                ra = next;
                break;
            }
            ra = next;
        }
        return eclipticLongitudeAtRightAscension(ra, obliquityDeg);
    };
    const c11 = solve(0, 1 / 3);
    const c12 = solve(0, 2 / 3);
    const c2 = solve(60, 2 / 3);
    const c3 = solve(120, 1 / 3);
    const opposite = (deg) => (0, zodiac_1.normaliseDegrees)(deg + 180);
    return [
        asc,
        c2,
        c3,
        opposite(mc),
        opposite(c11),
        opposite(c12),
        opposite(asc),
        opposite(c2),
        opposite(c3),
        mc,
        c11,
        c12,
    ];
}
function shortestDelta(a, b) {
    let delta = ((0, zodiac_1.normaliseDegrees)(a) - (0, zodiac_1.normaliseDegrees)(b)) % 360;
    if (delta > 180)
        delta -= 360;
    if (delta < -180)
        delta += 360;
    return delta;
}
function eclipticToHorizontal(longitudeDeg, ramcDeg, latitudeDeg, obliquityDeg) {
    const lon = longitudeDeg * RAD;
    const eps = obliquityDeg * RAD;
    const phi = latitudeDeg * RAD;
    const ra = Math.atan2(Math.sin(lon) * Math.cos(eps), Math.cos(lon));
    const dec = Math.asin(Math.sin(eps) * Math.sin(lon));
    const hourAngle = ramcDeg * RAD - ra;
    const altitude = Math.asin(Math.sin(phi) * Math.sin(dec) +
        Math.cos(phi) * Math.cos(dec) * Math.cos(hourAngle));
    const azimuth = Math.atan2(-Math.cos(dec) * Math.sin(hourAngle), Math.sin(dec) * Math.cos(phi) - Math.cos(dec) * Math.sin(phi) * Math.cos(hourAngle));
    return {
        altitude: altitude * DEG,
        azimuth: (0, zodiac_1.normaliseDegrees)(azimuth * DEG),
    };
}
//# sourceMappingURL=houses.js.map