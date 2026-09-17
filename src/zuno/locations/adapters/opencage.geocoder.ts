import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  GeocodeCandidate,
  GeocodeConfidence,
  GeocodeQuery,
  IGeocoder,
} from '../ports/geocoder.port';

/**
 * OpenCage adapter - the production-shaped option.
 *
 * Chosen as the commercial reference implementation because it aggregates
 * OpenStreetMap and other open datasets under terms that permit commercial use
 * and result storage, which matters here: a birth coordinate is stored
 * permanently against the user's profile, and several major geocoding APIs
 * forbid retaining results. Confirm the current terms for your own plan before
 * launch - caching a coordinate forever is exactly the clause those licences
 * restrict.
 *
 * Configuration:
 *   ZUNO_GEOCODER=opencage
 *   ZUNO_OPENCAGE_API_KEY=...
 */
@Injectable()
export class OpenCageGeocoder implements IGeocoder {
  readonly providerName = 'opencage';

  private readonly logger = new Logger(OpenCageGeocoder.name);

  constructor(private readonly http: HttpService) {}

  private get apiKey(): string | null {
    return process.env.ZUNO_OPENCAGE_API_KEY?.trim() || null;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async search(query: GeocodeQuery): Promise<GeocodeCandidate[]> {
    if (!this.isConfigured()) {
      this.logger.warn(
        'ZUNO_OPENCAGE_API_KEY is not set; no geocoding request was made.',
      );
      return [];
    }

    const text = query.query?.trim();
    if (!text) return [];

    const params: Record<string, string | number> = {
      q: text,
      key: this.apiKey as string,
      limit: Math.min(Math.max(query.limit ?? 5, 1), 10),
      language: 'en',
      // Abbreviated output; ZUNO needs a coordinate and a name, not a full
      // postal breakdown, and the smaller payload keeps the call cheap.
      no_annotations: 1,
    };
    if (query.countryCode) {
      params.countrycode = query.countryCode.trim().toLowerCase();
    }

    const response = await firstValueFrom(
      this.http.get('https://api.opencagedata.com/geocode/v1/json', {
        params,
        timeout: 8000,
      }),
    );

    const results = response.data?.results;
    if (!Array.isArray(results)) return [];

    return results
      .map((row) => toCandidate(row))
      .filter((c): c is GeocodeCandidate => c !== null);
  }
}

function toCandidate(row: unknown): GeocodeCandidate | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, any>;

  const latitude = Number(r.geometry?.lat);
  const longitude = Number(r.geometry?.lng);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;

  const components = (r.components ?? {}) as Record<string, string>;
  const name =
    components.city ||
    components.town ||
    components.village ||
    components.municipality ||
    components.county ||
    components.state ||
    String(r.formatted ?? '').split(',')[0] ||
    'Unknown';

  return {
    displayName: String(r.formatted ?? name),
    name: String(name),
    latitude,
    longitude,
    countryCode: components.country_code
      ? String(components.country_code).toUpperCase()
      : null,
    // OpenCage has no stable place id across requests; the absence is recorded
    // honestly rather than filled with a synthetic value.
    providerPlaceId: null,
    confidence: confidenceFrom(r),
    featureType: r._type ? String(r._type) : components._type ? String(components._type) : null,
  };
}

/**
 * OpenCage reports `confidence` 1..10, where 10 is a match within ~250m.
 *
 * Banded conservatively for the same reason as the Nominatim adapter: LOW means
 * the resolver asks the user instead of choosing, and a wrong birth coordinate
 * is silent and permanent.
 */
function confidenceFrom(row: Record<string, any>): GeocodeConfidence {
  const score = Number(row.confidence);
  if (!Number.isFinite(score)) return 'LOW';
  if (score >= 8) return 'HIGH';
  if (score >= 5) return 'MEDIUM';
  return 'LOW';
}
