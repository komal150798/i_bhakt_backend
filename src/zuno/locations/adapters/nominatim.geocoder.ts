import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  GeocodeCandidate,
  GeocodeConfidence,
  GeocodeQuery,
  IGeocoder,
} from '../ports/geocoder.port';

/** OpenStreetMap's usage policy allows at most 1 request per second. */
const MIN_REQUEST_INTERVAL_MS = 1100;

/**
 * OpenStreetMap Nominatim adapter.
 *
 * Free and keyless, which makes it the right default for development and for
 * proving the flow end to end.
 *
 * OPERATIONAL WARNING, and the reason this is not simply "the" geocoder:
 * the public nominatim.openstreetmap.org endpoint is a volunteer-funded
 * service whose usage policy requires an identifying User-Agent, forbids more
 * than one request per second, and forbids heavy or commercial bulk use.
 * A production ZUNO should either run its own Nominatim instance
 * (ZUNO_NOMINATIM_BASE_URL) or use a commercial provider. Shipping user
 * traffic at the public endpoint risks being blocked, which would take birth
 * place resolution down for everyone.
 *
 * The rate limit is enforced here rather than trusted to callers, because the
 * consequence of breaching it is a block on the whole deployment.
 */
@Injectable()
export class NominatimGeocoder implements IGeocoder {
  readonly providerName = 'nominatim';

  private readonly logger = new Logger(NominatimGeocoder.name);

  /** Serialises calls so two concurrent requests cannot breach the policy. */
  private queue: Promise<unknown> = Promise.resolve();
  private lastRequestAt = 0;

  constructor(private readonly http: HttpService) {}

  private get baseUrl(): string {
    return (
      process.env.ZUNO_NOMINATIM_BASE_URL?.trim() ||
      'https://nominatim.openstreetmap.org'
    );
  }

  /**
   * The policy requires a real contact address in the User-Agent so the
   * operators can reach whoever is generating traffic. Without one configured
   * the adapter reports itself unconfigured rather than sending anonymous
   * traffic that would breach the terms.
   */
  private get contact(): string | null {
    return process.env.ZUNO_GEOCODER_CONTACT?.trim() || null;
  }

  isConfigured(): boolean {
    return Boolean(this.contact);
  }

  async search(query: GeocodeQuery): Promise<GeocodeCandidate[]> {
    if (!this.isConfigured()) {
      this.logger.warn(
        'ZUNO_GEOCODER_CONTACT is not set. Nominatim requires an identifying contact in the User-Agent, so no request was made.',
      );
      return [];
    }

    const text = query.query?.trim();
    if (!text) return [];

    return this.rateLimited(async () => {
      const params: Record<string, string | number> = {
        q: text,
        format: 'jsonv2',
        addressdetails: 1,
        limit: Math.min(Math.max(query.limit ?? 5, 1), 10),
      };
      if (query.countryCode) {
        params.countrycodes = query.countryCode.trim().toLowerCase();
      }

      const response = await firstValueFrom(
        this.http.get(`${this.baseUrl}/search`, {
          params,
          timeout: 8000,
          headers: {
            'User-Agent': `ZUNO/1.0 (${this.contact})`,
            'Accept-Language': 'en',
          },
        }),
      );

      const body = response.data;
      if (!Array.isArray(body)) return [];

      return body
        .map((row) => toCandidate(row))
        .filter((c): c is GeocodeCandidate => c !== null);
    });
  }

  /**
   * Runs `task` no sooner than MIN_REQUEST_INTERVAL_MS after the previous one.
   *
   * Chained onto a single promise rather than using a token bucket: the ordering
   * guarantee is what the policy needs, and a queue of place lookups is never
   * long enough for head-of-line blocking to matter.
   */
  private rateLimited<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const wait = this.lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now();
      if (wait > 0) await sleep(wait);
      this.lastRequestAt = Date.now();
      return task();
    });

    // Keep the chain alive even when this call rejects, or one failure would
    // poison every subsequent lookup.
    this.queue = run.catch(() => undefined);
    return run;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Maps one Nominatim row, rejecting anything without usable coordinates. */
function toCandidate(row: unknown): GeocodeCandidate | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, any>;

  const latitude = Number(r.lat);
  const longitude = Number(r.lon);
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return null;

  const address = (r.address ?? {}) as Record<string, string>;
  const name =
    r.name ||
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    String(r.display_name ?? '').split(',')[0] ||
    'Unknown';

  return {
    displayName: String(r.display_name ?? name),
    name: String(name),
    latitude,
    longitude,
    countryCode: address.country_code
      ? String(address.country_code).toUpperCase()
      : null,
    providerPlaceId: r.place_id != null ? String(r.place_id) : null,
    confidence: confidenceFrom(r),
    featureType: r.addresstype ? String(r.addresstype) : r.type ? String(r.type) : null,
  };
}

/**
 * Normalises Nominatim's `importance` (0..1) into a coarse band.
 *
 * The thresholds are conservative: anything that is not clearly a populated
 * place of reasonable prominence lands in LOW, and the resolver treats LOW as
 * "ask the user" rather than "accept". Guessing wrong here is unrecoverable.
 */
function confidenceFrom(row: Record<string, any>): GeocodeConfidence {
  const importance = Number(row.importance);
  const type = String(row.addresstype ?? row.type ?? '').toLowerCase();
  const isPopulatedPlace = ['city', 'town', 'village', 'municipality', 'suburb'].includes(
    type,
  );

  if (Number.isFinite(importance) && importance >= 0.55 && isPopulatedPlace) return 'HIGH';
  if (Number.isFinite(importance) && importance >= 0.35) return 'MEDIUM';
  if (isPopulatedPlace) return 'MEDIUM';
  return 'LOW';
}

function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}
