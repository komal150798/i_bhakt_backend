import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
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

import { KarmaService } from '../services/karma.service';
import {
  CorrectKarmaEntryDto,
  CreateKarmaEntryDto,
  KarmaEntryCreatedView,
  KarmaEntryDetailView,
  KarmaEntryView,
  KarmaSummaryView,
  ListKarmaQueryDto,
} from '../dtos/karma.dtos';

/**
 * Karma Ledger API. Step 21 API Contracts section 54.
 *
 *   GET    /api/v1/karma
 *   POST   /api/v1/karma
 *   GET    /api/v1/karma/summary
 *   GET    /api/v1/karma/{entryId}
 *   PATCH  /api/v1/karma/{entryId}
 *   DELETE /api/v1/karma/{entryId}
 *
 * Mounted at the `karma` root, which `common/zuno-routes.ts` already lists, so
 * responses use the ZUNO `{ data, meta }` envelope rather than the legacy
 * iBhakt one.
 *
 * Guarded twice on every route: JwtAuthGuard proves identity, ZunoUserGuard
 * resolves the ZUNO user and makes that the only identity a handler can see.
 * No handler accepts a user id as a parameter, and no handler can be reached
 * without both (Step 21 Rule 6, Roadmap section 56's "strict ownership").
 *
 * What this controller deliberately does not expose:
 *   - any route returning another user's entries, aggregated or otherwise
 *   - any leaderboard, ranking or comparison (Step 17 sections 68, 106)
 *   - any way for a client to supply points (Step 17 Rule 3)
 *   - any way to change visibility (Step 17 sections 3, 69)
 */
@ApiTags('ZUNO - Karma Ledger')
@ApiBearerAuth('JWT-auth')
@Controller('karma')
@UseGuards(JwtAuthGuard, ZunoUserGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class ZunoKarmaController {
  constructor(
    private readonly karma: KarmaService,
    private readonly idempotency: IdempotencyService,
  ) {}

  /**
   * Step 21 section 55 / Step 17 section 87: record an action the user
   * describes themselves.
   *
   * Idempotency-Key is honoured because Build Rule 27 names karma creation
   * specifically: a mobile client that times out and retries must not end up
   * with the same action in the ledger twice.
   */
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Record something you did, in your own words' })
  @ApiResponse({ status: 201, description: 'Recorded.' })
  @ApiResponse({ status: 403, description: 'Routed to safety instead of scored.' })
  async create(
    @CurrentZunoUser() user: ZunoUser,
    @Body() dto: CreateKarmaEntryDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.idempotency.execute(
      {
        operation: 'KARMA_ENTRY_CREATE',
        key: idempotencyKey,
        userId: user.id,
        requestBody: dto,
      },
      async () => {
        const { entry, confirmationRequired, explanation } =
          await this.karma.createUserEntry({
            userId: user.id,
            text: dto.text,
            occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : null,
            challengeId: dto.challengeId ?? null,
          });
        return {
          ...KarmaEntryCreatedView.from(entry, confirmationRequired, explanation),
        };
      },
    );
  }

  /** Step 21 section 54 with the filters of Step 17 section 72. */
  @Get()
  @ApiOperation({ summary: 'List your ledger, newest first' })
  async list(
    @CurrentZunoUser() user: ZunoUser,
    @Query() query: ListKarmaQueryDto,
  ) {
    const { items, nextCursor } = await this.karma.list({
      userId: user.id,
      category: query.category,
      classification: query.classification,
      source: query.source,
      challengeId: query.challengeId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      limit: query.limit ?? 20,
      cursor: query.cursor,
    });

    return new ZunoPayload(items.map(KarmaEntryView.from), {
      nextCursor,
      hasMore: nextCursor !== null,
    });
  }

  /**
   * Step 17 sections 35-37: today and this week, framed as progress.
   *
   * Declared before `:entryId` so that `summary` is never parsed as an id.
   */
  @Get('summary')
  @ApiOperation({ summary: 'Your recent ledger activity and observed patterns' })
  async summary(@CurrentZunoUser() user: ZunoUser) {
    return KarmaSummaryView.from(await this.karma.summary(user.id));
  }

  @Get(':entryId')
  @ApiOperation({ summary: 'Read one ledger entry, with why it scored as it did' })
  @ApiResponse({ status: 404, description: 'Not found, or not yours.' })
  async detail(
    @CurrentZunoUser() user: ZunoUser,
    @Param('entryId', ParseUUIDPipe) entryId: string,
  ) {
    return KarmaEntryDetailView.fromDetail(
      await this.karma.findOwned(user.id, entryId),
    );
  }

  /**
   * Step 21 section 57 / Step 17 sections 55 and 101: the user disagrees.
   *
   * This is a first-class path, not an escape hatch. Step 17 section 109 lists
   * immutable AI judgement as an anti-pattern, and the revision history this
   * writes is what makes a correction auditable rather than a quiet overwrite.
   */
  @Patch(':entryId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Correct how an entry was read' })
  @ApiResponse({ status: 409, description: 'Stale version.' })
  async correct(
    @CurrentZunoUser() user: ZunoUser,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Body() dto: CorrectKarmaEntryDto,
  ) {
    const entry = await this.karma.correct(user.id, entryId, {
      classification: dto.classification,
      category: dto.category,
      intent: dto.intent,
      text: dto.text,
      accepted: dto.classificationFeedback?.accepted,
      comment: dto.classificationFeedback?.comment,
      version: dto.version,
    });
    return KarmaEntryDetailView.fromDetail(entry);
  }

  /**
   * Step 17 sections 56 and 71: remove an entry.
   *
   * Erases the user's words and stops the entry counting anywhere, while the
   * row itself survives so the ledger's own history stays coherent.
   */
  @Delete(':entryId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove an entry from your ledger' })
  @ApiResponse({ status: 204, description: 'Removed.' })
  async remove(
    @CurrentZunoUser() user: ZunoUser,
    @Param('entryId', ParseUUIDPipe) entryId: string,
  ): Promise<void> {
    await this.karma.remove(user.id, entryId);
  }
}
