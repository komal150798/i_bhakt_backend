import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { find as findTimezone } from 'geo-tz';

export type LocalTimeResolution =
  /** Exactly one UTC instant corresponds to this local time. */
  | 'UNIQUE'
  /**
   * The local time occurs twice - a daylight-saving fall-back. Both instants
   * are real; only the person who was there knows which one.
   */
  | 'AMBIGUOUS'
  /**
   * The local time never occurred - a daylight-saving spring-forward gap.
   * Usually a transcription error on the birth certificate.
   */
  | 'NONEXISTENT';

export interface ResolvedInstant {
  resolution: LocalTimeResolution;
  /** UTC instant, ISO 8601. Null when NONEXISTENT. */
  utcIso: string | null;
  /** Julian Day (UT) for the ephemeris. Null when NONEXISTENT. */
  julianDayUt: number | null;
  /** Offset actually applied, in minutes east of UTC. Null when NONEXISTENT. */
  offsetMinutes: number | null;
  /** Populated for AMBIGUOUS: both candidate instants, earliest first. */
  alternatives: { utcIso: string; offsetMinutes: number }[];
  timezone: string;
}

/**
 * Coordinates and local birth time to a UTC instant.
 *
 * This is the step where birth data most often goes quietly wrong, and it is
 * wrong in a way nobody notices: an ascendant moves roughly one degree every
 * four minutes, so a one-hour offset error rotates the entire chart by about
 * fifteen degrees and changes house placements, while still producing a
 * confident, plausible-looking result.
 *
 * Two traps are handled explicitly rather than by hoping the platform gets it
 * right:
 *
 * HISTORICAL RULES, NOT TODAY'S. The offset must be the one in force at the
 * moment of birth, not the zone's current offset. Britain observed UTC+1 all
 * year from 1968 to 1971; India had two half-hour zones before 1906 and brief
 * wartime advances in the 1940s; the United States moved its DST boundaries in
 * 1987 and again in 2007. luxon resolves against the IANA database, which
 * encodes all of this, so the offset is looked up for the birth date.
 *
 * AMBIGUOUS AND NONEXISTENT LOCAL TIMES. An hour is repeated at every autumn
 * transition and skipped at every spring one. Libraries typically pick one
 * silently. Here both cases are detected and reported, because "01:30 on this
 * date happened twice, which one were you born in" is a question only the user
 * can answer, and picking for them fabricates a chart (Build Rule 52).
 *
 * The IANA database itself is a moving target: zones change, and a Node runtime
 * ships whatever tzdata it was built with. Keeping the runtime patched is an
 * operational requirement, not an optional upgrade.
 */
@Injectable()
export class TimezoneResolverService {
  private readonly logger = new Logger(TimezoneResolverService.name);

