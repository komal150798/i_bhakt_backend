import { Graha } from '../ports/ephemeris.port';

/**
 * Sidereal zodiac geometry: signs, nakshatras and their divisions.
 *
 * Everything in this file is arithmetic on a circle with fixed, universally
 * agreed divisions - twelve signs of 30 degrees, twenty-seven nakshatras of
 * 13 degrees 20 minutes, four padas each. None of it is interpretive, and none
 * of it varies between schools, which is why it is safe to hold in code while
 * doctrine stays in the rulebook.
 */

/** 0..360 regardless of input sign or magnitude. */
export function normaliseDegrees(value: number): number {
  const wrapped = value % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

/** Shortest separation between two longitudes, 0..180. */
export function angularSeparation(a: number, b: number): number {
  const diff = Math.abs(normaliseDegrees(a) - normaliseDegrees(b));
  return diff > 180 ? 360 - diff : diff;
}

export const SIGNS: readonly string[] = [
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

/**
 * Traditional (Parashari) sign rulerships.
 *
 * Only the seven classical grahas rule signs. Rahu and Ketu rule none - some
 * modern schools assign them co-rulerships, which is doctrine and therefore the
 * rulebook's to state, not this file's.
 */
export const SIGN_LORDS: readonly Graha[] = [
  Graha.MARS, // Aries
  Graha.VENUS, // Taurus
  Graha.MERCURY, // Gemini
  Graha.MOON, // Cancer
  Graha.SUN, // Leo
  Graha.MERCURY, // Virgo
  Graha.VENUS, // Libra
  Graha.MARS, // Scorpio
  Graha.JUPITER, // Sagittarius
  Graha.SATURN, // Capricorn
  Graha.SATURN, // Aquarius
  Graha.JUPITER, // Pisces
];

export const NAKSHATRAS: readonly string[] = [
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

/** 360 / 27. Exactly 13 degrees 20 minutes. */
export const NAKSHATRA_SPAN = 360 / 27;
/** One quarter of a nakshatra: 3 degrees 20 minutes. */
export const PADA_SPAN = NAKSHATRA_SPAN / 4;

export interface SignPosition {
  /** 1..12, 1 = Aries. */
  signNumber: number;
  sign: string;
  /** 0..30. */
  degreesInSign: number;
}

export function toSign(siderealLongitude: number): SignPosition {
  const lon = normaliseDegrees(siderealLongitude);
  const index = Math.floor(lon / 30);
  return {
    signNumber: index + 1,
    sign: SIGNS[index],
    degreesInSign: lon - index * 30,
  };
}

export interface NakshatraPosition {
  /** 1..27. */
  nakshatraNumber: number;
  nakshatra: string;
  /** 1..4. */
  pada: number;
  /** 0..1, how far through the nakshatra. Drives the Vimshottari balance. */
  fractionTraversed: number;
}

export function toNakshatra(siderealLongitude: number): NakshatraPosition {
  const lon = normaliseDegrees(siderealLongitude);
  const index = Math.floor(lon / NAKSHATRA_SPAN);
  const within = lon - index * NAKSHATRA_SPAN;

  return {
    nakshatraNumber: index + 1,
    nakshatra: NAKSHATRAS[index],
    // Math.min guards the exact-boundary case where floating point could yield
    // a pada of 5 at 13.333333...
    pada: Math.min(4, Math.floor(within / PADA_SPAN) + 1),
    fractionTraversed: within / NAKSHATRA_SPAN,
  };
}

/** The graha ruling a sign, 1..12. */
export function lordOfSign(signNumber: number): Graha {
  return SIGN_LORDS[(signNumber - 1 + 12) % 12];
}

/**
 * Which house a longitude falls in, given the twelve cusps.
 *
 * Walks the cusps rather than dividing, because only equal-arc systems have
 * houses of uniform width: under Placidus a house can span well over 30 degrees
 * at high latitude, and arithmetic that assumes otherwise silently misplaces
 * planets for anyone born far from the equator.
 */
export function houseOf(
  siderealLongitude: number,
  cuspLongitudes: readonly number[],
): number {
  const lon = normaliseDegrees(siderealLongitude);

  for (let i = 0; i < 12; i++) {
    const start = normaliseDegrees(cuspLongitudes[i]);
    const end = normaliseDegrees(cuspLongitudes[(i + 1) % 12]);

    // A house spanning 0 degrees Aries wraps, so the test has to branch.
    const inside =
      start <= end ? lon >= start && lon < end : lon >= start || lon < end;

    if (inside) return i + 1;
  }

  // Unreachable for well-formed cusps; returning house 1 rather than throwing
  // would hide a cusp bug, so this is loud.
  throw new Error(
    `Longitude ${lon} fell outside all twelve house cusps - the cusp set is malformed.`,
  );
}
