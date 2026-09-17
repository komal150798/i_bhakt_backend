import { nutation, sidereal } from 'astronomia';
import { HouseSystem } from '../ports/ephemeris.port';
import { normaliseDegrees } from './zodiac';

const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;

/**
 * Ascendant, Midheaven and house cusps.
 *
 * This is the part of a chart that depends on WHERE and WHEN to the minute.
 * Planetary longitudes barely move in an hour; the Ascendant moves through a
 * whole sign in roughly two. An error here is therefore the difference between
 * two entirely different charts, which is why the birth time accuracy and
 * timezone work upstream of this file matters as much as it does.
 *
 * Everything is computed in TROPICAL coordinates and converted to sidereal by
 * the caller, so the ayanamsa is applied in exactly one place.
 */

/** Mean obliquity plus nutation, in degrees. */
export function trueObliquity(julianDay: number): number {
  return (
    ((nutation as any).meanObliquity(julianDay) +
      (nutation as any).nutation(julianDay)[1]) *
    DEG
  );
}

/**
 * Local apparent sidereal time as an angle, 0..360.
 *
 * This is the RAMC - the right ascension of the meridian - and every cusp below
 * is derived from it. East longitude is positive.
 */
export function localSiderealDegrees(
  julianDay: number,
  longitudeEast: number,
): number {
  // astronomia reports apparent sidereal time at Greenwich in seconds of time.
  const greenwichSeconds = (sidereal as any).apparent(julianDay);
  const greenwichDegrees = (greenwichSeconds / 86400) * 360;
  return normaliseDegrees(greenwichDegrees + longitudeEast);
}

/**
 * The ecliptic longitude of the point with the given right ascension.
 *
 * Inverts the standard ecliptic-to-equatorial rotation for a point on the
 * ecliptic (latitude zero). atan2 rather than atan so the quadrant is right;
 * the atan form silently folds the southern half of the zodiac onto the
 * northern one, which is a classic source of charts that are exactly 180
 * degrees wrong.
 */
export function eclipticLongitudeAtRightAscension(
  rightAscensionDeg: number,
  obliquityDeg: number,
): number {
  const ra = rightAscensionDeg * RAD;
  const eps = obliquityDeg * RAD;
  return normaliseDegrees(
    Math.atan2(Math.sin(ra), Math.cos(ra) * Math.cos(eps)) * DEG,
  );
}

/** Declination of the ecliptic point at a given longitude. */
export function declinationOfEclipticLongitude(
  longitudeDeg: number,
  obliquityDeg: number,
): number {
  return (
    Math.asin(
      Math.sin(obliquityDeg * RAD) * Math.sin(longitudeDeg * RAD),
    ) * DEG
  );
}

/** Midheaven: the ecliptic point on the upper meridian. */
export function midheaven(ramcDeg: number, obliquityDeg: number): number {
  return eclipticLongitudeAtRightAscension(ramcDeg, obliquityDeg);
}

/**
 * Ascendant: the ecliptic point rising on the eastern horizon.
 *
 * Verified in the accompanying spec by an independent route - converting the
 * result to horizontal coordinates and confirming its altitude is zero and its
 * azimuth eastern - rather than by trusting the formula's transcription.
 */
export function ascendant(
  ramcDeg: number,
  latitudeDeg: number,
  obliquityDeg: number,
): number {
  const theta = ramcDeg * RAD;
  const phi = latitudeDeg * RAD;
  const eps = obliquityDeg * RAD;

  return normaliseDegrees(
    Math.atan2(
      Math.cos(theta),
      -(Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)),
    ) * DEG,
  );
}

/**
 * Placidus is undefined where a point never rises or sets, which happens inside
 * the polar circles. Beyond this latitude the system is refused rather than
 * approximated.
 */
const PLACIDUS_LATITUDE_LIMIT = 66.0;

export class HouseSystemUnavailableError extends Error {
  constructor(
    readonly system: HouseSystem,
    readonly reason: string,
  ) {
    super(`House system ${system} is unavailable: ${reason}`);
    this.name = 'HouseSystemUnavailableError';
  }
}

/**
 * Twelve tropical cusp longitudes, house 1 first.
 *
 * WHOLE_SIGN is the Parashari default and the one most Vedic practice assumes:
 * house 1 is the whole sign containing the Ascendant, starting at 0 degrees of
 * it. It is also the only one of the three that is well-defined at every
 * latitude, which is why it is the fallback the chart service uses.
 */
export function computeHouseCusps(
  system: HouseSystem,
  ramcDeg: number,
  latitudeDeg: number,
  obliquityDeg: number,
): number[] {
  const asc = ascendant(ramcDeg, latitudeDeg, obliquityDeg);

  switch (system) {
    case 'WHOLE_SIGN': {
      const signStart = Math.floor(normaliseDegrees(asc) / 30) * 30;
      return Array.from({ length: 12 }, (_, i) =>
        normaliseDegrees(signStart + i * 30),
      );
    }

    case 'EQUAL':
      return Array.from({ length: 12 }, (_, i) => normaliseDegrees(asc + i * 30));

    case 'PLACIDUS':
      return placidusCusps(ramcDeg, latitudeDeg, obliquityDeg, asc);

    default:
      throw new HouseSystemUnavailableError(
        system,
        `unknown house system "${system}"`,
      );
  }
}

