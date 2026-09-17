"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const houses_1 = require("./houses");
const zodiac_1 = require("./zodiac");
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
function rightAscensionOf(longitudeDeg, obliquityDeg) {
    const lon = longitudeDeg * RAD;
    const eps = obliquityDeg * RAD;
    return (0, zodiac_1.normaliseDegrees)(Math.atan2(Math.sin(lon) * Math.cos(eps), Math.cos(lon)) * DEG);
}
describe('house and angle geometry', () => {
    const JD_2024_06_15_1200_UT = 2460477.0;
    describe('ascendant', () => {
        const cases = [
            { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
            { name: 'London', lat: 51.5074, lon: -0.1278 },
            { name: 'New York', lat: 40.7128, lon: -74.006 },
            { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
            { name: 'Quito (equator)', lat: -0.1807, lon: -78.4678 },
        ];
        it.each(cases)('puts the rising point on the eastern horizon at $name', ({ lat, lon }) => {
            for (let hour = 0; hour < 24; hour += 1) {
                const jd = JD_2024_06_15_1200_UT + hour / 24;
                const eps = (0, houses_1.trueObliquity)(jd);
                const ramc = (0, houses_1.localSiderealDegrees)(jd, lon);
                const asc = (0, houses_1.ascendant)(ramc, lat, eps);
                const { altitude, azimuth } = (0, houses_1.eclipticToHorizontal)(asc, ramc, lat, eps);
                expect(Math.abs(altitude)).toBeLessThan(1e-6);
                expect(azimuth).toBeGreaterThan(0);
                expect(azimuth).toBeLessThan(180);
            }
        });
        it('advances through all twelve signs across one day', () => {
            const seen = new Set();
            for (let minute = 0; minute < 1440; minute += 10) {
                const jd = JD_2024_06_15_1200_UT + minute / 1440;
                const eps = (0, houses_1.trueObliquity)(jd);
                const ramc = (0, houses_1.localSiderealDegrees)(jd, 72.8777);
                seen.add(Math.floor((0, houses_1.ascendant)(ramc, 19.076, eps) / 30));
            }
            expect(seen.size).toBe(12);
        });
    });
    describe('midheaven', () => {
        it('sits exactly on the meridian', () => {
            for (let hour = 0; hour < 24; hour += 3) {
                const jd = JD_2024_06_15_1200_UT + hour / 24;
                const eps = (0, houses_1.trueObliquity)(jd);
                const ramc = (0, houses_1.localSiderealDegrees)(jd, 72.8777);
                const mc = (0, houses_1.midheaven)(ramc, eps);
                const { azimuth } = (0, houses_1.eclipticToHorizontal)(mc, ramc, 19.076, eps);
                const onMeridian = Math.abs(azimuth - 180) < 1e-6 ||
                    Math.abs(azimuth) < 1e-6 ||
                    Math.abs(azimuth - 360) < 1e-6;
                expect(onMeridian).toBe(true);
            }
        });
        it('is 90 degrees of right ascension from the ascendant at the equator', () => {
            const jd = JD_2024_06_15_1200_UT;
            const eps = (0, houses_1.trueObliquity)(jd);
            const ramc = (0, houses_1.localSiderealDegrees)(jd, 0);
            const ascRa = rightAscensionOf((0, houses_1.ascendant)(ramc, 0, eps), eps);
            const mcRa = rightAscensionOf((0, houses_1.midheaven)(ramc, eps), eps);
            expect((0, zodiac_1.normaliseDegrees)(ascRa - mcRa)).toBeCloseTo(90, 6);
            expect((0, zodiac_1.normaliseDegrees)(mcRa - ramc)).toBeCloseTo(0, 6);
        });
    });
    describe('whole sign houses', () => {
        it('starts house 1 at the beginning of the ascendant sign', () => {
            const jd = JD_2024_06_15_1200_UT;
            const eps = (0, houses_1.trueObliquity)(jd);
            const ramc = (0, houses_1.localSiderealDegrees)(jd, 72.8777);
            const asc = (0, houses_1.ascendant)(ramc, 19.076, eps);
            const cusps = (0, houses_1.computeHouseCusps)('WHOLE_SIGN', ramc, 19.076, eps);
            expect(cusps[0] % 30).toBeCloseTo(0, 9);
            expect(Math.floor(cusps[0] / 30)).toBe(Math.floor(asc / 30));
            for (let i = 0; i < 12; i++) {
                expect(cusps[i]).toBeCloseTo((0, zodiac_1.normaliseDegrees)(cusps[0] + i * 30), 9);
            }
        });
    });
    describe('equal houses', () => {
        it('places the ascendant exactly on cusp 1 and spaces the rest by 30', () => {
            const jd = JD_2024_06_15_1200_UT;
            const eps = (0, houses_1.trueObliquity)(jd);
            const ramc = (0, houses_1.localSiderealDegrees)(jd, -0.1278);
            const asc = (0, houses_1.ascendant)(ramc, 51.5074, eps);
            const cusps = (0, houses_1.computeHouseCusps)('EQUAL', ramc, 51.5074, eps);
            expect(cusps[0]).toBeCloseTo(asc, 9);
            expect(cusps[6]).toBeCloseTo((0, zodiac_1.normaliseDegrees)(asc + 180), 9);
        });
    });
    describe('placidus', () => {
        it('collapses to equal right-ascension steps at the equator', () => {
            const jd = JD_2024_06_15_1200_UT;
            const eps = (0, houses_1.trueObliquity)(jd);
            const ramc = (0, houses_1.localSiderealDegrees)(jd, 0);
            const cusps = (0, houses_1.computeHouseCusps)('PLACIDUS', ramc, 0, eps);
            const houseOrder = [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            houseOrder.forEach((house, step) => {
                const ra = rightAscensionOf(cusps[house - 1], eps);
                expect((0, zodiac_1.normaliseDegrees)(ra - ramc)).toBeCloseTo((0, zodiac_1.normaliseDegrees)(step * 30), 5);
            });
        });
        it('keeps opposite cusps exactly 180 degrees apart', () => {
            const jd = JD_2024_06_15_1200_UT;
            const eps = (0, houses_1.trueObliquity)(jd);
            const ramc = (0, houses_1.localSiderealDegrees)(jd, 72.8777);
            const cusps = (0, houses_1.computeHouseCusps)('PLACIDUS', ramc, 19.076, eps);
            for (let i = 0; i < 6; i++) {
                expect(cusps[i + 6]).toBeCloseTo((0, zodiac_1.normaliseDegrees)(cusps[i] + 180), 6);
            }
        });
        it('produces cusps in ascending order around the circle', () => {
            const jd = JD_2024_06_15_1200_UT;
            const eps = (0, houses_1.trueObliquity)(jd);
            const ramc = (0, houses_1.localSiderealDegrees)(jd, -0.1278);
            const cusps = (0, houses_1.computeHouseCusps)('PLACIDUS', ramc, 51.5074, eps);
            for (let i = 0; i < 12; i++) {
                const span = (0, zodiac_1.normaliseDegrees)(cusps[(i + 1) % 12] - cusps[i]);
                expect(span).toBeGreaterThan(0);
                expect(span).toBeLessThan(180);
            }
        });
        it('refuses rather than approximating inside the polar circle', () => {
            const jd = JD_2024_06_15_1200_UT;
            const eps = (0, houses_1.trueObliquity)(jd);
            const ramc = (0, houses_1.localSiderealDegrees)(jd, 25.78);
            expect(() => (0, houses_1.computeHouseCusps)('PLACIDUS', ramc, 78.22, eps)).toThrow(houses_1.HouseSystemUnavailableError);
        });
        it('still works for whole sign inside the polar circle', () => {
            const jd = JD_2024_06_15_1200_UT;
            const eps = (0, houses_1.trueObliquity)(jd);
            const ramc = (0, houses_1.localSiderealDegrees)(jd, 25.78);
            expect(() => (0, houses_1.computeHouseCusps)('WHOLE_SIGN', ramc, 78.22, eps)).not.toThrow();
        });
    });
    describe('sidereal time', () => {
        it('advances 360 degrees in one sidereal day', () => {
            const start = (0, houses_1.localSiderealDegrees)(JD_2024_06_15_1200_UT, 0);
            const end = (0, houses_1.localSiderealDegrees)(JD_2024_06_15_1200_UT + 0.99726957, 0);
            expect(Math.abs(((end - start + 540) % 360) - 180)).toBeLessThan(0.01);
        });
        it('shifts by exactly the observer longitude', () => {
            const atGreenwich = (0, houses_1.localSiderealDegrees)(JD_2024_06_15_1200_UT, 0);
            const atMumbai = (0, houses_1.localSiderealDegrees)(JD_2024_06_15_1200_UT, 72.8777);
            expect((0, zodiac_1.normaliseDegrees)(atMumbai - atGreenwich)).toBeCloseTo(72.8777, 9);
        });
    });
    describe('obliquity', () => {
        it('is about 23.44 degrees in the modern era', () => {
            const eps = (0, houses_1.trueObliquity)(JD_2024_06_15_1200_UT);
            expect(eps).toBeGreaterThan(23.4);
            expect(eps).toBeLessThan(23.5);
        });
        it('decreases by roughly 47 arcseconds per century, within the nutation band', () => {
            const now = (0, houses_1.trueObliquity)(2451545.0);
            const century = (0, houses_1.trueObliquity)(2451545.0 + 36525);
            const arcsecondsPerCentury = (now - century) * 3600;
            expect(arcsecondsPerCentury).toBeGreaterThan(47 - 19);
            expect(arcsecondsPerCentury).toBeLessThan(47 + 19);
        });
        it('keeps nutation within about 10 arcseconds of the mean', () => {
            let minimum = Infinity;
            let maximum = -Infinity;
            for (let year = 0; year < 19; year += 0.25) {
                const eps = (0, houses_1.trueObliquity)(2451545.0 + year * 365.25);
                const mean = 23.4392911 - 0.0130042 * (year / 100);
                minimum = Math.min(minimum, (eps - mean) * 3600);
                maximum = Math.max(maximum, (eps - mean) * 3600);
            }
            expect(Math.abs(minimum)).toBeLessThan(11);
            expect(Math.abs(maximum)).toBeLessThan(11);
        });
    });
});
//# sourceMappingURL=houses.spec.js.map