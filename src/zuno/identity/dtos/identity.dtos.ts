import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import {
  BirthTimeAccuracy,
  OnboardingStatus,
} from '../../common/enums';
import { ZunoUser } from '../entities/zuno-user.entity';
import { ZunoUserProfile } from '../entities/zuno-user-profile.entity';
import { ZunoBirthProfile } from '../entities/zuno-birth-profile.entity';

/** Step 21 section 10: GET /api/v1/me */
export class MeView {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true }) preferredName: string | null;
  @ApiProperty({ nullable: true }) locale: string | null;
  @ApiProperty({ nullable: true }) timezone: string | null;
  @ApiProperty({ enum: OnboardingStatus }) onboardingStatus: OnboardingStatus;

  static from(user: ZunoUser, profile: ZunoUserProfile | null): MeView {
    return {
      id: user.id,
      preferredName: profile?.preferred_name ?? null,
      locale: user.locale,
      timezone: user.timezone,
      onboardingStatus: user.onboarding_status,
    };
  }
}

/** Step 21 section 20: PATCH /api/v1/me/profile */
export class UpdateProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 100)
  preferredName?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 200)
  displayName?: string;

  @ApiPropertyOptional({ description: 'ISO 3166-1 alpha-2.' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'countryCode must be a 2-letter ISO code' })
  countryCode?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 120)
  city?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 120)
  occupation?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(2, 16)
  preferredLanguage?: string;

  @ApiPropertyOptional({ description: 'IANA timezone, e.g. Asia/Dubai.' })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  timezone?: string;
}

export class ProfileView {
  @ApiProperty({ nullable: true }) preferredName: string | null;
  @ApiProperty({ nullable: true }) displayName: string | null;
  @ApiProperty({ nullable: true }) countryCode: string | null;
  @ApiProperty({ nullable: true }) city: string | null;
  @ApiProperty({ nullable: true }) occupation: string | null;
  @ApiProperty({ nullable: true }) preferredLanguage: string | null;
  @ApiProperty({ nullable: true }) timezone: string | null;

  static from(profile: ZunoUserProfile | null, user: ZunoUser): ProfileView {
    return {
      preferredName: profile?.preferred_name ?? null,
      displayName: profile?.display_name ?? null,
      countryCode: profile?.country_code ?? null,
      city: profile?.city ?? null,
      occupation: profile?.occupation ?? null,
      preferredLanguage: profile?.preferred_language ?? null,
      timezone: user.timezone,
    };
  }
}

/**
 * Step 21 section 21: PUT /api/v1/me/birth-profile
 *
 * `timeOfBirth` is optional and `timeAccuracy` is required, which is the whole
 * point of this shape. Build Rule 53 forbids silently turning an approximate
 * time into an exact one, so the client must state which it is rather than
 * leaving the server to assume. A caller with no idea of the time sends
 * `timeAccuracy: UNKNOWN` and omits `timeOfBirth` - a valid, honest state.
 *
 * Coordinates are deliberately NOT accepted here. Step 21 section 22 routes
 * place resolution through a trusted location service, and Build Rule 52
 * forbids inventing them. Accepting client-supplied coordinates would let an
 * unverified value reach the astrology engine as though it were resolved.
 */
export class UpsertBirthProfileDto {
  @ApiProperty({ example: '1978-08-13', description: 'YYYY-MM-DD.' })
  @IsISO8601({ strict: true })
  dateOfBirth: string;

  @ApiPropertyOptional({
    example: '07:05:00',
    description: 'Local clock time at the place of birth. Omit if unknown.',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'timeOfBirth must be HH:mm or HH:mm:ss',
  })
  timeOfBirth?: string;

  @ApiProperty({ enum: BirthTimeAccuracy })
  @IsEnum(BirthTimeAccuracy)
  timeAccuracy: BirthTimeAccuracy;

  @ApiProperty({ example: 'Dongargarh' })
  @IsString()
  @Length(1, 200)
  placeName: string;

  @ApiPropertyOptional({ description: 'ISO 3166-1 alpha-2.' })
  @IsOptional()
  @Matches(/^[A-Z]{2}$/, { message: 'placeCountryCode must be a 2-letter ISO code' })
  placeCountryCode?: string;
}

/**
 * Birth profile view.
 *
 * `calculationReady` tells the client honestly whether astrology can run yet,
 * instead of letting it discover the gap later as a confusing failure. Step 21
 * section 100: if chart calculation cannot proceed, do not fabricate - return a
 * recoverable state.
 */
export class BirthProfileView {
  @ApiProperty() id: string;
  @ApiProperty() dateOfBirth: string;
  @ApiProperty({ nullable: true }) timeOfBirth: string | null;
  @ApiProperty({ enum: BirthTimeAccuracy }) timeAccuracy: BirthTimeAccuracy;
  @ApiProperty() placeName: string;
  @ApiProperty({ nullable: true }) placeCountryCode: string | null;
  @ApiProperty({ description: 'True once a trusted source resolved the place.' })
  placeResolved: boolean;
  @ApiProperty({ description: 'True when astrology has everything it needs.' })
  calculationReady: boolean;
  @ApiProperty() version: number;

  static from(profile: ZunoBirthProfile): BirthProfileView {
    return {
      id: profile.id,
      dateOfBirth: profile.date_of_birth,
      timeOfBirth: profile.time_of_birth,
      timeAccuracy: profile.time_accuracy,
      placeName: profile.place_name,
      placeCountryCode: profile.place_country_code,
      placeResolved:
        profile.latitude !== null &&
        profile.longitude !== null &&
        profile.timezone_at_birth !== null,
      calculationReady: profile.isCalculationReady,
      version: profile.version,
    };
  }
}
