import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Put,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ZunoUserGuard } from '../../common/guards/zuno-user.guard';
import { CurrentZunoUser } from '../../common/decorators/zuno-user.decorator';
import { ZunoUser } from '../entities/zuno-user.entity';
import { ZunoResponseInterceptor } from '../../common/interceptors/zuno-response.interceptor';
import { ZunoExceptionFilter } from '../../common/filters/zuno-exception.filter';
import { ZunoProfileService } from '../services/zuno-profile.service';
import {
  BirthProfileView,
  MeView,
  ProfileView,
  UpdateProfileDto,
  UpsertBirthProfileDto,
} from '../dtos/identity.dtos';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';

/**
 * Current-user API. Step 21 API Contracts sections 10, 20 and 21.
 *
 * Every route resolves identity from the token. There is no `/users/:id`
 * equivalent here by design - Step 21 Rule 6 and Step 20 Anti-Pattern 140.
 */
@ApiTags('ZUNO - Me')
@ApiBearerAuth('JWT-auth')
@Controller('me')
@UseGuards(JwtAuthGuard, ZunoUserGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class ZunoMeController {
  constructor(private readonly profiles: ZunoProfileService) {}

  /** Step 21 section 10. */
  @Get()
  @ApiOperation({ summary: 'Current ZUNO user' })
  async me(@CurrentZunoUser() user: ZunoUser) {
    const profile = await this.profiles.getProfile(user.id);
    return MeView.from(user, profile);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get profile' })
  async getProfile(@CurrentZunoUser() user: ZunoUser) {
    const profile = await this.profiles.getProfile(user.id);
    return ProfileView.from(profile, user);
  }

  /** Step 21 section 20. Partial by design - see the service for why. */
  @Patch('profile')
  @ApiOperation({ summary: 'Update profile (partial)' })
  async updateProfile(
    @CurrentZunoUser() user: ZunoUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const { profile, user: updated } = await this.profiles.updateProfile(user, dto);
    return ProfileView.from(profile, updated);
  }

  /** Step 21 section 21. */
  @Get('birth-profile')
  @ApiOperation({ summary: 'Get birth profile' })
  @ApiResponse({ status: 404, description: 'Not provided yet.' })
  async getBirthProfile(@CurrentZunoUser() user: ZunoUser) {
    const profile = await this.profiles.getBirthProfile(user.id);
    if (!profile) {
      // A missing birth profile is an ordinary state under progressive
      // onboarding, not an error condition - but the contract still needs a
      // definite answer, and an empty object would be ambiguous.
      throw new ZunoException(ZunoErrorCode.NOT_FOUND, {
        message: 'No birth details saved yet.',
      });
    }
    return BirthProfileView.from(profile);
  }

  @Put('birth-profile')
  @HttpCode(200)
  @ApiOperation({ summary: 'Create or replace birth profile' })
  @ApiResponse({
    status: 400,
    description: 'A birth time is required unless accuracy is UNKNOWN.',
  })
  async putBirthProfile(
    @CurrentZunoUser() user: ZunoUser,
    @Body() dto: UpsertBirthProfileDto,
  ) {
    const profile = await this.profiles.upsertBirthProfile(user, dto);
    return BirthProfileView.from(profile);
  }
}
