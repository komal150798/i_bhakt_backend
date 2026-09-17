import { base, coord, precess } from 'astronomia';
import { normaliseDegrees } from './zodiac';

const DEG = 180 / Math.PI;

/** 1900 January 0.5 TT - the epoch the Lahiri definition is anchored to. */
const JD_1900 = 2415020.0;

/**
 * Sidereal ayanamsa.
 *
 * The ayanamsa is the angle between the tropical zodiac, which is tied to the
 * moving equinox, and the sidereal zodiac, which is tied to the fixed stars.
 * It grows at the rate of general precession, roughly 50.3 arcseconds a year,
 * and every sidereal calculation in ZUNO is a tropical position minus this
 * number. Getting it wrong shifts the whole chart uniformly.
 *
 * MODEL. Rather than hard-coding a polynomial, the accumulated precession is
 * taken from astronomia's IAU precession implementation: the ecliptic longitude,
 * in the frame of date, of the direction that had longitude zero at J2000. That
 * quantity IS the accumulated general precession, so the ayanamsa at any date is
 *
 *     ayanamsa(t) = anchorValue + (P(t) - P(anchorEpoch))
 *
 * Using a maintained precession model rather than transcribed coefficients
 * means the result cannot drift from a typo, and the anchor is the only
 * astrological input.
 *
 * ---------------------------------------------------------------------------
 * ACCURACY, STATED PLAINLY:
 *
 * With the Lahiri anchor below, this model produces 23.8571 degrees at J2000
 * against a commonly published Lahiri value of about 23.8531 degrees - a
 * difference of roughly 15 arcseconds, or 0.004 degrees. The difference comes
 * from the precession model used, not from an error in the arithmetic here.
 *
 * What that means in practice: a graha is misplaced into the wrong sign or
 * nakshatra only if it sits within 0.004 degrees of a boundary. It is not
 * enough to matter for rule matching, and it is far too much to present as an
 * exact degree-and-minute figure to a user alongside another source's number.
 *
 * Before the rulebook goes to production the anchor MUST be calibrated against
 * whatever authority the SME works from, by comparing a handful of known charts
 * and setting ZUNO_AYANAMSA_ANCHOR. This is a one-line configuration change and
 * is deliberately left to the SME rather than guessed here (Step 10 section 47:
 * astrological parameters do not belong in source code).
 * ---------------------------------------------------------------------------
 */

export interface AyanamsaAnchor {
  /** Julian Day of the epoch at which `degrees` is defined. */
  julianDay: number;
  degrees: number;
  /** Where the figure came from, for audit. */
  source: string;
}

/**
 * Anchors for supported systems.
 *
 * ONLY LAHIRI IS PRESENT, and that is a deliberate fail-closed choice matching
 * Step 20 section 125. Raman, Krishnamurti and Fagan-Bradley are all in common
 * use and all differ from Lahiri by amounts large enough to move planets between
 * signs - up to about a degree. Seeding approximate values for them would let a
 * rulebook silently select a wrong zodiac. An unsupported ayanamsa therefore
 * raises, and the operator supplies an explicit anchor instead.
 */
const ANCHORS: Readonly<Record<string, AyanamsaAnchor>> = {
  LAHIRI: {
    julianDay: JD_1900,
    // 22 degrees 27 minutes 37.7 seconds, the Indian Calendar Reform
    // Committee's defining value for the Chitrapaksha (Lahiri) ayanamsa.
    degrees: 22 + 27 / 60 + 37.7 / 3600,
    source: 'Indian Calendar Reform Committee, 1900.0 epoch',
  },
};

/**
 * Parses ZUNO_AYANAMSA_ANCHOR, which overrides or adds a system.
 *
 *   ZUNO_AYANAMSA_ANCHOR='{"KP":{"julianDay":2415020.0,"degrees":22.3785,"source":"SME sheet v3"}}'
 *
 * Returns an empty object on anything malformed, so a bad env var degrades to
 * the built-in table rather than stopping the application.
 */
function parseAnchorOverride(): Record<string, AyanamsaAnchor> {
  const raw = process.env.ZUNO_AYANAMSA_ANCHOR?.trim();
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    const result: Record<string, AyanamsaAnchor> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, any>)) {
      if (!value || typeof value !== 'object') continue;
      const julianDay = Number(value.julianDay);
      const degrees = Number(value.degrees);
      if (!Number.isFinite(julianDay) || !Number.isFinite(degrees)) continue;
      if (degrees < -180 || degrees > 180) continue;

      result[key.trim().toUpperCase()] = {
        julianDay,
        degrees,
        source: String(value.source ?? 'ZUNO_AYANAMSA_ANCHOR'),
      };
    }
    return result;
  } catch {
    return {};
  }
}

/** Systems this build can compute, including any supplied by configuration. */
export function supportedAyanamsas(): string[] {
  return Object.keys({ ...ANCHORS, ...parseAnchorOverride() }).sort();
}

export function findAnchor(system: string): AyanamsaAnchor | null {
  const key = (system ?? '').trim().toUpperCase();
  if (!key) return null;
  return parseAnchorOverride()[key] ?? ANCHORS[key] ?? null;
}

/**
 * Accumulated general precession in longitude since J2000, in degrees.
 *
 * Returned as a continuous signed value - negative before J2000 - rather than
 * wrapped to 0..360, because it is used as a difference and a wrap would make
 * dates either side of J2000 differ by a full circle.
 */
export function precessionSinceJ2000(julianDay: number): number {
  const from = new (coord as any).Ecliptic(0, 0);
  const to = (precess as any).eclipticPosition(
    from,
    2000.0,
    (base as any).JDEToJulianYear(julianDay),
  );

  const wrapped = normaliseDegrees(to.lon * DEG);
  // Precession accumulates well under a degree per century over any era ZUNO
  // supports, so a value near 360 can only be a small negative angle wrapped.
  return wrapped > 180 ? wrapped - 360 : wrapped;
}

/**
 * The ayanamsa in degrees for a date.
 *
 * @throws when the system is unknown - see the ANCHORS comment. Refusing is the
 *         point: a wrong zodiac produces a complete, confident, wrong chart.
 */
export function ayanamsaDegrees(system: string, julianDay: number): number {
  const anchor = findAnchor(system);
  if (!anchor) {
    throw new Error(
      `Unsupported ayanamsa "${system}". Supported: ${supportedAyanamsas().join(', ')}. ` +
        'Add an explicit anchor via ZUNO_AYANAMSA_ANCHOR rather than substituting another system.',
    );
  }

  return (
    anchor.degrees +
    (precessionSinceJ2000(julianDay) - precessionSinceJ2000(anchor.julianDay))
  );
}

/** Tropical longitude to sidereal, normalised to 0..360. */
export function toSidereal(
  tropicalLongitude: number,
  ayanamsa: number,
): number {
  return normaliseDegrees(tropicalLongitude - ayanamsa);
}
