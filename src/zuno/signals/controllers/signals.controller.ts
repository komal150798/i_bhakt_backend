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
import {
  ZunoPayload,
  ZunoResponseInterceptor,
} from '../../common/interceptors/zuno-response.interceptor';
import { ZunoExceptionFilter } from '../../common/filters/zuno-exception.filter';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { LifeSignalService } from '../services/life-signal.service';
import { SignalTrendService } from '../services/signal-trend.service';
import {
  ConfirmLifeSignalDto,
  CreateLifeSignalDto,
  LifeSignalView,
  ListLifeSignalsQueryDto,
  TrendsQueryDto,
} from '../dtos/signal.dtos';

/**
 * Life Signal API. Step 13 sections 85-86, Step 21 sections 41-43.
 *
 * ROUTE ROOT
 *
 * Mounted at `/api/v1/signals`. Step 21 section 41 nests these under
 * `/challenges/{challengeId}/life-signals`, and that nesting is not used here
 * for two reasons. The challenges controller is owned by another phase and is
 * out of scope for this change, and a Life Signal may legitimately arrive
 * before ZUNO knows which challenge it belongs to (Step 13 section 12 asks
 * "WHICH challenge does it affect?" as a question to answer, not a
 * precondition) - a nested route cannot express that. `challengeId` is carried
 * in the body or query instead. The response bodies are unchanged from the
 * contract. WIRING.md records the deviation.
 *
 * Both guards are always present: JwtAuthGuard establishes who is calling,
 * ZunoUserGuard resolves the ZUNO user, and no handler accepts a user id
 * (Step 21 Rule 6).
 */
@ApiTags('ZUNO - Life Signals')
@ApiBearerAuth('JWT-auth')
@Controller('signals')
@UseGuards(JwtAuthGuard, ZunoUserGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class ZunoSignalsController {
  constructor(
    private readonly signals: LifeSignalService,
    private readonly trends: SignalTrendService,
    private readonly idempotency: IdempotencyService,
  ) {}

  /**
   * Step 21 section 42: report something that changed.
   *
   * Idempotent by key because Step 13 section 88 is explicit that one incoming
   * event must not produce multiple downstream realignments, and a mobile
   * client retrying a timed-out POST is the common way that happens. The
   * content fingerprint inside the service is the second line of defence.
   */
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Tell ZUNO what changed' })
  @ApiResponse({ status: 201, description: 'Recorded, or acknowledged as no change.' })
  @ApiResponse({ status: 403, description: 'Blocked by the safety policy.' })
  async create(
    @CurrentZunoUser() user: ZunoUser,
    @Body() dto: CreateLifeSignalDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.idempotency.execute(
      {
        operation: 'LIFE_SIGNAL_CREATE',
        key: idempotencyKey,
        userId: user.id,
        requestBody: dto,
      },
      async () => {
        const result = await this.signals.record({
          user,
          challengeId: dto.challengeId ?? null,
          signalType: dto.signalType,
          source: dto.source,
          statement: dto.value.statement,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : null,
        });

        return {
          signalId: result.signal?.id ?? null,
          confirmationStatus: result.signal?.confirmation_status ?? null,
          realignmentRecommended: result.realignmentRecommended,
          clarificationRequired: result.clarificationRequired,
          acknowledgedOnly: result.ignoredAsNoise,
          duplicateOfExisting: result.deduplicated,
          interpretationUnavailable: result.interpretationUnavailable,
          signal: result.signal ? LifeSignalView.from(result.signal) : null,
        };
      },
    );
  }

  /**
   * Step 21 section 41: the signal list, Step 13 section 83: the signal feed.
   *
   * Returns two arrays rather than one flagged list. Step 13 Rule 3 is a
   * product guarantee, and a single array makes honouring it optional for the
   * client - one forgotten conditional and an inference renders as a fact.
   */
  @Get()
  @ApiOperation({ summary: 'List what has changed, confirmed separately from inferred' })
  async list(
    @CurrentZunoUser() user: ZunoUser,
    @Query() query: ListLifeSignalsQueryDto,
  ) {
    const separated = await this.signals.listSeparated({
      userId: user.id,
      challengeId: query.challengeId ?? null,
      status: query.status,
      limit: query.limit ?? 20,
    });

    return new ZunoPayload(
      {
        confirmed: separated.confirmed.map(LifeSignalView.from),
        unconfirmed: separated.unconfirmed.map(LifeSignalView.from),
      },
      {
        confirmedCount: separated.confirmed.length,
        unconfirmedCount: separated.unconfirmed.length,
      },
    );
  }

  /**
   * Category trends for the My Journey screen. Step 13 sections 38-40.
   *
   * Declared before `:signalId` on purpose - Nest matches routes in
   * declaration order, and `trends` would otherwise be swallowed by the uuid
   * parameter route (and then rejected by ParseUUIDPipe).
   */
  @Get('trends')
  @ApiOperation({ summary: 'Category trends for My Journey' })
  async categoryTrends(
    @CurrentZunoUser() user: ZunoUser,
    @Query() query: TrendsQueryDto,
  ) {
    return this.trends.categoryTrends(user.id, query.challengeId ?? null);
  }

  @Get(':signalId')
  @ApiOperation({ summary: 'Get one signal' })
  @ApiResponse({ status: 404, description: 'Not found, or not yours.' })
  async detail(
    @CurrentZunoUser() user: ZunoUser,
    @Param('signalId', ParseUUIDPipe) signalId: string,
  ) {
    const signal = await this.signals.findOwned(user.id, signalId);
    return LifeSignalView.from(signal);
  }

  /**
   * Step 21 section 41: confirm. This is the gate a user-reported signal has to
   * pass before anything downstream may act on it.
   */
  @Post(':signalId/confirm')
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirm that this really happened' })
  @ApiResponse({ status: 409, description: 'Already rejected.' })
  async confirm(
    @CurrentZunoUser() user: ZunoUser,
    @Param('signalId', ParseUUIDPipe) signalId: string,
    @Body() dto: ConfirmLifeSignalDto,
  ) {
    const signal = await this.signals.confirm(user, signalId, dto.note);
    return LifeSignalView.from(signal);
  }

  /**
   * Roadmap section 66: "user can reject candidate signal".
   *
   * Not part of Step 21's three routes, and added deliberately: the acceptance
   * criterion requires it, and without it a user can only ever agree with
   * ZUNO's reading of their life.
   */
  @Post(':signalId/reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'Tell ZUNO this is not right' })
  async reject(
    @CurrentZunoUser() user: ZunoUser,
    @Param('signalId', ParseUUIDPipe) signalId: string,
    @Body() dto: ConfirmLifeSignalDto,
  ) {
    const signal = await this.signals.reject(user, signalId, dto.note);
    return LifeSignalView.from(signal);
  }
}
