import { Logger, Provider } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { GEOCODER, IGeocoder } from './ports/geocoder.port';
import { NominatimGeocoder } from './adapters/nominatim.geocoder';
import { OpenCageGeocoder } from './adapters/opencage.geocoder';
import { NullGeocoder } from './adapters/null.geocoder';

/**
 * Binds the GEOCODER token from configuration.
 *
 * Selection is explicit rather than "use whichever key happens to be set":
 * an operator who sets an OpenCage key while ZUNO_GEOCODER still says
 * `nominatim` should get Nominatim, not a silent switch. Inferring the provider
 * from which secret is present makes the active provider unknowable from
 * configuration alone, and the provider is recorded as chart provenance.
 *
 *   ZUNO_GEOCODER=nominatim   OpenStreetMap; also needs ZUNO_GEOCODER_CONTACT
 *   ZUNO_GEOCODER=opencage    needs ZUNO_OPENCAGE_API_KEY
 *   unset / anything else     the fail-closed null geocoder
 *
 * The default is deliberately the null implementation. A missing configuration
 * leaves birth places unresolved - a state the product already handles
 * honestly - rather than quietly sending user data to a third party nobody
 * chose.
 */
export const GeocoderProvider: Provider = {
  provide: GEOCODER,
  inject: [HttpService],
  useFactory: (http: HttpService): IGeocoder => {
    const logger = new Logger('GeocoderProvider');
    const selected = (process.env.ZUNO_GEOCODER ?? '').trim().toLowerCase();

    switch (selected) {
      case 'nominatim': {
        const adapter = new NominatimGeocoder(http);
        logger.log(
          adapter.isConfigured()
            ? 'Geocoding provider: nominatim'
            : 'Geocoding provider nominatim selected but ZUNO_GEOCODER_CONTACT is missing; lookups will be refused.',
        );
        return adapter;
      }

      case 'opencage': {
        const adapter = new OpenCageGeocoder(http);
        logger.log(
          adapter.isConfigured()
            ? 'Geocoding provider: opencage'
            : 'Geocoding provider opencage selected but ZUNO_OPENCAGE_API_KEY is missing; lookups will be refused.',
        );
        return adapter;
      }

      default: {
        if (selected) {
          logger.error(
            `Unknown ZUNO_GEOCODER "${selected}". Falling back to the null geocoder; birth places will not resolve.`,
          );
        }
        return new NullGeocoder();
      }
    }
  },
};
