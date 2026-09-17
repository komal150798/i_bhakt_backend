import { Injectable, Logger } from '@nestjs/common';
import {
  GeocodeCandidate,
  GeocodeQuery,
  IGeocoder,
} from '../ports/geocoder.port';

/**
 * The default when no geocoding provider is configured.
 *
 * It resolves nothing, and that is the point. Step 20 section 125 establishes
 * fail-closed as the house style for the rulebook, and the same reasoning
 * applies harder to coordinates: an unresolved birth place is a recoverable,
 * honest state that `ZunoBirthProfile.isCalculationReady` already models and
 * the Profile screen already surfaces, whereas a wrong coordinate is silent,
 * permanent corruption of every chart computed from it.
 *
 * So a missing provider degrades the product (no chart-based guidance) instead
 * of quietly degrading its correctness.
 */
@Injectable()
export class NullGeocoder implements IGeocoder {
  readonly providerName = 'none';

  private readonly logger = new Logger(NullGeocoder.name);
  private warned = false;

  isConfigured(): boolean {
    return false;
  }

  async search(_query: GeocodeQuery): Promise<GeocodeCandidate[]> {
    if (!this.warned) {
      this.warned = true;
      this.logger.warn(
        'No geocoding provider configured (ZUNO_GEOCODER). Birth places cannot be resolved to coordinates, so chart-based guidance stays unavailable. Set ZUNO_GEOCODER=nominatim or =opencage to enable it.',
      );
    }
    return [];
  }
}
