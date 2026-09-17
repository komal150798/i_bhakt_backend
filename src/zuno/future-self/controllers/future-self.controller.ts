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
import { ZunoResponseInterceptor } from '../../common/interceptors/zuno-response.interceptor';
import { ZunoExceptionFilter } from '../../common/filters/zuno-exception.filter';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { FutureSelfService } from '../services/future-self.service';
import {
  FutureSelfView,
  GenerateFutureSelfDto,
  ListFutureSelfQueryDto,
} from '../dtos/future-self.dtos';

/**
 * Future Self API. Step 21 API Contracts section 61, mounted at
 * `/api/v1/future-self` - the global prefix supplies `api/v1`, and
 * `future-self` is already a registered ZUNO route root so the ZUNO envelope
 * applies rather than the legacy iBhakt one.
 *
 * Guarded twice like every other ZUNO controller: JwtAuthGuard proves who the
 * caller is, ZunoUserGuard resolves them to a ZUNO user, and no handler takes a
 * user id (Step 21 Rule 6). Generation is ownership-checked again inside the
 * service against the challenge.
 *
 * Deliberately absent: any parameter that could steer the narrative - a tone
 * selector, an extra prompt, a "make it more optimistic" flag. Roadmap section
 * 71 draws a boundary the user is not able to move from the client, and an
 * endpoint that accepted free text here would be a way around it.
 */
@ApiTags('ZUNO - Future Self')
@ApiBearerAuth('JWT-auth')
@Controller('future-self')
@UseGuards(JwtAuthGuard, ZunoUserGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class ZunoFutureSelfController {
  constructor(
    private readonly futureSelf: FutureSelfService,
    private readonly idempotency: IdempotencyService,
  ) {}

  /**
   * Step 21 section 61: `POST /api/v1/future-self`.
   *
   * Idempotency-keyed because generation costs a model call and a mobile client
   * that times out and retries must not produce two narratives for the same
   * period (Step 21 section 16).
   *
   * 503 is a real outcome here, not just a plumbing failure: a generation that
   * crossed the section 71 boundary is refused rather than repaired, and the
   * honest answer is that we could not produce something we trusted.
   */
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Generate a grounded Future Self reflection' })
  @ApiResponse({ status: 201, description: 'Narrative generated and grounded.' })
  @ApiResponse({ status: 403, description: 'Blocked by the safety policy.' })
  @ApiResponse({
    status: 503,
    description:
      'Could not produce a narrative we were confident was grounded, or the intelligence layer is unavailable.',
  })
  async generate(
    @CurrentZunoUser() user: ZunoUser,
    @Body() dto: GenerateFutureSelfDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.idempotency.execute(
      {
        operation: 'FUTURE_SELF_GENERATE',
        key: idempotencyKey,
        userId: user.id,
        requestBody: dto,
      },
      async () => {
        const { narrative, sources } = await this.futureSelf.generate({
          userId: user.id,
          challengeId: dto.challengeId ?? null,
          mode: dto.mode,
        });
        // Spread rather than returning the class instance directly:
        // IdempotencyService.execute stores a `Record<string, unknown>`, and a
        // class type has no implicit index signature. The spread produces a
        // plain object with identical fields.
        return { ...FutureSelfView.from(narrative, sources.length) };
      },
    );
  }

  /** Past reflections, newest first. */
  @Get()
  @ApiOperation({ summary: 'Past Future Self reflections' })
  async list(
    @CurrentZunoUser() user: ZunoUser,
    @Query() query: ListFutureSelfQueryDto,
  ) {
    const rows = await this.futureSelf.listForUser(user.id, {
      challengeId: query.challengeId,
      mode: query.mode,
      limit: query.limit,
    });
    // Source counts are not loaded for the list view; the count is a detail of
    // one narrative, and eager-loading it for every row would be N+1 for a
    // field the list does not need.
    return rows.map((row) => FutureSelfView.from(row, 0));
  }

  /** Step 21 section 61: `GET /api/v1/future-self/{futureSelfId}`. */
  @Get(':futureSelfId')
  @ApiOperation({ summary: 'One Future Self reflection' })
  @ApiResponse({ status: 404, description: 'Not found, or not yours.' })
  async detail(
    @CurrentZunoUser() user: ZunoUser,
    @Param('futureSelfId', ParseUUIDPipe) futureSelfId: string,
  ) {
    const narrative = await this.futureSelf.findOwned(user.id, futureSelfId);
    await this.futureSelf.markViewed(user.id, narrative.id);
    return FutureSelfView.from(narrative, narrative.sources?.length ?? 0);
  }
}