  /**
   * The IANA zone covering a coordinate.
   *
   * geo-tz carries the actual timezone boundary polygons, so it is correct near
   * borders where a longitude-based approximation is not - and a birth an hour
   * either side of a boundary is exactly the case that must not be approximated.
   *
   * Returns null rather than a guess when the coordinate is invalid or falls in
   * no zone (open ocean). An unresolved timezone is a state the birth profile
   * already models honestly.
   */
  timezoneForCoordinates(latitude: number, longitude: number): string | null {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null;
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;

    try {
      const zones = findTimezone(latitude, longitude);
      return zones?.length ? zones[0] : null;
    } catch (error) {
      this.logger.warn(
        `Timezone lookup failed for a coordinate: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /** True when the string names a zone the runtime's tzdata knows. */
  isKnownTimezone(zone: string): boolean {
    if (!zone?.trim()) return false;
    return DateTime.local().setZone(zone.trim()).isValid;
  }

  /**
   * Converts a local wall-clock birth time into a UTC instant.
   *
   * @param date  ISO date, `YYYY-MM-DD`, in the local calendar of the birth place
   * @param time  `HH:mm` or `HH:mm:ss` local wall-clock time
   * @param zone  IANA zone name
   *
   * The algorithm enumerates rather than trusts a single conversion: it
   * collects the distinct UTC offsets the zone uses around that date, forms one
   * candidate instant per offset, and keeps only the candidates that render
   * back to exactly the requested wall-clock time. The number of survivors is
   * the answer - zero means the time never existed, two means it happened
   * twice. A single `fromISO` call cannot distinguish those cases because it
   * has already silently chosen one.
   */
  resolveLocalToUtc(date: string, time: string, zone: string): ResolvedInstant {
    const normalisedTime = normaliseTime(time);
    const localIso = `${date}T${normalisedTime}`;

    if (!this.isKnownTimezone(zone)) {
      return unresolved(zone);
    }

    // Offsets in use within a day either side, which brackets any transition
    // that could affect this wall time.
    const probe = DateTime.fromISO(localIso, { zone: 'UTC' });
    if (!probe.isValid) return unresolved(zone);

    const offsets = new Set<number>();
    for (const hours of [-30, -12, 0, 12, 30]) {
      const at = probe.plus({ hours });
      const offset = DateTime.fromMillis(at.toMillis(), { zone }).offset;
      if (Number.isFinite(offset)) offsets.add(offset);
    }

    const matches: { utcIso: string; offsetMinutes: number }[] = [];
    for (const offsetMinutes of offsets) {
      const candidateUtcMs = probe.toMillis() - offsetMinutes * 60_000;
      const rendered = DateTime.fromMillis(candidateUtcMs, { zone });
      if (!rendered.isValid) continue;

      // Survives only if it renders back to the exact wall time asked for, and
      // with the offset that produced it - which rules out a candidate built
      // from a neighbouring offset that happens to land in the other regime.
      if (
        rendered.toFormat('yyyy-MM-dd') === date &&
        rendered.toFormat('HH:mm:ss') === normalisedTime &&
        rendered.offset === offsetMinutes
      ) {
        matches.push({
          utcIso: new Date(candidateUtcMs).toISOString(),
          offsetMinutes,
        });
      }
    }

    matches.sort((a, b) => a.utcIso.localeCompare(b.utcIso));

    if (matches.length === 0) {
      return {
        resolution: 'NONEXISTENT',
        utcIso: null,
        julianDayUt: null,
        offsetMinutes: null,
        alternatives: [],
        timezone: zone,
      };
    }

    const chosen = matches[0];
    return {
      // The earliest instant is reported as the primary answer for an ambiguous
      // time, but the resolution flag travels with it so a caller must decide
      // deliberately whether to accept it or ask the user.
      resolution: matches.length > 1 ? 'AMBIGUOUS' : 'UNIQUE',
      utcIso: chosen.utcIso,
      julianDayUt: julianDayFromUtcMillis(new Date(chosen.utcIso).getTime()),
      offsetMinutes: chosen.offsetMinutes,
      alternatives: matches.length > 1 ? matches : [],
      timezone: zone,
    };
  }
}

function unresolved(zone: string): ResolvedInstant {
  return {
    resolution: 'NONEXISTENT',
    utcIso: null,
    julianDayUt: null,
    offsetMinutes: null,
    alternatives: [],
    timezone: zone,
  };
}

/** Accepts `HH:mm` or `HH:mm:ss`, returns `HH:mm:ss`. */
function normaliseTime(time: string): string {
  const trimmed = (time ?? '').trim();
  const parts = trimmed.split(':');
  const hh = (parts[0] ?? '00').padStart(2, '0');
  const mm = (parts[1] ?? '00').padStart(2, '0');
  const ss = (parts[2] ?? '00').padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Julian Day from a UTC instant.
 *
 * The Unix epoch is JD 2440587.5 by definition, so this is exact rather than
 * calendar arithmetic, and it is continuous across the Gregorian cutover -
 * which matters because ZUNO must handle births in any era the user enters.
 *
 * This is Julian Day in UT. Converting UT to Terrestrial Time (delta-T) is the
 * ephemeris layer's job, since only it knows which quantities need it.
 */
export function julianDayFromUtcMillis(millis: number): number {
  return millis / 86_400_000 + 2440587.5;
}
