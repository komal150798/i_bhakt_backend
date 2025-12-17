import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { KarmaEntry } from '../entities/karma-entry.entity';
import { KarmaScoreSummary } from '../entities/karma-score-summary.entity';
import { IKarmaRepository } from '../../core/interfaces/repositories/karma-repository.interface';

export interface KarmaScoreResult {
  karma_score: number; // 0-100 normalized
  total_good_points: number;
  total_bad_points: number;
  total_actions: number;
  good_actions_count: number;
  bad_actions_count: number;
  neutral_actions_count: number;
  trend: 'improving' | 'declining' | 'stable';
  trend_percentage: number;
}

@Injectable()
export class KarmaScoreService {
  private readonly logger = new Logger(KarmaScoreService.name);

  constructor(
    @Inject('IKarmaRepository')
    private readonly karmaRepository: IKarmaRepository,
    @InjectRepository(KarmaScoreSummary)
    private readonly scoreSummaryRepository: Repository<KarmaScoreSummary>,
  ) {}

  /**
   * Calculate karma score for a user
   * Formula: normalize(sum(good_points) - sum(bad_points)) to 0-100
   */
  async calculateUserKarmaScore(userId: number): Promise<KarmaScoreResult> {
    const allEntries = await this.karmaRepository.findByUserId(userId);

    let totalGoodPoints = 0;
    let totalBadPoints = 0;
    let goodCount = 0;
    let badCount = 0;
    let neutralCount = 0;

    for (const entry of allEntries) {
      const score = Number(entry.score) || 0;

      if (entry.karma_type === 'good') {
        totalGoodPoints += Math.abs(score);
        goodCount++;
      } else if (entry.karma_type === 'bad') {
        totalBadPoints += Math.abs(score);
        badCount++;
      } else {
        neutralCount++;
      }
    }

    // Calculate raw score (can be negative)
    const rawScore = totalGoodPoints - totalBadPoints;

    // Normalize to 0-100 scale
    // Base: 50 (neutral)
    // Max positive: 100 (if only good actions)
    // Max negative: 0 (if only bad actions)
    const normalizedScore = Math.max(0, Math.min(100, 50 + (rawScore / 10)));

    // Calculate trend by comparing with previous period
    const trend = await this.calculateTrend(userId, normalizedScore);

    return {
      karma_score: Math.round(normalizedScore * 100) / 100,
      total_good_points: totalGoodPoints,
      total_bad_points: totalBadPoints,
      total_actions: allEntries.length,
      good_actions_count: goodCount,
      bad_actions_count: badCount,
      neutral_actions_count: neutralCount,
      trend: trend.direction,
      trend_percentage: trend.percentage,
    };
  }

  /**
   * Calculate daily karma score summary
   */
  async calculateDailyScore(userId: number, date: Date): Promise<KarmaScoreSummary> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await this.karmaRepository.findByUserId(userId);
    const dayEntries = entries.filter(
      (e) =>
        new Date(e.entry_date) >= startOfDay && new Date(e.entry_date) <= endOfDay,
    );

    return this.createScoreSummary(userId, 'daily', startOfDay, endOfDay, dayEntries);
  }

  /**
   * Calculate weekly karma score summary
   */
  async calculateWeeklyScore(userId: number, weekStart: Date): Promise<KarmaScoreSummary> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const entries = await this.karmaRepository.findByUserId(userId);
    const weekEntries = entries.filter(
      (e) =>
        new Date(e.entry_date) >= weekStart && new Date(e.entry_date) <= weekEnd,
    );

    return this.createScoreSummary(userId, 'weekly', weekStart, weekEnd, weekEntries);
  }

  /**
   * Calculate monthly karma score summary
   */
  async calculateMonthlyScore(userId: number, monthStart: Date): Promise<KarmaScoreSummary> {
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0); // Last day of month
    monthEnd.setHours(23, 59, 59, 999);

    const entries = await this.karmaRepository.findByUserId(userId);
    const monthEntries = entries.filter(
      (e) =>
        new Date(e.entry_date) >= monthStart && new Date(e.entry_date) <= monthEnd,
    );

    return this.createScoreSummary(userId, 'monthly', monthStart, monthEnd, monthEntries);
  }

  /**
   * Create or update score summary
   */
  private async createScoreSummary(
    userId: number,
    periodType: 'daily' | 'weekly' | 'monthly',
    periodStart: Date,
    periodEnd: Date,
    entries: any[],
  ): Promise<KarmaScoreSummary> {
    let totalGoodPoints = 0;
    let totalBadPoints = 0;
    let goodCount = 0;
    let badCount = 0;
    let neutralCount = 0;

    for (const entry of entries) {
      const score = Number(entry.score) || 0;

      if (entry.karma_type === 'good') {
        totalGoodPoints += Math.abs(score);
        goodCount++;
      } else if (entry.karma_type === 'bad') {
        totalBadPoints += Math.abs(score);
        badCount++;
      } else {
        neutralCount++;
      }
    }

    const rawScore = totalGoodPoints - totalBadPoints;
    const normalizedScore = Math.max(0, Math.min(100, 50 + rawScore / 10));

    // Check if summary already exists
    const existing = await this.scoreSummaryRepository.findOne({
      where: {
        user_id: userId,
        period_type: periodType,
        period_start: periodStart,
      },
    });

    if (existing) {
      existing.karma_score = normalizedScore;
      existing.total_good_actions = goodCount;
      existing.total_bad_actions = badCount;
      existing.total_neutral_actions = neutralCount;
      existing.total_positive_points = totalGoodPoints;
      existing.total_negative_points = totalBadPoints;
      existing.period_end = periodEnd;
      return this.scoreSummaryRepository.save(existing);
    }

    const summary = this.scoreSummaryRepository.create({
      user_id: userId,
      period_type: periodType,
      period_start: periodStart,
      period_end: periodEnd,
      karma_score: normalizedScore,
      total_good_actions: goodCount,
      total_bad_actions: badCount,
      total_neutral_actions: neutralCount,
      total_positive_points: totalGoodPoints,
      total_negative_points: totalBadPoints,
    });

    return this.scoreSummaryRepository.save(summary);
  }

  /**
   * Calculate trend by comparing current score with previous period
   */
  private async calculateTrend(
    userId: number,
    currentScore: number,
  ): Promise<{ direction: 'improving' | 'declining' | 'stable'; percentage: number }> {
    // Get last week's summary
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastWeekSummary = await this.scoreSummaryRepository.findOne({
      where: {
        user_id: userId,
        period_type: 'weekly',
        period_start: Between(
          new Date(lastWeek.setDate(lastWeek.getDate() - 7)),
          new Date(lastWeek.setDate(lastWeek.getDate() + 7)),
        ),
      },
      order: { period_start: 'DESC' },
    });

    if (!lastWeekSummary) {
      return { direction: 'stable', percentage: 0 };
    }

    const previousScore = Number(lastWeekSummary.karma_score);
    const difference = currentScore - previousScore;
    const percentage = Math.abs((difference / previousScore) * 100);

    if (difference > 2) {
      return { direction: 'improving', percentage: Math.round(percentage) };
    } else if (difference < -2) {
      return { direction: 'declining', percentage: Math.round(percentage) };
    } else {
      return { direction: 'stable', percentage: Math.round(percentage) };
    }
  }
}

