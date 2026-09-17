"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PADA_SPAN = exports.NAKSHATRA_SPAN = exports.NAKSHATRAS = exports.SIGN_LORDS = exports.SIGNS = void 0;
exports.normaliseDegrees = normaliseDegrees;
exports.angularSeparation = angularSeparation;
exports.toSign = toSign;
exports.toNakshatra = toNakshatra;
exports.lordOfSign = lordOfSign;
exports.houseOf = houseOf;
const ephemeris_port_1 = require("../ports/ephemeris.port");
function normaliseDegrees(value) {
    const wrapped = value % 360;
    return wrapped < 0 ? wrapped + 360 : wrapped;
}
function angularSeparation(a, b) {
    const diff = Math.abs(normaliseDegrees(a) - normaliseDegrees(b));
    return diff > 180 ? 360 - diff : diff;
}
exports.SIGNS = [
    'ARIES',
    'TAURUS',
    'GEMINI',
    'CANCER',
    'LEO',
    'VIRGO',
    'LIBRA',
    'SCORPIO',
    'SAGITTARIUS',
    'CAPRICORN',
    'AQUARIUS',
    'PISCES',
];
exports.SIGN_LORDS = [
    ephemeris_port_1.Graha.MARS,
    ephemeris_port_1.Graha.VENUS,
    ephemeris_port_1.Graha.MERCURY,
    ephemeris_port_1.Graha.MOON,
    ephemeris_port_1.Graha.SUN,
    ephemeris_port_1.Graha.MERCURY,
    ephemeris_port_1.Graha.VENUS,
    ephemeris_port_1.Graha.MARS,
    ephemeris_port_1.Graha.JUPITER,
    ephemeris_port_1.Graha.SATURN,
    ephemeris_port_1.Graha.SATURN,
    ephemeris_port_1.Graha.JUPITER,
];
exports.NAKSHATRAS = [
    'ASHWINI',
    'BHARANI',
    'KRITTIKA',
    'ROHINI',
    'MRIGASHIRA',
    'ARDRA',
    'PUNARVASU',
    'PUSHYA',
    'ASHLESHA',
    'MAGHA',
    'PURVA_PHALGUNI',
    'UTTARA_PHALGUNI',
    'HASTA',
    'CHITRA',
    'SWATI',
    'VISHAKHA',
    'ANURADHA',
    'JYESHTHA',
    'MULA',
    'PURVA_ASHADHA',
    'UTTARA_ASHADHA',
    'SHRAVANA',
    'DHANISHTA',
    'SHATABHISHA',
    'PURVA_BHADRAPADA',
    'UTTARA_BHADRAPADA',
    'REVATI',
];
exports.NAKSHATRA_SPAN = 360 / 27;
exports.PADA_SPAN = exports.NAKSHATRA_SPAN / 4;
function toSign(siderealLongitude) {
    const lon = normaliseDegrees(siderealLongitude);
    const index = Math.floor(lon / 30);
    return {
        signNumber: index + 1,
        sign: exports.SIGNS[index],
        degreesInSign: lon - index * 30,
    };
}
function toNakshatra(siderealLongitude) {
    const lon = normaliseDegrees(siderealLongitude);
    const index = Math.floor(lon / exports.NAKSHATRA_SPAN);
    const within = lon - index * exports.NAKSHATRA_SPAN;
    return {
        nakshatraNumber: index + 1,
        nakshatra: exports.NAKSHATRAS[index],
        pada: Math.min(4, Math.floor(within / exports.PADA_SPAN) + 1),
        fractionTraversed: within / exports.NAKSHATRA_SPAN,
    };
}
function lordOfSign(signNumber) {
    return exports.SIGN_LORDS[(signNumber - 1 + 12) % 12];
}
function houseOf(siderealLongitude, cuspLongitudes) {
    const lon = normaliseDegrees(siderealLongitude);
    for (let i = 0; i < 12; i++) {
        const start = normaliseDegrees(cuspLongitudes[i]);
        const end = normaliseDegrees(cuspLongitudes[(i + 1) % 12]);
        const inside = start <= end ? lon >= start && lon < end : lon >= start || lon < end;
        if (inside)
            return i + 1;
    }
    throw new Error(`Longitude ${lon} fell outside all twelve house cusps - the cusp set is malformed.`);
}
//# sourceMappingURL=zodiac.js.map