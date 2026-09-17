import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ZunoLifeSignal } from '../entities/zuno-life-signal.entity';
import { ClockService } from '../../common/services/clock.service';
import { ZunoDomain } from '../../common/enums';
import {
  isConfirmedSignal,
  LifeSignalMateriality,
  LifeSignalStatus,
  LifeSignalType,
  MATERIALITY_RANK,
  SignalPatternType,
  SignalTrendDirection,
  TREND_MIN_OBSERVATIONS,
  UrgencyChange,
} from '../enums';

export interface CategoryTrend {
  /** The life domain this row describes. Null groups uncategorised signals. */
  category: ZunoDomain | null;
  direction: SignalTrendDirection;
  pattern: SignalPatternType;
  /** Confirmed, non-stale signals behind `direction`. Nothing else counts. */
  confirmedCount: number;
  improvingCount: number;
  decliningCount: number;
  /**
   * Signals ZUNO has noticed but cannot vouch for. Reported so the screen can
   * say "3 things to confirm" - never folded into `direction`.
   */
  unconfirmedCount: number;
  lastMaterialChangeAt: string | null;
  /** Always CONFIRMED_ONLY today; present so the client need not assume. */
  basis: 'CONFIRMED_ONLY';
}

export interface CategoryTrendsResult {
  trends: CategoryTrend[];
  /**
   * Whole-journey rollup. Same rules, same exclusions - it is not an average of
   * the rows, it is computed from the same confirmed set.
   */
  overall: SignalTrendDirection;
  totalConfirmed: number;
  totalUnconfirmed: number;
  generatedAt: string;
}

/**
 * Category trends for the My Journey screen. Step 13 sections 38-40.
 *
 * THE ONE RULE THAT SHAPES EVERYTHING HERE
 *
 * Only confirmed, non-stale signals contribute to a direction. Step 13 Rule 3
 * forbids promoting an unconfirmed possibility into something presented as
 * true, and a trend line is about as assertive as a screen gets - "things are
 * getting worse in your career" drawn from three inferences ZUNO made up is
 * precisely the harm the rule exists to prevent. Unconfirmed signals are
 * counted and returned, in their own field, so the screen can invite the user
 * to confirm them. They never move the line.
 *
 * Section 40's other half matters too: a decline is a signal that the plan may
 * not fit, never a judgement about the user (section 41). This service reports
 * direction and count; it attaches no interpretation, and it contains no
 * astrology - trend is arithmetic over stored signals.
 */
@Injectable()
export class SignalTrendService {
  constructor(
    @InjectRepository(ZunoLifeSignal)
    private readonly signals: Repository<ZunoLifeSignal>,
    private readonly clock: ClockService,
  ) {}

  async categoryTrends(
    userId: string,
    challengeId?: string | null,
  ): Promise<CategoryTrendsResult> {
    const rows = await this.signals.find({
      where: {
        user_id: userId,
        ...(challengeId ? { challenge_id: challengeId } : {}),
        deleted_at: IsNull(),
      },
      order: { detected_at: 'ASC' },
      take: 1000,
    });

    const now = this.clock.now();
    const live = rows.filter(
      (row) =>
        row.status !== LifeSignalStatus.ARCHIVED &&
        row.status !== LifeSignalStatus.DISMISSED &&
        !this.isStale(row, now),
    );

    const confirmed = live.filter((row) =>
      isConfirmedSignal(row.confirmation_status),
    );
    const unconfirmed = live.filter(
      (row) => !isConfirmedSignal(row.confirmation_status),
    );

    const categories = new Set<ZunoDomain | null>([
      ...confirmed.map((row) => row.domain),
      ...unconfirmed.map((row) => row.domain),
    ]);

    const trends = Array.from(categories)
      .map((category) =>
        this.buildTrend(
          category,
          confirmed.filter((row) => row.domain === category),
          unconfirmed.filter((row) => row.domain === category),
        ),
      )
      .sort((a, b) => b.confirmedCount - a.confirmedCount);

    return {
      trends,
      overall: this.direction(confirmed),
      totalConfirmed: confirmed.length,
      totalUnconfirmed: unconfirmed.length,
      generatedAt: now.toISOString(),
    };
  }

  // --------------------------------------------------------------- internals

