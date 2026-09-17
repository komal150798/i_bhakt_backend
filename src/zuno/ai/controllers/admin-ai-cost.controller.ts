import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  ZunoResponseInterceptor,
  ZunoPayload,
} from '../../common/interceptors/zuno-response.interceptor';
import { ZunoExceptionFilter } from '../../common/filters/zuno-exception.filter';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { RulebookActorService } from '../../rulebook/services/rulebook-actor.service';
import { AiCostService, CostWindow } from '../services/ai-cost.service';
import { AiPricingService } from '../services/ai-pricing.service';

/** Longest window a single query may span, to keep one request bounded. */
const MAX_WINDOW_DAYS = 370;
const DEFAULT_WINDOW_DAYS = 30;

/**
 * AI spend reporting. Build Rule 91 (usage and cost telemetry).
 *
 * Mounted under `internal` alongside the rulebook admin API for the reason
 * recorded in ZUNO_DECISION_LOG.md item 14: `admin` already belongs to the
 * legacy controllers, and `internal` is in ZUNO_ROUTE_ROOTS so these routes
 * receive the ZUNO response envelope.
 *
 * Admin-only, resolved through the same governance actor service as the
 * rulebook routes - this endpoint exposes commercial data (what the product
 * costs to run) and aggregate user behaviour, so it must never be reachable by
 * a customer token. It deliberately exposes no prompt text, no response text
 * and no user identifiers: only counts and money.
 *
 * All amounts are integer micro-USD (1e-6 USD). The client formats; the API
 * never emits a rounded float that would not re-sum correctly.
 */
@ApiTags('ZUNO - Admin AI Cost')
@ApiBearerAuth('JWT-auth')
@Controller('internal/ai-cost')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class AdminAiCostController {
  constructor(
    private readonly cost: AiCostService,
    private readonly pricing: AiPricingService,
    private readonly actors: RulebookActorService,
  ) {}

  /**
   * The headline figure: what one WhatNow costs to serve.
   *
   * `meta.warning` is populated whenever the report is a lower bound, so a
   * caller that renders only the number still surfaces the caveat.
   */
  @Get('whatnow')
  @ApiOperation({ summary: 'Cost per WhatNow, with distribution' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO 8601. Defaults to 30 days ago.' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO 8601. Defaults to now.' })
  async whatNow(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    await this.requireAdmin(req);
    const window = parseWindow(from, to);
    const report = await this.cost.whatNowCost(window);

    return new ZunoPayload(report, {
      currency: 'USD',
      unit: 'micro_usd',
      warning: warningFor(report.confidence),
    });
  }

  /** Where the money goes, so an expensive operation is visible before the bill. */
  @Get('breakdown')
  @ApiOperation({ summary: 'Spend grouped by operation, model, provider or status' })
  @ApiQuery({
    name: 'by',
    required: false,
    enum: ['operation', 'model', 'provider', 'status'],
  })
  async breakdown(
    @Req() req: any,
    @Query('by') by?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    await this.requireAdmin(req);
    const window = parseWindow(from, to);

    const dimension = {
      operation: 'operation_type',
      model: 'model_name',
      provider: 'model_provider',
      status: 'status',
    }[(by ?? 'operation').toLowerCase()] as
      | 'operation_type'
      | 'model_name'
      | 'model_provider'
      | 'status'
      | undefined;

    if (!dimension) {
      throw new ZunoException(ZunoErrorCode.VALIDATION_ERROR, {
        message: '`by` must be one of: operation, model, provider, status.',
      });
    }

    const rows = await this.cost.breakdownBy(dimension, window);
    return new ZunoPayload(rows, {
      currency: 'USD',
      unit: 'micro_usd',
      by: by ?? 'operation',
      window: { from: window.from.toISOString(), to: window.to.toISOString() },
    });
  }

  /** Daily burn rate. */
  @Get('daily')
  @ApiOperation({ summary: 'Daily spend and WhatNow volume' })
  async daily(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    await this.requireAdmin(req);
    const window = parseWindow(from, to);
    const rows = await this.cost.dailySeries(window);
    return new ZunoPayload(rows, { currency: 'USD', unit: 'micro_usd' });
  }

  /** Everything spent on one challenge, broken down by operation. */
  @Get('challenge/:id')
  @ApiOperation({ summary: 'Total AI spend attributable to one challenge' })
  async challenge(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    await this.requireAdmin(req);
    const report = await this.cost.costForChallenge(id);
    return new ZunoPayload(report, { currency: 'USD', unit: 'micro_usd' });
  }

  /** What price list is in force, so a surprising number can be explained. */
  @Get('pricing')
  @ApiOperation({ summary: 'Active price list version and its provenance' })
  async pricingStatus(@Req() req: any) {
    await this.requireAdmin(req);
    const usingOverride = this.pricing.isUsingOverride();
    return new ZunoPayload({
      pricingVersion: this.pricing.getVersion(),
      source: usingOverride ? 'ZUNO_AI_PRICING_JSON' : 'built-in seed table',
      verifiedByOperator: usingOverride,
      warning: usingOverride
        ? null
        : 'Built-in prices are unverified seed values. Confirm against your provider invoice and set ZUNO_AI_PRICING_JSON before using these figures for pricing decisions.',
    });
  }

  /**
   * Any admin may read cost data; no separate permission exists for it yet.
   *
   * SPEC_GAP, consistent with ZUNO_DECISION_LOG.md item 13: the interim role
   * mapping has no finance/analytics permission, and inventing one would be an
   * unrequested authorization decision (Build Rule 157). Resolving the actor
   * still enforces that the principal is a real, non-deleted admin.
   */
  private async requireAdmin(req: any): Promise<void> {
    await this.actors.resolve(req.user);
  }
}

/** Parses and bounds the reporting window. */
function parseWindow(from?: string, to?: string): CostWindow {
  const now = new Date();

  const parsedTo = from || to ? parseDate(to, now) : now;
  const defaultFrom = new Date(
    parsedTo.getTime() - DEFAULT_WINDOW_DAYS * 86_400_000,
  );
  const parsedFrom = parseDate(from, defaultFrom);

  if (parsedFrom >= parsedTo) {
    throw new ZunoException(ZunoErrorCode.VALIDATION_ERROR, {
      message: '`from` must be earlier than `to`.',
    });
  }

  const spanDays = (parsedTo.getTime() - parsedFrom.getTime()) / 86_400_000;
  if (spanDays > MAX_WINDOW_DAYS) {
    throw new ZunoException(ZunoErrorCode.VALIDATION_ERROR, {
      message: `Window may not exceed ${MAX_WINDOW_DAYS} days.`,
    });
  }

  return { from: parsedFrom, to: parsedTo };
}

function parseDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ZunoException(ZunoErrorCode.VALIDATION_ERROR, {
      message: `"${value}" is not a valid ISO 8601 date.`,
    });
  }
  return parsed;
}

/** One sentence a dashboard can render verbatim, or null when the data is sound. */
function warningFor(confidence: {
  unpricedRuns: number;
  pricesVerifiedByOperator: boolean;
}): string | null {
  const parts: string[] = [];
  if (confidence.unpricedRuns > 0) {
    parts.push(
      `${confidence.unpricedRuns} model call(s) had no configured price and contributed 0 - these totals are a lower bound.`,
    );
  }
  if (!confidence.pricesVerifiedByOperator) {
    parts.push(
      'Prices are unverified built-in seed values; confirm against your provider invoice.',
    );
  }
  return parts.length ? parts.join(' ') : null;
}
