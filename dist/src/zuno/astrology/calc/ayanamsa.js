"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportedAyanamsas = supportedAyanamsas;
exports.findAnchor = findAnchor;
exports.precessionSinceJ2000 = precessionSinceJ2000;
exports.ayanamsaDegrees = ayanamsaDegrees;
exports.toSidereal = toSidereal;
const astronomia_1 = require("astronomia");
const zodiac_1 = require("./zodiac");
const DEG = 180 / Math.PI;
const JD_1900 = 2415020.0;
const ANCHORS = {
    LAHIRI: {
        julianDay: JD_1900,
        degrees: 22 + 27 / 60 + 37.7 / 3600,
        source: 'Indian Calendar Reform Committee, 1900.0 epoch',
    },
};
function parseAnchorOverride() {
    const raw = process.env.ZUNO_AYANAMSA_ANCHOR?.trim();
    if (!raw)
        return {};
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object')
            return {};
        const result = {};
        for (const [key, value] of Object.entries(parsed)) {
            if (!value || typeof value !== 'object')
                continue;
            const julianDay = Number(value.julianDay);
            const degrees = Number(value.degrees);
            if (!Number.isFinite(julianDay) || !Number.isFinite(degrees))
                continue;
            if (degrees < -180 || degrees > 180)
                continue;
            result[key.trim().toUpperCase()] = {
                julianDay,
                degrees,
                source: String(value.source ?? 'ZUNO_AYANAMSA_ANCHOR'),
            };
        }
        return result;
    }
    catch {
        return {};
    }
}
function supportedAyanamsas() {
    return Object.keys({ ...ANCHORS, ...parseAnchorOverride() }).sort();
}
function findAnchor(system) {
    const key = (system ?? '').trim().toUpperCase();
    if (!key)
        return null;
    return parseAnchorOverride()[key] ?? ANCHORS[key] ?? null;
}
function precessionSinceJ2000(julianDay) {
    const from = new astronomia_1.coord.Ecliptic(0, 0);
    const to = astronomia_1.precess.eclipticPosition(from, 2000.0, astronomia_1.base.JDEToJulianYear(julianDay));
    const wrapped = (0, zodiac_1.normaliseDegrees)(to.lon * DEG);
    return wrapped > 180 ? wrapped - 360 : wrapped;
}
function ayanamsaDegrees(system, julianDay) {
    const anchor = findAnchor(system);
    if (!anchor) {
        throw new Error(`Unsupported ayanamsa "${system}". Supported: ${supportedAyanamsas().join(', ')}. ` +
            'Add an explicit anchor via ZUNO_AYANAMSA_ANCHOR rather than substituting another system.');
    }
    return (anchor.degrees +
        (precessionSinceJ2000(julianDay) - precessionSinceJ2000(anchor.julianDay)));
}
function toSidereal(tropicalLongitude, ayanamsa) {
    return (0, zodiac_1.normaliseDegrees)(tropicalLongitude - ayanamsa);
}
//# sourceMappingURL=ayanamsa.js.map