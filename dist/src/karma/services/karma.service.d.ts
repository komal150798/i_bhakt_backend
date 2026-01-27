import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { IKarmaRepository } from '../../core/interfaces/repositories/karma-repository.interface';
import { KarmaEntry } from '../entities/karma-entry.entity';
import { Customer } from '../../users/entities/customer.entity';
import { AIClassificationService } from './ai-classification.service';
import { KarmaScoreService, KarmaScoreResult } from './karma-score.service';
import { PatternAnalysisService, PatternAnalysisResult } from './pattern-analysis.service';
import { HabitRecommendationService, HabitPlan } from './habit-recommendation.service';
import { KarmaStreakService } from './karma-streak.service';
import { PromptService } from '../../common/ai/prompt.service';
export interface AddKarmaActionDto {
    user_id: number;
    action_text: string;
    timestamp?: Date;
    karma_type?: 'good' | 'neutral' | 'challenging' | 'bad';
}
export interface KarmaSummaryDto {
    karma_score: KarmaScoreResult;
    pattern_analysis: PatternAnalysisResult;
    habit_plan: HabitPlan;
    recent_actions: KarmaEntry[];
    insights: {
        weekly_summary?: string;
        monthly_summary?: string;
        prediction?: string;
    };
}
export declare class KarmaService {
    private readonly karmaRepository;
    private readonly customerRepository;
    private readonly aiClassificationService;
    private readonly karmaScoreService;
    private readonly patternAnalysisService;
    private readonly habitRecommendationService;
    private readonly karmaStreakService;
    private readonly promptService;
    private readonly configService;
    private readonly httpService;
    private readonly logger;
    private static readonly SCORE_THRESHOLD_HIGH;
    private static readonly SCORE_THRESHOLD_MEDIUM;
    private static readonly SCORE_NORMALIZATION_DIVISOR;
    private static readonly BASE_KARMA_SCORE;
    private static readonly MAX_KARMA_SCORE;
    private static readonly MIN_KARMA_SCORE;
    private static readonly TREND_THRESHOLD;
    private static readonly PREDICTION_SCORE_INCREMENT;
    private readonly useLLM;
    private readonly openaiApiKey;
    private readonly openaiBaseUrl;
    constructor(karmaRepository: IKarmaRepository, customerRepository: Repository<Customer>, aiClassificationService: AIClassificationService, karmaScoreService: KarmaScoreService, patternAnalysisService: PatternAnalysisService, habitRecommendationService: HabitRecommendationService, karmaStreakService: KarmaStreakService, promptService: PromptService, configService: ConfigService, httpService: HttpService);
    addKarmaAction(dto: AddKarmaActionDto): Promise<KarmaEntry>;
    getUserKarmaSummary(userId: number): Promise<KarmaSummaryDto>;
    getUserHabits(userId: number): Promise<HabitPlan>;
    getUserPatterns(userId: number): Promise<PatternAnalysisResult>;
    getWeeklyInsights(userId: number): Promise<any>;
    getMonthlyInsights(userId: number): Promise<any>;
    private generateInsights;
    private generateWeeklySummaryWithAI;
    private generateMonthlySummaryWithAI;
    private generatePredictionWithAI;
    private callLLMForInsights;
    private generateWeeklySummary;
    private generateMonthlySummary;
    private generatePrediction;
    getDashboardSummary(userId: number): Promise<any>;
    private calculateBreakdown;
    private calculateCategoryBreakdown;
    private getCategoryStatus;
    private calculateGrade;
    private getTimeRange;
    private formatPatterns;
    private formatPatternLabel;
    private getPatternDescription;
    private formatImprovementPlan;
    private generateImprovementSummary;
    private getWeeklyTrend;
    private getMonthlyTrend;
    getKarmaLedger(userId: number): Promise<{
        current_awareness_level: number;
        karma_distribution: {
            supportive: number;
            neutral: number;
            learning: number;
        };
        alignment_tips: string[];
        footer_message: string;
    }>;
    getKarmaInsight(entryId: number, userId: number): Promise<{
        alignment_percentage: number;
        alignment_status: string;
        phase_impact: string;
        insight_description: string;
        footer_message: string;
    }>;
    getKarmaEntryById(entryId: number, userId: number): Promise<any>;
    getKarmaList(userId: number, filter?: 'all' | 'good' | 'neutral' | 'challenging', limit?: number, offset?: number): Promise<{
        total: number;
        entries: Array<{
            id: number;
            karma_type: string;
            action_text: string;
            date: Date;
            score: number;
            category: string | null;
        }>;
    }>;
    getKarmaPatterns(userId: number, filter?: 'week' | 'month' | 'year'): Promise<{
        filter: string;
        awareness_over_time: Array<{
            date: string;
            awareness_level: number;
            good_actions: number;
            neutral_actions: number;
            challenging_actions: number;
            total_actions: number;
        }>;
        footer_message: string;
    }>;
}
