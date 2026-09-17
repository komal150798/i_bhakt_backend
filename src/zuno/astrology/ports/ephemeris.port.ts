/**
 * The ephemeris boundary.
 *
 * Everything here is ASTRONOMY: where the bodies actually were. Nothing here is
 * astrological interpretation, which belongs to the SME Rulebook and is
 * forbidden from living in source code by Step 10 section 47.
 *
 * The dividing line is deliberate and worth stating plainly, because it is the
 * line that keeps ZUNO honest:
 *
 *   this file      "Saturn was at 287.43 degrees sidereal, in house 10,
 *                   moving retrograde, 8.2 degrees from the Sun"
 *   the rulebook   what any of that means for a person's career
 *
 * A planetary position is a checkable fact with a right answer. An
 * interpretation is not. Mixing them would let interpretation inherit the
 * credibility of arithmetic.
 *
 * Modelled as a port with a DI token (Build Rule 173), so the pure-JavaScript
 * implementation can be replaced by a higher-precision engine - Swiss Ephemeris
 * behind a licence, or the Python intelligence service of Step 21 section 27 -
 * without any consumer changing.
 */

/** DI token. */
export const EPHEMERIS = Symbol('ZUNO_EPHEMERIS');

/**
 * The nine grahas of Vedic astrology.
 *
 * Rahu and Ketu are the Moon's ascending and descending nodes: mathematical
 * points, not bodies. The outer planets are absent because Parashari astrology
 * does not use them; adding them would be a methodology decision belonging to
 * the SME, not to code.
 */
export enum Graha {
  SUN = 'SUN',
  MOON = 'MOON',
  MARS = 'MARS',
  MERCURY = 'MERCURY',
  JUPITER = 'JUPITER',
  VENUS = 'VENUS',
  SATURN = 'SATURN',
  RAHU = 'RAHU',
  KETU = 'KETU',
}

export const GRAHA_ORDER: readonly Graha[] = [
  Graha.SUN,
  Graha.MOON,
  Graha.MARS,
  Graha.MERCURY,
  Graha.JUPITER,
  Graha.VENUS,
  Graha.SATURN,
  Graha.RAHU,
  Graha.KETU,
];

/** Where one graha was, and how it was moving. */
export interface GrahaPosition {
  graha: Graha;
  /** Sidereal ecliptic longitude, 0..360, ayanamsa already applied. */
  siderealLongitude: number;
  /** Tropical longitude, retained so the ayanamsa can be audited. */
  tropicalLongitude: number;
  /** Ecliptic latitude in degrees. */
  latitude: number;
  /** Degrees per day along the ecliptic. Negative means retrograde. */
  speed: number;
  retrograde: boolean;
  /** 1..12 sidereal sign, 1 = Aries. */
  signNumber: number;
  sign: string;
  /** Degrees within the sign, 0..30. */
  degreesInSign: number;
  /** 1..27. */
  nakshatraNumber: number;
  nakshatra: string;
  /** 1..4 quarter of the nakshatra. */
  pada: number;
  /** Which house it occupies, 1..12, under the chart's house system. */
  house: number;
  /**
   * Angular separation from the Sun, 0..180.
   *
   * The raw geometry for combustion. Whether this counts AS combust depends on
   * per-planet orbs, which are doctrine and therefore the rulebook's to state -
   * so this reports the distance and stops.
   */
  degreesFromSun: number;
}

export interface HouseCusp {
  /** 1..12. */
  house: number;
  /** Sidereal longitude of the cusp. */
  siderealLongitude: number;
  signNumber: number;
  sign: string;
}

export type HouseSystem = 'WHOLE_SIGN' | 'EQUAL' | 'PLACIDUS';

export interface Ascendant {
  siderealLongitude: number;
  tropicalLongitude: number;
  signNumber: number;
  sign: string;
  degreesInSign: number;
  nakshatraNumber: number;
  nakshatra: string;
  pada: number;
}

/** One level of the Vimshottari period tree. */
export interface DashaPeriod {
  lord: Graha;
  startIso: string;
  endIso: string;
  /** Nested sub-periods, present only where the caller asked for depth. */
  children?: DashaPeriod[];
}

/** The periods in force at a given moment. */
export interface DashaSnapshot {
  mahadasha: Graha;
  bhukti: Graha;
  antara: Graha;
  mahadashaPeriod: DashaPeriod;
  bhuktiPeriod: DashaPeriod;
  antaraPeriod: DashaPeriod;
}

export interface BirthMoment {
  /** Julian Day in UT. */
  julianDayUt: number;
  latitude: number;
  longitude: number;
}

export interface ChartOptions {
  /** Ayanamsa key; comes from the active rulebook's settings. */
  ayanamsa: string;
  houseSystem: HouseSystem;
}

/**
 * A complete natal chart, as astronomy.
 *
 * `provenance` is not decoration. Step 20 section 80 requires traceability, and
 * an interpretation delivered to a user two years from now has to be explainable
 * in terms of which engine, which ayanamsa and which house system produced the
 * numbers underneath it - all three change the answer.
 */
export interface NatalChart {
  moment: BirthMoment;
  ascendant: Ascendant;
  houses: HouseCusp[];
  positions: GrahaPosition[];
  /** Vimshottari periods in force at birth. */
  dashaAtBirth: DashaSnapshot;
  provenance: {
    engine: string;
    engineVersion: string;
    ayanamsa: string;
    ayanamsaDegrees: number;
    houseSystem: HouseSystem;
    computedAtIso: string;
  };
}

/** Where the grahas are now, for transit conditions. */
export interface TransitSnapshot {
  julianDayUt: number;
  positions: GrahaPosition[];
  provenance: {
    engine: string;
    ayanamsa: string;
    ayanamsaDegrees: number;
  };
}

export interface IEphemeris {
  readonly engineName: string;
  readonly engineVersion: string;

  /**
   * The earliest and latest dates the engine is accurate for.
   *
   * Every ephemeris has a validity range; outside it the answer degrades
   * without any error being raised. Callers are expected to refuse rather than
   * return a chart the engine cannot stand behind.
   */
  readonly supportedRange: { fromJulianDay: number; toJulianDay: number };

  computeNatalChart(moment: BirthMoment, options: ChartOptions): NatalChart;

  /**
   * Transit positions relative to a natal chart.
   *
   * Houses are those of the natal chart, since a transit condition asks where a
   * planet is now with respect to the person's own chart.
   */
  computeTransits(
    julianDayUt: number,
    natal: NatalChart,
    options: ChartOptions,
  ): TransitSnapshot;

  /** The Vimshottari tree from a birth Moon position. */
  computeDashaTimeline(
    moment: BirthMoment,
    options: ChartOptions,
    depth: number,
  ): DashaPeriod[];

  /** Periods in force at an arbitrary later moment. */
  dashaAt(
    moment: BirthMoment,
    options: ChartOptions,
    atJulianDayUt: number,
  ): DashaSnapshot | null;
}
