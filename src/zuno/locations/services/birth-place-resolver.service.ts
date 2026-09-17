import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  GEOCODER,
  GeocodeCandidate,
  IGeocoder,
} from '../ports/geocoder.port';
import { TimezoneResolverService } from './timezone-resolver.service';

export type PlaceResolutionStatus =
  /** Exactly one confident match, safe to store without asking. */
  | 'RESOLVED'
  /** More than one plausible match. The user must choose. */
  | 'AMBIGUOUS'
  /** The provider answered, and nothing matched. */
  | 'NOT_FOUND'
  /** No provider configured, or the provider failed. Retryable. */
  | 'UNAVAILABLE';

export interface ResolvedPlace extends GeocodeCandidate {
  /** IANA zone for the coordinate, or null when it could not be determined. */
  timezone: string | null;
}

export interface PlaceResolution {
  status: PlaceResolutionStatus;
  /** The single match when RESOLVED; every option when AMBIGUOUS. */
  candidates: ResolvedPlace[];
  /** Which provider answered, recorded as provenance. */
  provider: string;
  /** Operator-facing reason, for logs and support. Never shown to a user. */
  detail?: string;
}

/**
 * Turns a typed place name into coordinates and a timezone, or refuses.
 *
 * The behaviour that matters is what it does when it is not sure: it stops.
 *
 * A geocoder asked for "Springfield" will happily return a confident answer,
 * and the wrong Springfield produces a chart that is internally consistent,
 * plausible, and permanently wrong - with no error anywhere to notice. Because
 * a birth coordinate is written once and then read for the life of the account,
 * an incorrect one is strictly worse than a missing one, which the birth
 * profile already models honestly through `isCalculationReady`.
 *
 * So a single HIGH-confidence match resolves; anything else comes back
 * AMBIGUOUS with the options, for the user to pick from. That is Build Rule 52
 * ("never invent birth place, coordinates or timezone") applied to the one
 * place where inventing is easiest and least visible.
 */
@Injectable()
export class BirthPlaceResolverService {
  private readonly logger = new Logger(BirthPlaceResolverService.name);

  constructor(
    @Inject(GEOCODER) private readonly geocoder: IGeocoder,
    private readonly timezones: TimezoneResolverService,
  ) {}

  /** True when a provider is configured and could answer. */
  isAvailable(): boolean {
    return this.geocoder.isConfigured();
  }

  async resolve(
    query: string,
    countryCode?: string | null,
  ): Promise<PlaceResolution> {
    const text = (query ?? '').trim();

    if (!text) {
      return {
        status: 'NOT_FOUND',
        candidates: [],
        provider: this.geocoder.providerName,
        detail: 'empty query',
      };
    }

    if (!this.geocoder.isConfigured()) {
      return {
        status: 'UNAVAILABLE',
        candidates: [],
        provider: this.geocoder.providerName,
        detail: 'no geocoding provider configured',
      };
    }

    let raw: GeocodeCandidate[];
    try {
      raw = await this.geocoder.search({
        query: text,
        countryCode: countryCode ?? null,
        limit: 5,
      });
    } catch (error) {
      // A provider outage is not "this place does not exist". Conflating them
      // would teach the user their birthplace is unknown and make them enter
      // something else, which is unrecoverable once stored.
      this.logger.warn(
        `Geocoding provider "${this.geocoder.providerName}" failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        status: 'UNAVAILABLE',
        candidates: [],
        provider: this.geocoder.providerName,
        detail: 'provider request failed',
      };
    }

    const candidates: ResolvedPlace[] = raw.map((c) => ({
      ...c,
      timezone: this.timezones.timezoneForCoordinates(c.latitude, c.longitude),
    }));

    // A candidate without a timezone cannot produce a chart, so it is not a
    // usable answer even though the coordinate looks fine.
    const usable = candidates.filter((c) => c.timezone !== null);

    if (usable.length === 0) {
      return {
        status: candidates.length > 0 ? 'AMBIGUOUS' : 'NOT_FOUND',
        candidates,
        provider: this.geocoder.providerName,
        detail:
          candidates.length > 0
            ? 'matches found but none resolved to a timezone'
            : 'no matches',
      };
    }

    const high = usable.filter((c) => c.confidence === 'HIGH');

    // One clearly-best match, and nothing else close to it.
    if (high.length === 1 && usable.length === 1) {
      return {
        status: 'RESOLVED',
        candidates: high,
        provider: this.geocoder.providerName,
      };
    }

    // One high-confidence match among weaker ones. Still auto-resolve only when
    // the runners-up are meaningfully worse; two HIGH matches means the name is
    // genuinely ambiguous ("Hyderabad" exists in India and Pakistan).
    if (high.length === 1 && usable.every((c) => c === high[0] || c.confidence === 'LOW')) {
      return {
        status: 'RESOLVED',
        candidates: high,
        provider: this.geocoder.providerName,
      };
    }

    return {
      status: 'AMBIGUOUS',
      candidates: usable,
      provider: this.geocoder.providerName,
      detail: `${usable.length} plausible matches`,
    };
  }

  /**
   * Verifies a coordinate the client supplied, rather than trusting it.
   *
   * The client picks from candidates this service returned, but the chosen
   * coordinate arrives over the wire and must be revalidated: the range check
   * catches transport and client bugs, and the timezone lookup is redone
   * server-side so the stored zone is always one ZUNO derived itself.
   */
  verifyCoordinate(
    latitude: number,
    longitude: number,
  ): { valid: boolean; timezone: string | null; reason?: string } {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return { valid: false, timezone: null, reason: 'latitude out of range' };
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return { valid: false, timezone: null, reason: 'longitude out of range' };
    }

    const timezone = this.timezones.timezoneForCoordinates(latitude, longitude);
    if (!timezone) {
      return {
        valid: false,
        timezone: null,
        reason: 'coordinate resolves to no timezone',
      };
    }
    return { valid: true, timezone };
  }
}
