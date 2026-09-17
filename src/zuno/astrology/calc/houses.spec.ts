import {
  HouseSystemUnavailableError,
  ascendant,
  computeHouseCusps,
  eclipticToHorizontal,
  localSiderealDegrees,
  midheaven,
  trueObliquity,
} from './houses';
import { normaliseDegrees } from './zodiac';

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/**
 * Ecliptic longitude to right ascension, for a point on the ecliptic.
 *
 * Several invariants below hold in RIGHT ASCENSION, not in ecliptic longitude -
 * the two are related by a non-linear rotation through the obliquity, so an
 * exact 90-degree relation in one is not 90 degrees in the other. Checking the
 * wrong space is a real trap: it looks like a failing implementation when it is
 * a failing assumption.
 */
function rightAscensionOf(longitudeDeg: number, obliquityDeg: number): number {
  const lon = longitudeDeg * RAD;
  const eps = obliquityDeg * RAD;
  return normaliseDegrees(
    Math.atan2(Math.sin(lon) * Math.cos(eps), Math.cos(lon)) * DEG,
  );
}

/**
 * The Ascendant is verified here by an INDEPENDENT route, not by restating the
 * formula: the rising point must sit on the horizon (altitude zero) in the
 * eastern half of the sky. If the transcription were wrong - a sign flip or a
 * missing cos(obliquity) - the result would still look like a plausible zodiac
 * degree, and only a physical check catches it.
 */
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

    it.each(cases)(
      'puts the rising point on the eastern horizon at $name',
      ({ lat, lon }) => {
        // Sweep the whole day so no single lucky moment can pass by accident.
        for (let hour = 0; hour < 24; hour += 1) {
          const jd = JD_2024_06_15_1200_UT + hour / 24;
          const eps = trueObliquity(jd);
          const ramc = localSiderealDegrees(jd, lon);
          const asc = ascendant(ramc, lat, eps);

          const { altitude, azimuth } = eclipticToHorizontal(asc, ramc, lat, eps);

          // On the horizon.
          expect(Math.abs(altitude)).toBeLessThan(1e-6);
          // In the eastern half: azimuth measured from north, increasing east.
          expect(azimuth).toBeGreaterThan(0);
          expect(azimuth).toBeLessThan(180);
        }
      },
    );

    it('advances through all twelve signs across one day', () => {
      const seen = new Set<number>();
      for (let minute = 0; minute < 1440; minute += 10) {
        const jd = JD_2024_06_15_1200_UT + minute / 1440;
        const eps = trueObliquity(jd);
        const ramc = localSiderealDegrees(jd, 72.8777);
        seen.add(Math.floor(ascendant(ramc, 19.076, eps) / 30));
      }
      expect(seen.size).toBe(12);
    });
  });

  describe('midheaven', () => {
    it('sits exactly on the meridian', () => {
      for (let hour = 0; hour < 24; hour += 3) {
        const jd = JD_2024_06_15_1200_UT + hour / 24;
        const eps = trueObliquity(jd);
        const ramc = localSiderealDegrees(jd, 72.8777);
        const mc = midheaven(ramc, eps);

        const { azimuth } = eclipticToHorizontal(mc, ramc, 19.076, eps);
        // On the meridian means due south (180) or due north (0/360).
        const onMeridian =
          Math.abs(azimuth - 180) < 1e-6 ||
          Math.abs(azimuth) < 1e-6 ||
          Math.abs(azimuth - 360) < 1e-6;
        expect(onMeridian).toBe(true);
      }
    });

    /**
     * At the equator the horizon passes through the celestial poles, so the
     * rising point is exactly 90 degrees of RIGHT ASCENSION east of the
     * meridian. In ecliptic longitude the same separation is not 90 degrees -
     * it varies with the obliquity - so this asserts in the space where the
     * relation is actually exact.
     */
    it('is 90 degrees of right ascension from the ascendant at the equator', () => {
      const jd = JD_2024_06_15_1200_UT;
      const eps = trueObliquity(jd);
      const ramc = localSiderealDegrees(jd, 0);

      const ascRa = rightAscensionOf(ascendant(ramc, 0, eps), eps);
      const mcRa = rightAscensionOf(midheaven(ramc, eps), eps);

      expect(normaliseDegrees(ascRa - mcRa)).toBeCloseTo(90, 6);
      // And the MC's own right ascension is the RAMC, by definition.
      expect(normaliseDegrees(mcRa - ramc)).toBeCloseTo(0, 6);
    });
  });

  describe('whole sign houses', () => {
    it('starts house 1 at the beginning of the ascendant sign', () => {
      const jd = JD_2024_06_15_1200_UT;
      const eps = trueObliquity(jd);
      const ramc = localSiderealDegrees(jd, 72.8777);
      const asc = ascendant(ramc, 19.076, eps);

      const cusps = computeHouseCusps('WHOLE_SIGN', ramc, 19.076, eps);

      expect(cusps[0] % 30).toBeCloseTo(0, 9);
      expect(Math.floor(cusps[0] / 30)).toBe(Math.floor(asc / 30));
      for (let i = 0; i < 12; i++) {
        expect(cusps[i]).toBeCloseTo(normaliseDegrees(cusps[0] + i * 30), 9);
      }
    });
  });

  describe('equal houses', () => {
    it('places the ascendant exactly on cusp 1 and spaces the rest by 30', () => {
      const jd = JD_2024_06_15_1200_UT;
      const eps = trueObliquity(jd);
      const ramc = localSiderealDegrees(jd, -0.1278);
      const asc = ascendant(ramc, 51.5074, eps);

      const cusps = computeHouseCusps('EQUAL', ramc, 51.5074, eps);
      expect(cusps[0]).toBeCloseTo(asc, 9);
      expect(cusps[6]).toBeCloseTo(normaliseDegrees(asc + 180), 9);
    });
  });

  describe('placidus', () => {
    /**
     * At the equator every point has a semi-diurnal arc of exactly 90 degrees,
     * so the trisection collapses to equal 30-degree steps in right ascension.
     * This is the check that the semi-arc relations are stated correctly.
     */
    it('collapses to equal right-ascension steps at the equator', () => {
      const jd = JD_2024_06_15_1200_UT;
      const eps = trueObliquity(jd);
      const ramc = localSiderealDegrees(jd, 0);

      const cusps = computeHouseCusps('PLACIDUS', ramc, 0, eps);

      // House 10 is the meridian; each subsequent cusp is 30 degrees of right
      // ascension further east. Note this is NOT equal ecliptic longitude -
      // comparing against the EQUAL house system here would wrongly fail.
      const houseOrder = [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      houseOrder.forEach((house, step) => {
        const ra = rightAscensionOf(cusps[house - 1], eps);
        expect(normaliseDegrees(ra - ramc)).toBeCloseTo(
          normaliseDegrees(step * 30),
          5,
        );
      });
    });

    it('keeps opposite cusps exactly 180 degrees apart', () => {
      const jd = JD_2024_06_15_1200_UT;
      const eps = trueObliquity(jd);
      const ramc = localSiderealDegrees(jd, 72.8777);
      const cusps = computeHouseCusps('PLACIDUS', ramc, 19.076, eps);

      for (let i = 0; i < 6; i++) {
        expect(cusps[i + 6]).toBeCloseTo(normaliseDegrees(cusps[i] + 180), 6);
      }
    });

    it('produces cusps in ascending order around the circle', () => {
      const jd = JD_2024_06_15_1200_UT;
      const eps = trueObliquity(jd);
      const ramc = localSiderealDegrees(jd, -0.1278);
      const cusps = computeHouseCusps('PLACIDUS', ramc, 51.5074, eps);

      for (let i = 0; i < 12; i++) {
        const span = normaliseDegrees(cusps[(i + 1) % 12] - cusps[i]);
        // Every house has positive width and none swallows the chart.
        expect(span).toBeGreaterThan(0);
        expect(span).toBeLessThan(180);
      }
    });

    /**
     * Placidus has no meaning inside the polar circles. Refusing is correct;
     * silently returning something would be a fabricated chart for anyone born
     * in northern Norway.
     */
    it('refuses rather than approximating inside the polar circle', () => {
      const jd = JD_2024_06_15_1200_UT;
      const eps = trueObliquity(jd);
      const ramc = localSiderealDegrees(jd, 25.78);

      expect(() => computeHouseCusps('PLACIDUS', ramc, 78.22, eps)).toThrow(
        HouseSystemUnavailableError,
      );
    });

    it('still works for whole sign inside the polar circle', () => {
      const jd = JD_2024_06_15_1200_UT;
      const eps = trueObliquity(jd);
      const ramc = localSiderealDegrees(jd, 25.78);
      expect(() => computeHouseCusps('WHOLE_SIGN', ramc, 78.22, eps)).not.toThrow();
    });
  });

  describe('sidereal time', () => {
    it('advances 360 degrees in one sidereal day', () => {
      const start = localSiderealDegrees(JD_2024_06_15_1200_UT, 0);
      // A sidereal day is ~23h56m04s.
      const end = localSiderealDegrees(
        JD_2024_06_15_1200_UT + 0.99726957,
        0,
      );
      expect(Math.abs(((end - start + 540) % 360) - 180)).toBeLessThan(0.01);
    });

    it('shifts by exactly the observer longitude', () => {
      const atGreenwich = localSiderealDegrees(JD_2024_06_15_1200_UT, 0);
      const atMumbai = localSiderealDegrees(JD_2024_06_15_1200_UT, 72.8777);
      expect(normaliseDegrees(atMumbai - atGreenwich)).toBeCloseTo(72.8777, 9);
    });
  });

  describe('obliquity', () => {
    it('is about 23.44 degrees in the modern era', () => {
      const eps = trueObliquity(JD_2024_06_15_1200_UT);
      expect(eps).toBeGreaterThan(23.4);
      expect(eps).toBeLessThan(23.5);
    });

    /**
     * The mean obliquity decreases by about 47 arcseconds per century.
     *
     * `trueObliquity` also carries nutation, which oscillates by up to about
     * 9.2 arcseconds on an 18.6-year cycle - so two samples a century apart can
     * differ from the secular rate by up to ~18 arcseconds either way. The band
     * below is widened to admit that rather than pretending nutation is absent.
     */
    it('decreases by roughly 47 arcseconds per century, within the nutation band', () => {
      const now = trueObliquity(2451545.0);
      const century = trueObliquity(2451545.0 + 36525);
      const arcsecondsPerCentury = (now - century) * 3600;
      expect(arcsecondsPerCentury).toBeGreaterThan(47 - 19);
      expect(arcsecondsPerCentury).toBeLessThan(47 + 19);
    });

    /** Nutation in obliquity stays inside its known amplitude. */
    it('keeps nutation within about 10 arcseconds of the mean', () => {
      let minimum = Infinity;
      let maximum = -Infinity;
      // Sample a full 18.6-year nutation cycle.
      for (let year = 0; year < 19; year += 0.25) {
        const eps = trueObliquity(2451545.0 + year * 365.25);
        const mean = 23.4392911 - 0.0130042 * (year / 100);
        minimum = Math.min(minimum, (eps - mean) * 3600);
        maximum = Math.max(maximum, (eps - mean) * 3600);
      }
      expect(Math.abs(minimum)).toBeLessThan(11);
      expect(Math.abs(maximum)).toBeLessThan(11);
    });
  });
});
