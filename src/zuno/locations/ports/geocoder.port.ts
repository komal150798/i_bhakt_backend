/**
 * The trusted-location boundary.
 *
 * Step 21 section 22 is explicit: coordinates come from a trusted location
 * service, never from an LLM. Build Rule 52 adds that birth place, coordinates
 * and timezone are never invented. This port is the only way coordinates enter
 * ZUNO, so that rule is enforceable by looking at one file's implementors
 * rather than by discipline spread across the codebase.
 *
 * Modelled on the WhatNow engine port (Build Rule 173): a DI token plus an
 * interface, so a provider can be swapped - or removed, leaving the fail-closed
 * null implementation - without any consumer changing.
 */

/** DI token. Bound in ZunoModule by ZUNO_GEOCODER_PROVIDER. */
export const GEOCODER = Symbol('ZUNO_GEOCODER');

/**
 * One candidate place.
 *
 * `confidence` is deliberately coarse and provider-normalised. A raw provider
 * score is not comparable across providers, and a number that looks precise
 * would invite a threshold that silently changes meaning when the provider does.
 */
export type GeocodeConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface GeocodeCandidate {
  /** The provider's canonical name, e.g. "Mumbai, Maharashtra, India". */
  displayName: string;
  /** Short name, e.g. "Mumbai". */
  name: string;
  latitude: number;
  longitude: number;
  /** ISO 3166-1 alpha-2, upper case, when the provider supplies it. */
  countryCode: string | null;
  /** Provider's own stable id for this place, when it has one. */
  providerPlaceId: string | null;
  confidence: GeocodeConfidence;
  /** e.g. 'city', 'town', 'village'. Provider vocabulary, not normalised. */
  featureType: string | null;
}

export interface GeocodeQuery {
  /** Free text, as the user typed it. */
  query: string;
  /** Optional ISO 3166-1 alpha-2 hint that narrows an ambiguous name. */
  countryCode?: string | null;
  /** Upper bound on candidates returned. Providers may return fewer. */
  limit?: number;
}

/**
 * A geocoding provider.
 *
 * Implementations MUST:
 *  - return an empty array rather than a guess when nothing matches;
 *  - never widen the query to get a hit (no "Delhi" -> "India" fallback), since
 *    a coordinate for the wrong place silently corrupts every chart derived
 *    from it, permanently and invisibly;
 *  - throw only for genuine provider failure, so the caller can distinguish
 *    "no such place" from "the service is down". Those need different user
 *    messages and only one of them is worth retrying.
 */
export interface IGeocoder {
  /** Provider identifier recorded as resolution provenance. */
  readonly providerName: string;

  /** True when the adapter has the configuration it needs to make a call. */
  isConfigured(): boolean;

  search(query: GeocodeQuery): Promise<GeocodeCandidate[]>;
}