/**
 * Placidus cusps by semi-arc trisection.
 *
 * A Placidus cusp is the ecliptic point that has traversed a fixed fraction of
 * its own semi-diurnal or semi-nocturnal arc. Because the arc depends on the
 * point's declination, and the declination depends on which point it is, the
 * definition is implicit and has to be solved by iteration.
 *
 * Cusps 1, 4, 7 and 10 are the angles, computed directly. Cusps 11, 12, 2 and 3
 * are solved below; 5, 6, 8 and 9 are their opposites.
 *
 * The relations, with SD the semi-diurnal arc of the cusp's own declination:
 *
 *   RA(11) = RAMC + (1/3)SD        RA(2) = RAMC + 60 + (2/3)SD
 *   RA(12) = RAMC + (2/3)SD        RA(3) = RAMC + 120 + (1/3)SD
 *
 * At the equator SD is 90 degrees for every declination, so these collapse to
 * RAMC + 30/60/120/150 - which is the spec's check that the formulation is
 * right.
 */
function placidusCusps(
  ramcDeg: number,
  latitudeDeg: number,
  obliquityDeg: number,
  asc: number,
): number[] {
  if (Math.abs(latitudeDeg) > PLACIDUS_LATITUDE_LIMIT) {
    throw new HouseSystemUnavailableError(
      'PLACIDUS',
      `latitude ${latitudeDeg.toFixed(2)} is inside the polar circle, where the semi-arcs Placidus divides do not exist`,
    );
  }

  const mc = midheaven(ramcDeg, obliquityDeg);

  const solve = (base: number, fraction: number): number => {
    let ra = normaliseDegrees(ramcDeg + base + fraction * 90);

    for (let i = 0; i < 24; i++) {
      const lon = eclipticLongitudeAtRightAscension(ra, obliquityDeg);
      const dec = declinationOfEclipticLongitude(lon, obliquityDeg);

      const cosSd = -Math.tan(latitudeDeg * RAD) * Math.tan(dec * RAD);
      if (cosSd <= -1 || cosSd >= 1) {
        // Circumpolar: this cusp's point never crosses the horizon, so it has
        // no semi-diurnal arc to divide.
        throw new HouseSystemUnavailableError(
          'PLACIDUS',
          'a cusp fell on a circumpolar arc, which Placidus does not define',
        );
      }

      const semiDiurnal = Math.acos(cosSd) * DEG;
      const next = normaliseDegrees(ramcDeg + base + fraction * semiDiurnal);

      // Converges in a handful of passes at ordinary latitudes.
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

  const opposite = (deg: number) => normaliseDegrees(deg + 180);

  return [
    asc, // 1
    c2, // 2
    c3, // 3
    opposite(mc), // 4  IC
    opposite(c11), // 5
    opposite(c12), // 6
    opposite(asc), // 7  Descendant
    opposite(c2), // 8
    opposite(c3), // 9
    mc, // 10 MC
    c11, // 11
    c12, // 12
  ];
}

/** Signed difference a - b, wrapped to -180..180. */
function shortestDelta(a: number, b: number): number {
  let delta = (normaliseDegrees(a) - normaliseDegrees(b)) % 360;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

/**
 * Ecliptic longitude to horizontal coordinates.
 *
 * Used by the spec to verify the Ascendant independently: the rising point must
 * have altitude zero and an eastern azimuth. Exported for that reason - it is a
 * test instrument, not part of chart calculation.
 */
export function eclipticToHorizontal(
  longitudeDeg: number,
  ramcDeg: number,
  latitudeDeg: number,
  obliquityDeg: number,
): { altitude: number; azimuth: number } {
  const lon = longitudeDeg * RAD;
  const eps = obliquityDeg * RAD;
  const phi = latitudeDeg * RAD;

  // Ecliptic (latitude 0) to equatorial.
  const ra = Math.atan2(Math.sin(lon) * Math.cos(eps), Math.cos(lon));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lon));

  // Hour angle, then the standard equatorial-to-horizontal rotation.
  const hourAngle = ramcDeg * RAD - ra;

  const altitude = Math.asin(
    Math.sin(phi) * Math.sin(dec) +
      Math.cos(phi) * Math.cos(dec) * Math.cos(hourAngle),
  );

  // Azimuth measured from north, increasing eastward.
  const azimuth = Math.atan2(
    -Math.cos(dec) * Math.sin(hourAngle),
    Math.sin(dec) * Math.cos(phi) - Math.cos(dec) * Math.sin(phi) * Math.cos(hourAngle),
  );

  return {
    altitude: altitude * DEG,
    azimuth: normaliseDegrees(azimuth * DEG),
  };
}