  private buildTrend(
    category: ZunoDomain | null,
    confirmed: ZunoLifeSignal[],
    unconfirmed: ZunoLifeSignal[],
  ): CategoryTrend {
    const improving = confirmed.filter((row) => this.polarity(row) > 0);
    const declining = confirmed.filter((row) => this.polarity(row) < 0);

    const material = confirmed
      .filter(
        (row) =>
          MATERIALITY_RANK[row.materiality] >=
          MATERIALITY_RANK[LifeSignalMateriality.HIGH],
      )
      .sort((a, b) => b.detected_at.getTime() - a.detected_at.getTime());

    return {
      category,
      direction: this.direction(confirmed),
      pattern: this.pattern(confirmed),
      confirmedCount: confirmed.length,
      improvingCount: improving.length,
      decliningCount: declining.length,
      unconfirmedCount: unconfirmed.length,
      lastMaterialChangeAt: material[0]?.detected_at.toISOString() ?? null,
      basis: 'CONFIRMED_ONLY',
    };
  }

  /**
   * Step 13 section 37: individually medium signals can collectively mean
   * something. Below TREND_MIN_OBSERVATIONS there is no pattern worth naming,
   * and saying so is more useful than guessing.
   */
  private direction(confirmed: ZunoLifeSignal[]): SignalTrendDirection {
    if (confirmed.length < TREND_MIN_OBSERVATIONS) {
      return SignalTrendDirection.INSUFFICIENT_EVIDENCE;
    }
    const scores = confirmed.map((row) => this.polarity(row));
    const positive = scores.filter((score) => score > 0).length;
    const negative = scores.filter((score) => score < 0).length;

    if (positive === 0 && negative === 0) return SignalTrendDirection.STEADY;
    if (positive > 0 && negative > 0) {
      const dominant = Math.max(positive, negative);
      const other = Math.min(positive, negative);
      // A clear majority still reads as a direction; a near-tie is honestly
      // mixed rather than rounded into whichever side happens to lead.
      if (dominant < other * 2) return SignalTrendDirection.MIXED;
    }
    if (positive > negative) return SignalTrendDirection.IMPROVING;
    if (negative > positive) return SignalTrendDirection.DECLINING;
    return SignalTrendDirection.STEADY;
  }

  /**
   * Step 13 section 38. REVERSAL is checked before TREND because a run that
   * flips direction at the end is the more interesting description of it.
   */
  private pattern(confirmed: ZunoLifeSignal[]): SignalPatternType {
    if (confirmed.length <= 1) return SignalPatternType.SINGLE_EVENT;

    const ordered = [...confirmed].sort(
      (a, b) => a.detected_at.getTime() - b.detected_at.getTime(),
    );
    const scores = ordered.map((row) => this.polarity(row));
    const nonZero = scores.filter((score) => score !== 0);

    if (nonZero.length >= 2) {
      const last = nonZero[nonZero.length - 1];
      const earlier = nonZero.slice(0, -1);
      if (earlier.every((score) => Math.sign(score) === -Math.sign(last))) {
        return SignalPatternType.REVERSAL;
      }
    }

    if (
      nonZero.length >= TREND_MIN_OBSERVATIONS &&
      nonZero.every((score) => Math.sign(score) === Math.sign(nonZero[0]))
    ) {
      return SignalPatternType.TREND;
    }

    const types = new Set(ordered.map((row) => row.signal_type));
    if (types.size < ordered.length) return SignalPatternType.REPEATED_PATTERN;

    // A confirmed CRITICAL change is a landmark in the journey, not one of a run.
    if (
      ordered.some((row) => row.materiality === LifeSignalMateriality.CRITICAL)
    ) {
      return SignalPatternType.MILESTONE;
    }
    return SignalPatternType.SINGLE_EVENT;
  }

  /**
   * +1 helpful, -1 harder, 0 neutral.
   *
   * Step 13 section 54: "Positive signals are as important as negative
   * signals." A trend engine that only counts setbacks would make ZUNO's
   * picture of a life systematically bleaker than the life.
   */
  private polarity(signal: ZunoLifeSignal): number {
    if (signal.urgency_change === UrgencyChange.DECREASE) return 1;
    if (signal.urgency_change === UrgencyChange.INCREASE) return -1;

    switch (signal.signal_type) {
      case LifeSignalType.OPPORTUNITY:
      case LifeSignalType.PLAN_PROGRESS:
        return 1;
      case LifeSignalType.SETBACK:
      case LifeSignalType.PLAN_BLOCKER:
        return -1;
      default:
        return 0;
    }
  }

  private isStale(signal: ZunoLifeSignal, now: Date): boolean {
    if (signal.status === LifeSignalStatus.STALE) return true;
    if (!signal.stale_after) return false;
    return signal.stale_after.getTime() <= now.getTime();
  }
}
