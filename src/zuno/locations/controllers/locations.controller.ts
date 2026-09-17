import {
  Controller,
  Get,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ZunoUserGuard } from '../../common/guards/zuno-user.guard';
import {
  ZunoPayload,
  ZunoResponseInterceptor,
} from '../../common/interceptors/zuno-response.interceptor';
import { ZunoExceptionFilter } from '../../common/filters/zuno-exception.filter';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { BirthPlaceResolverService } from '../services/birth-place-resolver.service';

/**
 * Place lookup for birth details. Step 21 section 22.
 *
 * Exists so the client can offer the user a list to choose from rather than
 * sending a free-text place name and hoping the server picks correctly. That
 * choice belongs to the user: only they know which Hyderabad they were born in,
 * and the consequence of the server guessing is a permanently wrong chart.
 *
 * Authenticated because geocoding costs money per call at every commercial
 * provider, and an open endpoint is a free proxy to someone else's paid API.
 */
@ApiTags('ZUNO - Locations')
@ApiBearerAuth('JWT-auth')
@Controller('locations')
@UseGuards(JwtAuthGuard, ZunoUserGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class ZunoLocationsController {
  constructor(private readonly places: BirthPlaceResolverService) {}

  /**
   * Searches for a birth place.
   *
   * `meta.status` carries the resolution outcome so the client knows whether to
   * auto-fill (RESOLVED) or present a chooser (AMBIGUOUS) - it must never
   * auto-select the first row of an ambiguous result.
   */
  @Get('search')
  @ApiOperation({ summary: 'Search for a birth place and its timezone' })
  @ApiQuery({ name: 'q', required: true, description: 'Place name as typed.' })
  @ApiQuery({
    name: 'country',
    required: false,
    description: 'ISO 3166-1 alpha-2 hint, e.g. IN.',
  })
  async search(@Query('q') q?: string, @Query('country') country?: string) {
    const query = (q ?? '').trim();

    if (query.length < 2) {
      throw new ZunoException(ZunoErrorCode.VALIDATION_ERROR, {
        message: 'Enter at least two characters of the place name.',
      });
    }

    const normalisedCountry = (country ?? '').trim().toUpperCase();
    if (normalisedCountry && !/^[A-Z]{2}$/.test(normalisedCountry)) {
      throw new ZunoException(ZunoErrorCode.VALIDATION_ERROR, {
        message: 'Country must be a two-letter ISO 3166-1 alpha-2 code.',
      });
    }

    const result = await this.places.resolve(query, normalisedCountry || null);

    return new ZunoPayload(
      result.candidates.map((c) => ({
        name: c.name,
        displayName: c.displayName,
        latitude: c.latitude,
        longitude: c.longitude,
        countryCode: c.countryCode,
        timezone: c.timezone,
        confidence: c.confidence,
        featureType: c.featureType,
      })),
      {
        status: result.status,
        provider: result.provider,
        // Deliberately explicit so the UI can say "we could not look this up
        // right now" rather than "we could not find your birthplace" - those
        // mean different things and only one is the user's problem.
        retryable: result.status === 'UNAVAILABLE',
      },
    );
  }

  /** Whether place lookup is usable at all, so the UI can adapt up front. */
  @Get('availability')
  @ApiOperation({ summary: 'Whether a geocoding provider is configured' })
  async availability() {
    return new ZunoPayload({
      available: this.places.isAvailable(),
    });
  }
}
