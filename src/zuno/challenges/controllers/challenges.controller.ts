import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ZunoUserGuard } from '../../common/guards/zuno-user.guard';
import { CurrentZunoUser } from '../../common/decorators/zuno-user.decorator';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoResponseInterceptor, ZunoPayload } from '../../common/interceptors/zuno-response.interceptor';
import { ZunoExceptionFilter } from '../../common/filters/zuno-exception.filter';
import { ChallengeService } from '../services/challenge.service';
import { IdempotencyService } from '../../common/services/idempotency.service';
import {
  ChallengeDetailView,
  ChallengeView,
  CreateChallengeDto,
  ListChallengesQueryDto,
  ReopenChallengeDto,
  ResolveChallengeDto,
  ZunoResponseView,
} from '../dtos/challenge.dtos';
import { ProcessingState } from '../../common/enums';

/**
 * WhatNow challenge API. Step 21 API Contracts section 24.
 *
 * Mounted at `/api/v1/challenges` - the global prefix supplies `api/v1`. Note
 * this is distinct from the existing `/api/v1/app/challenges`, which serves the
 * unrelated devotional-programme feature.
 *
 * Every route is guarded twice by design: JwtAuthGuard proves who the caller
 * is, ZunoUserGuard resolves them to a ZUNO user and makes that the only
 * identity the handlers can see. No handler takes a user id as a parameter
 * (Step 21 Rule 6).
 */
@ApiTags('ZUNO - Challenges (WhatNow)')
@ApiBearerAuth('JWT-auth')
@Controller('challenges')
@UseGuards(JwtAuthGuard, ZunoUserGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class ZunoChallengesController {
  constructor(
    private readonly challenges: ChallengeService,
    private readonly idempotency: IdempotencyService,
  ) {}

  /**
   * Step 21 section 25. Returns PROCESSING because understanding has not
   * happened yet - the client calls /analyze next. Step 21 section 109:
   * expose real processing state rather than pretending it is synchronous.
   */
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Start a new WhatNow from the user\'s own words' })
  @ApiResponse({ status: 201, description: 'Challenge created.' })
  @ApiResponse({ status: 403, description: 'Blocked by the safety policy.' })
  async create(
    @CurrentZunoUser() user: ZunoUser,
    @Body() dto: CreateChallengeDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    // Step 21 section 16 lists challenge creation as retry-sensitive: a mobile
    // client that times out and retries must not create two challenges.
    return this.idempotency.execute(
      {
        operation: 'CHALLENGE_CREATE',
        key: idempotencyKey,
        userId: user.id,
        requestBody: dto,
      },
      async () => {
        const challenge = await this.challenges.create({
          user,
          statement: dto.statement,
        });
        return {
          challengeId: challenge.id,
          status: ProcessingState.PROCESSING,
          challenge: ChallengeView.from(challenge),
        };
      },
    );
  }

  /** Step 21 section 24: list the user's challenges, newest first. */
  @Get()
  @ApiOperation({ summary: 'List the current user\'s WhatNows' })
  async list(
    @CurrentZunoUser() user: ZunoUser,
    @Query() query: ListChallengesQueryDto,
  ) {
    const { items, nextCursor } = await this.challenges.list({
      userId: user.id,
      status: query.status,
      limit: query.limit ?? 20,
      cursor: query.cursor,
    });

    // Cursor metadata rides in `meta`, per Step 21 section 17, rather than
    // being mixed into the data array.
    return new ZunoPayload(items.map(ChallengeView.from), {
      nextCursor,
      hasMore: nextCursor !== null,
    });
  }

  @Get(':challengeId')
  @ApiOperation({ summary: 'Get one WhatNow with its current understanding' })
  @ApiResponse({ status: 404, description: 'Not found, or not yours.' })
  async detail(
    @CurrentZunoUser() user: ZunoUser,
    @Param('challengeId', ParseUUIDPipe) challengeId: string,
  ) {
    const challenge = await this.challenges.findOwned(user.id, challengeId);
    const context = await this.challenges.latestContext(challenge.id);
    return ChallengeDetailView.fromDetail(challenge, context);
  }

  /**
   * Step 21 section 26: triggers WhatNow orchestration.
   *
   * Runs synchronously here. Step 21 section 26 permits a synchronous response
   * "for fast cases" and 202 for longer ones; a single structured extraction
   * pass (Step 11 section 61) is a fast case. Moving it behind a job queue is a
   * later change that the ProcessingState contract above already anticipates.
   */
  @Post(':challengeId/analyze')
  @HttpCode(200)
  @ApiOperation({ summary: 'Run the WhatNow engine over this challenge' })
  @ApiResponse({ status: 200, description: 'Understanding produced.' })
  @ApiResponse({ status: 403, description: 'Blocked by the safety policy.' })
  @ApiResponse({ status: 503, description: 'Intelligence layer unavailable.' })
  async analyze(
    @CurrentZunoUser() user: ZunoUser,
    @Param('challengeId', ParseUUIDPipe) challengeId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.idempotency.execute(
      {
        operation: 'CHALLENGE_ANALYZE',
        key: idempotencyKey,
        userId: user.id,
        requestBody: { challengeId },
      },
      async () => {
        const { challenge, response } = await this.challenges.analyze(
          user,
          challengeId,
        );
        return {
          challenge: ChallengeView.from(challenge),
          response: ZunoResponseView.from(response),
        };
      },
    );
  }

  /** Step 21 section 28: the adaptive response for rendering. */
  @Get(':challengeId/response')
  @ApiOperation({ summary: 'Get the latest adaptive response' })
  @ApiResponse({ status: 202, description: 'Not analysed yet.' })
  async response(
    @CurrentZunoUser() user: ZunoUser,
    @Param('challengeId', ParseUUIDPipe) challengeId: string,
  ) {
    const response = await this.challenges.latestResponse(user, challengeId);
    return ZunoResponseView.from(response);
  }

  @Post(':challengeId/resolve')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark this WhatNow resolved' })
  @ApiResponse({ status: 409, description: 'Stale version, or illegal transition.' })
  async resolve(
    @CurrentZunoUser() user: ZunoUser,
    @Param('challengeId', ParseUUIDPipe) challengeId: string,
    @Body() dto: ResolveChallengeDto,
  ) {
    const challenge = await this.challenges.resolve(
      user,
      challengeId,
      dto.note,
      dto.version,
    );
    return ChallengeView.from(challenge);
  }

  @Post(':challengeId/reopen')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reopen a resolved WhatNow' })
  async reopen(
    @CurrentZunoUser() user: ZunoUser,
    @Param('challengeId', ParseUUIDPipe) challengeId: string,
    @Body() dto: ReopenChallengeDto,
  ) {
    const challenge = await this.challenges.reopen(
      user,
      challengeId,
      dto.version,
    );
    return ChallengeView.from(challenge);
  }
}
