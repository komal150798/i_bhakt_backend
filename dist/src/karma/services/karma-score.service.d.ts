import { Repository } from 'typeorm';
import { KarmaScoreSummary } from '../entities/karma-score-summary.entity';
import { IKarmaRepository } from '../../core/interfaces/repositories/karma-repository.interface';
export interface KarmaScoreResult {
    karma_score: number;
    total_good_points: number;
    total_bad_points: number;
    total_actions: number;
    good_actions_count: number;
    bad_actions_count: number;
    neutral_actions_count: number;
    trend: 'improving' | 'declining' | 'stable';
    trend_percentage: number;
}
export declare class KarmaScoreService {
    private readonly karmaRepository;
    private readonly scoreSummaryRepository;
    private readonly logger;
    private static readonly SCORE_NORMALIZATION_DIVISOR;
    private static readonly BASE_KARMA_SCORE;
    private static readonly MAX_KARMA_SCORE;
    private static readonly MIN_KARMA_SCORE;
    private static readonly TREND_THRESHOLD;
    constructor(karmaRepository: IKarmaRepository, scoreSummaryRepository: Repository<KarmaScoreSummary>);
    calculateUserKarmaScore(userId: number): Promise<KarmaScoreResult>;
    calculateDailyScore(userId: number, date: Date): Promise<KarmaScoreSummary>;
    calculateWeeklyScore(userId: number, weekStart: Date): Promise<KarmaScoreSummary>;
    calculateMonthlyScore(userId: number, monthStart: Date): Promise<KarmaScoreSummary>;
    private createScoreSummary;
    private calculateTrend;
}
