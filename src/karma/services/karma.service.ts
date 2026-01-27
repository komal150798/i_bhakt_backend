import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IKarmaRepository } from '../../core/interfaces/repositories/karma-repository.interface';
import { KarmaEntry } from '../entities/karma-entry.entity';
import { Customer } from '../../users/entities/customer.entity';
import { AIClassificationService, AIClassificationResult } from './ai-classification.service';
import { KarmaScoreService, KarmaScoreResult } from './karma-score.service';
import { PatternAnalysisService, PatternAnalysisResult } from './pattern-analysis.service';
import { HabitRecommendationService, HabitPlan } from './habit-recommendation.service';
import { KarmaStreakService, KarmaStreak } from './karma-streak.service';
import { KarmaType } from '../../common/enums/karma-type.enum';
import { PromptService } from '../../common/ai/prompt.service';

export interface AddKarmaActionDto {
  user_id: number;
  action_text: string;
  timestamp?: Date;
  karma_type?: 'good' | 'neutral' | 'challenging' | 'bad'; // Optional: user can specify type (challenging = bad)
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

@Injectable()
export class KarmaService {
  private readonly logger = new Logger(KarmaService.name);

  // Constants for karma scoring
  private static readonly SCORE_THRESHOLD_HIGH = 70;
  private static readonly SCORE_THRESHOLD_MEDIUM = 50;
  private static readonly SCORE_NORMALIZATION_DIVISOR = 10;
  private static readonly BASE_KARMA_SCORE = 50;
  private static readonly MAX_KARMA_SCORE = 100;
  private static readonly MIN_KARMA_SCORE = 0;
  private static readonly TREND_THRESHOLD = 2;
  private static readonly PREDICTION_SCORE_INCREMENT = 10;

  private readonly useLLM: boolean;
  private readonly openaiApiKey: string;
  private readonly openaiBaseUrl: string;

  constructor(
    @Inject('IKarmaRepository')
    private readonly karmaRepository: IKarmaRepository,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly aiClassificationService: AIClassificationService,
    private readonly karmaScoreService: KarmaScoreService,
    private readonly patternAnalysisService: PatternAnalysisService,
    private readonly habitRecommendationService: HabitRecommendationService,
    private readonly karmaStreakService: KarmaStreakService,
    private readonly promptService: PromptService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    this.useLLM = !!this.openaiApiKey;
  }

  /**
   * Add a new karma action (main entry point)
   */
  async addKarmaAction(dto: AddKarmaActionDto): Promise<KarmaEntry> {
    if (!dto.action_text || dto.action_text.trim().length === 0) {
      throw new BadRequestException('Action text is required');
    }

    // Validate that user exists in Customer table (required for foreign key)
    const customer = await this.customerRepository.findOne({
      where: { id: dto.user_id, is_deleted: false },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${dto.user_id} not found. Please ensure the user exists in the customer table.`,
      );
    }

    // If user specified karma_type, use it; otherwise classify using AI
    let karmaType: KarmaType;
    let classification: AIClassificationResult;

    if (dto.karma_type) {
      // User specified type - map challenging to bad
      const userTypeMap: Record<string, KarmaType> = {
        good: KarmaType.GOOD,
        neutral: KarmaType.NEUTRAL,
        challenging: KarmaType.BAD,
        bad: KarmaType.BAD,
      };
      karmaType = userTypeMap[dto.karma_type] || KarmaType.NEUTRAL;
      
      // Still classify for AI analysis, but use user's type
      classification = await this.aiClassificationService.classifyAction(
        dto.action_text,
        dto.user_id,
      );
      // Override type with user's selection
      classification.type = dto.karma_type === 'challenging' ? 'bad' : dto.karma_type;
    } else {
      // Auto-classify using AI
      classification = await this.aiClassificationService.classifyAction(
        dto.action_text,
        dto.user_id,
      );
      
      // Map classification to KarmaType enum
      const karmaTypeMap: Record<string, KarmaType> = {
        good: KarmaType.GOOD,
        bad: KarmaType.BAD,
        neutral: KarmaType.NEUTRAL,
      };
      karmaType = karmaTypeMap[classification.type] || KarmaType.NEUTRAL;
    }

    // Create karma entry
    const entry = await this.karmaRepository.create({
      user_id: dto.user_id,
      text: dto.action_text,
      karma_type: karmaType,
      score: classification.weight,
      category_slug: classification.category,
      category_name: classification.category,
      entry_date: dto.timestamp || new Date(),
      ai_analysis: {
        type: classification.type,
        confidence: classification.confidence,
        emotion: classification.emotion,
        category: classification.category,
        weight: classification.weight,
        pattern_key: classification.pattern_key,
        reasoning: classification.reasoning,
        habit_recommendation: classification.habit_recommendation,
      },
      metadata: {},
    });

    this.logger.log(
      `Karma action added for user ${dto.user_id}: ${classification.type} (confidence: ${classification.confidence}%)`,
    );

    return entry;
  }

  /**
   * Get comprehensive karma summary for a user
   */
  async getUserKarmaSummary(userId: number): Promise<KarmaSummaryDto> {
    // Get karma score
    const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);

    // Get pattern analysis
    const patternAnalysis = await this.patternAnalysisService.analyzeUserPatterns(userId);

    // Generate habit plan
    const habitPlan = await this.habitRecommendationService.generateHabitPlan(
      userId,
      patternAnalysis,
    );

    // Get recent actions
    const recentActions = await this.karmaRepository.findByUserId(userId);
    const recent = recentActions.slice(0, 10);

    // Generate insights
    const insights = await this.generateInsights(userId, karmaScore, patternAnalysis);

    return {
      karma_score: karmaScore,
      pattern_analysis: patternAnalysis,
      habit_plan: habitPlan,
      recent_actions: recent,
      insights,
    };
  }

  /**
   * Get user's habit recommendations
   */
  async getUserHabits(userId: number): Promise<HabitPlan> {
    const patternAnalysis = await this.patternAnalysisService.analyzeUserPatterns(userId);
    return this.habitRecommendationService.generateHabitPlan(userId, patternAnalysis);
  }

  /**
   * Get user's karma patterns
   */
  async getUserPatterns(userId: number): Promise<PatternAnalysisResult> {
    return this.patternAnalysisService.analyzeUserPatterns(userId);
  }

  /**
   * Get weekly karma insights
   */
  async getWeeklyInsights(userId: number): Promise<any> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    weekStart.setHours(0, 0, 0, 0);

    const summary = await this.karmaScoreService.calculateWeeklyScore(userId, weekStart);
    const patternAnalysis = await this.patternAnalysisService.analyzeUserPatterns(userId);

    return {
      period: 'weekly',
      period_start: weekStart,
      karma_score: Number(summary.karma_score),
      total_actions: summary.total_good_actions + summary.total_bad_actions + summary.total_neutral_actions,
      good_actions: summary.total_good_actions,
      bad_actions: summary.total_bad_actions,
      top_patterns: patternAnalysis.detected_patterns.slice(0, 5),
      summary_text: summary.ai_summary || await this.generateWeeklySummaryWithAI(summary, patternAnalysis, weekStart) || this.generateWeeklySummary(summary, patternAnalysis),
      prediction: summary.prediction || await this.generatePredictionWithAI(summary) || this.generatePrediction(summary),
    };
  }

  /**
   * Get monthly karma insights
   */
  async getMonthlyInsights(userId: number): Promise<any> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const summary = await this.karmaScoreService.calculateMonthlyScore(userId, monthStart);
    const patternAnalysis = await this.patternAnalysisService.analyzeUserPatterns(userId);

    return {
      period: 'monthly',
      period_start: monthStart,
      karma_score: Number(summary.karma_score),
      total_actions: summary.total_good_actions + summary.total_bad_actions + summary.total_neutral_actions,
      good_actions: summary.total_good_actions,
      bad_actions: summary.total_bad_actions,
      top_patterns: patternAnalysis.detected_patterns.slice(0, 5),
      summary_text: summary.ai_summary || await this.generateMonthlySummaryWithAI(summary, patternAnalysis, monthStart) || this.generateMonthlySummary(summary, patternAnalysis),
      prediction: summary.prediction || await this.generatePredictionWithAI(summary) || this.generatePrediction(summary),
    };
  }

  /**
   * Generate insights for user
   */
  private async generateInsights(
    userId: number,
    karmaScore: KarmaScoreResult,
    patternAnalysis: PatternAnalysisResult,
  ): Promise<{
    weekly_summary?: string;
    monthly_summary?: string;
    prediction?: string;
  }> {
    const weekly = await this.getWeeklyInsights(userId);
    const monthly = await this.getMonthlyInsights(userId);

    return {
      weekly_summary: weekly.summary_text,
      monthly_summary: monthly.summary_text,
      prediction: karmaScore.trend === 'improving'
        ? `Your karma is improving! If you continue this pattern, your score could reach ${Math.min(KarmaService.MAX_KARMA_SCORE, karmaScore.karma_score + KarmaService.PREDICTION_SCORE_INCREMENT)} in the next month.`
        : karmaScore.trend === 'declining'
          ? `Your karma shows a declining trend. Focus on your habit plan to reverse this pattern.`
          : `Your karma is stable. Continue practicing your recommended habits for steady growth.`,
    };
  }

  /**
   * Generate weekly summary using AI (database-driven prompts)
   */
  private async generateWeeklySummaryWithAI(
    summary: any,
    patternAnalysis: PatternAnalysisResult,
    weekStart: Date,
  ): Promise<string | null> {
    if (!this.useLLM) return null;

    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const prompt = await this.promptService.getPrompt(
        'karma.insights.weekly.gpt5.1',
        {
          week_start: weekStart.toISOString().split('T')[0],
          week_end: weekEnd.toISOString().split('T')[0],
          total_actions: (summary.total_good_actions + summary.total_bad_actions + summary.total_neutral_actions).toString(),
          good_actions: summary.total_good_actions?.toString() || '0',
          bad_actions: summary.total_bad_actions?.toString() || '0',
          neutral_actions: summary.total_neutral_actions?.toString() || '0',
          karma_score: summary.karma_score?.toFixed(1) || '0',
          dominant_patterns: patternAnalysis.detected_patterns.slice(0, 3).map(p => p.pattern_name).join(', '),
          strengths: patternAnalysis.strengths.join(', ') || 'None',
          weaknesses: patternAnalysis.weaknesses.join(', ') || 'None',
        }
      );

      const response = await this.callLLMForInsights(prompt.finalText);
      return response || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to generate weekly summary with AI: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      return null;
    }
  }

  /**
   * Generate monthly summary using AI (database-driven prompts)
   */
  private async generateMonthlySummaryWithAI(
    summary: any,
    patternAnalysis: PatternAnalysisResult,
    monthStart: Date,
  ): Promise<string | null> {
    if (!this.useLLM) return null;

    try {
      const prompt = await this.promptService.getPrompt(
        'karma.insights.monthly.gpt5.1',
        {
          month: (monthStart.getMonth() + 1).toString(),
          year: monthStart.getFullYear().toString(),
          total_actions: (summary.total_good_actions + summary.total_bad_actions + summary.total_neutral_actions).toString(),
          good_actions: summary.total_good_actions?.toString() || '0',
          bad_actions: summary.total_bad_actions?.toString() || '0',
          karma_score: summary.karma_score?.toFixed(1) || '0',
          trend: 'stable', // Can be calculated from previous month
          dominant_patterns: patternAnalysis.detected_patterns.slice(0, 3).map(p => p.pattern_name).join(', '),
          strengths: patternAnalysis.strengths.join(', ') || 'None',
          weaknesses: patternAnalysis.weaknesses.join(', ') || 'None',
          habit_recommendations: patternAnalysis.weaknesses.slice(0, 3).join(', ') || 'None',
        }
      );

      const response = await this.callLLMForInsights(prompt.finalText);
      return response || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to generate monthly summary with AI: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      return null;
    }
  }

  /**
   * Generate prediction using AI
   */
  private async generatePredictionWithAI(summary: any): Promise<string | null> {
    if (!this.useLLM) return null;

    try {
      // Use monthly insights prompt for prediction
      const prompt = await this.promptService.getPrompt(
        'karma.insights.monthly.gpt5.1',
        {
          month: new Date().getMonth().toString(),
          year: new Date().getFullYear().toString(),
          total_actions: (summary.total_good_actions + summary.total_bad_actions).toString(),
          good_actions: summary.total_good_actions?.toString() || '0',
          bad_actions: summary.total_bad_actions?.toString() || '0',
          karma_score: summary.karma_score?.toFixed(1) || '0',
          trend: 'stable',
          dominant_patterns: '',
          strengths: '',
          weaknesses: '',
          habit_recommendations: '',
        }
      );

      const response = await this.callLLMForInsights(prompt.finalText);
      // Extract prediction part if available, otherwise use fallback
      return response || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to generate prediction with AI: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      return null;
    }
  }

  /**
   * Call LLM for insights generation
   */
  private async callLLMForInsights(prompt: string): Promise<string | null> {
    try {
      const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
      const apiUrl = `${this.openaiBaseUrl}/chat/completions`;

      const requestBody = {
        model,
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
      };

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestBody, {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        })
      );

      return response.data.choices[0]?.message?.content?.trim() || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`LLM call failed for insights: ${errorMessage}`, errorStack);
      return null;
    }
  }

  /**
   * Generate weekly summary text (fallback)
   */
  private generateWeeklySummary(summary: any, patternAnalysis: PatternAnalysisResult): string {
    const totalActions = summary.total_actions ?? 0;
    const karmaScore = summary.karma_score ?? 0;
    const insights = patternAnalysis.behavioral_insights ?? '';
    return `This week, you recorded ${totalActions} actions. Your karma score is ${karmaScore.toFixed(1)}. ${insights}`;
  }

  /**
   * Generate monthly summary text (fallback)
   */
  private generateMonthlySummary(summary: any, patternAnalysis: PatternAnalysisResult): string {
    const totalActions = summary.total_actions ?? 0;
    const karmaScore = summary.karma_score ?? 0;
    const insights = patternAnalysis.behavioral_insights ?? '';
    return `This month, you recorded ${totalActions} actions. Your karma score is ${karmaScore.toFixed(1)}. ${insights}`;
  }

  /**
   * Generate prediction text (fallback)
   */
  private generatePrediction(summary: any): string {
    const score = Number(summary.karma_score);
    if (score >= 70) {
      return 'Excellent karma! Continue your positive actions to maintain this high score.';
    } else if (score >= 50) {
      return 'Good karma foundation. Focus on your habit plan to improve further.';
    } else {
      return 'There is room for improvement. Follow your personalized habit plan to enhance your karma.';
    }
  }

  /**
   * Get comprehensive dashboard summary for authenticated user
   */
  async getDashboardSummary(userId: number): Promise<any> {
    // Get all karma entries for the user
    const allEntries = await this.karmaRepository.findByUserId(userId);
    
    // Calculate overall karma score
    const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
    
    // Get pattern analysis
    const patternAnalysis = await this.patternAnalysisService.analyzeUserPatterns(userId);
    
    // Get habit plan
    const habitPlan = await this.habitRecommendationService.generateHabitPlan(userId, patternAnalysis);
    
    // Calculate breakdown
    const breakdown = this.calculateBreakdown(allEntries);
    
    // Calculate category breakdown
    const categories = this.calculateCategoryBreakdown(allEntries);
    
    // Get recent actions (last 10)
    const recentActions = allEntries
      .slice(0, 10)
      .map((entry) => ({
        text: entry.text,
        karma_type: entry.karma_type,
        score: Number(entry.score),
        category_name: entry.category_name || 'general',
        emotion: entry.ai_analysis?.emotion || 'neutral',
        entry_date: entry.entry_date,
        confidence: entry.ai_analysis?.confidence || 0,
      }));
    
    // Determine grade
    const grade = this.calculateGrade(karmaScore.karma_score);
    
    // Determine trend
    const trend = karmaScore.trend === 'improving' ? 'up' : karmaScore.trend === 'declining' ? 'down' : 'flat';
    
    // Get time range
    const timeRange = this.getTimeRange(allEntries);
    
    // Format patterns
    const patterns = this.formatPatterns(patternAnalysis);
    
    // Format improvement plan
    const improvementPlan = this.formatImprovementPlan(habitPlan, patternAnalysis);
    
    // Get weekly and monthly trends
    const weeklyTrend = await this.getWeeklyTrend(userId);
    const monthlyTrend = await this.getMonthlyTrend(userId);
    
    // Get streak information
    const streak = await this.karmaStreakService.calculateStreak(userId);
    
    return {
      user: {
        id: userId.toString(),
        name: null, // Will be populated from user service if needed
      },
      overall: {
        score: Math.round(karmaScore.karma_score),
        grade,
        trend,
        total_actions: karmaScore.total_actions,
        time_range: timeRange,
        weekly_change: weeklyTrend.change,
        monthly_change: monthlyTrend.change,
      },
      breakdown,
      categories,
      recent_actions: recentActions,
      patterns,
      improvement_plan: improvementPlan,
      trends: {
        weekly: weeklyTrend,
        monthly: monthlyTrend,
      },
      streak: {
        current_days: streak.current_streak_days,
        longest_days: streak.longest_streak_days,
        level: streak.level,
        level_name: streak.level_name,
        next_level_threshold: streak.next_level_threshold,
        progress_to_next_level: streak.progress_to_next_level,
      },
    };
  }

  /**
   * Calculate good/bad/neutral breakdown
   */
  private calculateBreakdown(entries: KarmaEntry[]): any {
    let goodCount = 0;
    let goodPoints = 0;
    let badCount = 0;
    let badPoints = 0;
    let neutralCount = 0;

    entries.forEach((entry) => {
      const score = Number(entry.score) || 0;
      if (entry.karma_type === 'good') {
        goodCount++;
        goodPoints += Math.abs(score);
      } else if (entry.karma_type === 'bad') {
        badCount++;
        badPoints += Math.abs(score);
      } else {
        neutralCount++;
      }
    });

    return {
      good: {
        count: goodCount,
        points: goodPoints,
      },
      bad: {
        count: badCount,
        points: badPoints,
      },
      neutral: {
        count: neutralCount,
        points: 0,
      },
    };
  }

  /**
   * Calculate category breakdown
   */
  private calculateCategoryBreakdown(entries: KarmaEntry[]): any[] {
    const categoryMap = new Map<string, { good: number; bad: number; name: string }>();

    entries.forEach((entry) => {
      const categorySlug = entry.category_slug || 'general';
      const categoryName = entry.category_name || 'General';
      const score = Number(entry.score) || 0;

      if (!categoryMap.has(categorySlug)) {
        categoryMap.set(categorySlug, { good: 0, bad: 0, name: categoryName });
      }

      const category = categoryMap.get(categorySlug);
      if (!category) {
        // Should not happen based on logic, but safe guard
        return;
      }
      if (entry.karma_type === 'good') {
        category.good += Math.abs(score);
      } else if (entry.karma_type === 'bad') {
        category.bad += Math.abs(score);
      }
    });

    return Array.from(categoryMap.entries()).map(([slug, data]) => {
      const netPoints = data.good - data.bad;
      const normalizedScore = Math.max(
        KarmaService.MIN_KARMA_SCORE,
        Math.min(
          KarmaService.MAX_KARMA_SCORE,
          KarmaService.BASE_KARMA_SCORE + netPoints / KarmaService.SCORE_NORMALIZATION_DIVISOR
        )
      );
      
      return {
        category_slug: slug,
        category_name: data.name,
        good_points: data.good,
        bad_points: data.bad,
        score: Math.round(normalizedScore),
        status: this.getCategoryStatus(normalizedScore),
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Get category status
   */
  private getCategoryStatus(score: number): string {
    if (score >= KarmaService.SCORE_THRESHOLD_HIGH) return 'High';
    if (score >= KarmaService.SCORE_THRESHOLD_MEDIUM) return 'Medium';
    return 'Needs Work';
  }

  /**
   * Calculate grade from score
   */
  private calculateGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 40) return 'D';
    return 'F';
  }

  /**
   * Get time range from entries
   */
  private getTimeRange(entries: KarmaEntry[]): { from: string; to: string } {
    if (entries.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      return { from: today, to: today };
    }

    const dates = entries.map((e) => new Date(e.entry_date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    return {
      from: minDate.toISOString().split('T')[0],
      to: maxDate.toISOString().split('T')[0],
    };
  }

  /**
   * Format patterns for dashboard
   */
  private formatPatterns(patternAnalysis: PatternAnalysisResult): any {
    const strengths = patternAnalysis.detected_patterns
      .filter((p) => p.pattern_type === 'good' && p.frequency >= 3)
      .slice(0, 5)
      .map((p) => ({
        pattern_key: p.pattern_key,
        label: this.formatPatternLabel(p.pattern_name),
        description: this.getPatternDescription(p.pattern_key, p.pattern_name, 'strength'),
        frequency: p.frequency,
        impact: p.total_impact,
      }));

    const weaknesses = patternAnalysis.detected_patterns
      .filter((p) => p.pattern_type === 'bad' && p.frequency >= 2)
      .slice(0, 5)
      .map((p) => ({
        pattern_key: p.pattern_key,
        label: this.formatPatternLabel(p.pattern_name),
        description: this.getPatternDescription(p.pattern_key, p.pattern_name, 'weakness'),
        frequency: p.frequency,
        impact: p.total_impact,
      }));

    return {
      strengths,
      weaknesses,
    };
  }

  /**
   * Format pattern label
   */
  private formatPatternLabel(patternName: string): string {
    const labels: Record<string, string> = {
      kindness: 'Kindness & Compassion',
      donating: 'Generosity',
      helping: 'Helping Others',
      discipline: 'Self-Discipline',
      mindfulness: 'Mindfulness',
      anger: 'Anger / Reactivity',
      laziness: 'Laziness / Procrastination',
      dishonesty: 'Dishonesty',
      ego: 'Ego / Selfishness',
    };
    return labels[patternName.toLowerCase()] || patternName;
  }

  /**
   * Get pattern description
   */
  private getPatternDescription(patternKey: string, patternName: string, type: 'strength' | 'weakness'): string {
    if (type === 'strength') {
      const descriptions: Record<string, string> = {
        kindness: 'You are showing consistent acts of kindness and compassion towards others.',
        donating: 'Your generosity and charitable actions are creating positive karma.',
        helping: 'You frequently help others, which is building strong positive karma.',
        discipline: 'Your self-discipline and commitment to growth are admirable.',
        mindfulness: 'Your mindful actions show awareness and intentionality.',
      };
      return descriptions[patternKey] || `You show strong patterns of ${patternName}.`;
    } else {
      const descriptions: Record<string, string> = {
        anger: 'Frequent anger-related actions are lowering your karma. Consider meditation and pause techniques.',
        laziness: 'Procrastination and laziness patterns are impacting your karma. Focus on discipline and planning.',
        dishonesty: 'Dishonest actions are creating negative karma. Practice truthfulness and integrity.',
        ego: 'Selfish or ego-driven behaviors are affecting your karma. Focus on empathy and service.',
      };
      return descriptions[patternKey] || `Frequent ${patternName} patterns are impacting your karma.`;
    }
  }

  /**
   * Format improvement plan
   */
  private formatImprovementPlan(habitPlan: HabitPlan, patternAnalysis: PatternAnalysisResult): any {
    const summary = this.generateImprovementSummary(patternAnalysis);
    
    const recommendations = habitPlan.habits.slice(0, 5).map((habit) => ({
      title: habit.habit_title,
      pattern_key: habit.pattern_key,
      description: habit.habit_description || habit.motivational_message,
      priority: habit.priority,
    }));

    return {
      summary,
      recommendations,
      motivational_quote: habitPlan.motivational_quote,
    };
  }

  /**
   * Generate improvement summary
   */
  private generateImprovementSummary(patternAnalysis: PatternAnalysisResult): string {
    if (patternAnalysis.weaknesses.length === 0 && patternAnalysis.strengths.length > 0) {
      return `Excellent! You're maintaining strong positive patterns. Continue nurturing your strengths: ${patternAnalysis.strengths.join(', ')}.`;
    }
    
    if (patternAnalysis.weaknesses.length > 0 && patternAnalysis.strengths.length > 0) {
      return `Focus on managing ${patternAnalysis.weaknesses[0]} while continuing your ${patternAnalysis.strengths[0]} practices.`;
    }
    
    if (patternAnalysis.weaknesses.length > 0) {
      return `Focus on transforming ${patternAnalysis.weaknesses.join(' and ')} patterns to improve your karma.`;
    }
    
    return 'Continue maintaining awareness of your actions and their impact on your karma.';
  }

  /**
   * Get weekly trend
   */
  private async getWeeklyTrend(userId: number): Promise<any> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const currentWeek = await this.karmaScoreService.calculateWeeklyScore(userId, weekStart);
    const lastWeek = await this.karmaScoreService.calculateWeeklyScore(userId, lastWeekStart);
    
    const currentScore = Number(currentWeek.karma_score);
    const previousScore = Number(lastWeek.karma_score);
    const change = currentScore - previousScore;
    const changePercentage = previousScore !== 0 
      ? Math.round((change / previousScore) * 100)
      : 0;
    
    return {
      current_score: currentScore,
      previous_score: previousScore,
      change: Math.round(change * 100) / 100,
      change_percentage: changePercentage,
    };
  }

  /**
   * Get monthly trend
   */
  private async getMonthlyTrend(userId: number): Promise<any> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const lastMonthStart = new Date(monthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    
    const currentMonth = await this.karmaScoreService.calculateMonthlyScore(userId, monthStart);
    const lastMonth = await this.karmaScoreService.calculateMonthlyScore(userId, lastMonthStart);
    
    const currentScore = Number(currentMonth.karma_score);
    const previousScore = Number(lastMonth.karma_score);
    const change = currentScore - previousScore;
    const changePercentage = previousScore !== 0 
      ? Math.round((change / previousScore) * 100)
      : 0;
    
    return {
      current_score: currentScore,
      previous_score: previousScore,
      change: Math.round(change * 100) / 100,
      change_percentage: changePercentage,
    };
  }

  /**
   * Get karma ledger summary (Screen 1)
   */
  async getKarmaLedger(userId: number): Promise<{
    current_awareness_level: number;
    karma_distribution: {
      supportive: number;
      neutral: number;
      learning: number;
    };
    alignment_tips: string[];
    footer_message: string;
  }> {
    const dashboard = await this.getDashboardSummary(userId);
    const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
    const allEntries = await this.karmaRepository.findByUserId(userId);

    // Current Awareness Level = Karma Score (0-100)
    const currentAwarenessLevel = Math.round(karmaScore.karma_score);

    // Calculate distribution (Supportive = Good, Neutral = Neutral, Learning = Bad/Challenging)
    const breakdown = this.calculateBreakdown(allEntries);
    const karmaDistribution = {
      supportive: breakdown.good_count || 0,
      neutral: breakdown.neutral_count || 0,
      learning: breakdown.bad_count || 0,
    };

    // Generate alignment tips based on current phase and score
    const alignmentTips: string[] = [];
    if (currentAwarenessLevel >= 70) {
      alignmentTips.push('This is good phase for awareness over action');
      alignmentTips.push('Small conscious actions matters more now');
    } else if (currentAwarenessLevel >= 50) {
      alignmentTips.push('Focus on consistency in your daily practices');
      alignmentTips.push('Maintain awareness of your intentions');
    } else {
      alignmentTips.push('Build awareness through daily reflection');
      alignmentTips.push('Start with small, conscious actions');
    }

    return {
      current_awareness_level: currentAwarenessLevel,
      karma_distribution: karmaDistribution,
      alignment_tips: alignmentTips,
      footer_message: 'Your karma unfolds over time, not instantly',
    };
  }

  /**
   * Get karma insight for a specific entry (Screen 4)
   */
  async getKarmaInsight(entryId: number, userId: number): Promise<{
    alignment_percentage: number;
    alignment_status: string;
    phase_impact: string;
    insight_description: string;
    footer_message: string;
  }> {
    const entry = await this.karmaRepository.findById(entryId);

    if (!entry || entry.user_id !== userId || entry.is_deleted) {
      throw new NotFoundException('Karma entry not found');
    }

    // Calculate alignment based on karma type and score
    let alignmentPercentage = 50;
    let alignmentStatus = 'Neutral';
    let phaseImpact = 'Moderate';
    let insightDescription = '';

    if (entry.karma_type === 'good') {
      alignmentPercentage = Math.min(100, 60 + Number(entry.score));
      alignmentStatus = 'Aligned';
      phaseImpact = 'Positive';
      insightDescription = 'This action aligns with a supportive phase. It shows a moment of conscious choice that builds positive momentum.';
    } else if (entry.karma_type === 'bad') {
      alignmentPercentage = Math.max(0, 40 - Number(entry.score));
      alignmentStatus = 'Learning';
      phaseImpact = 'Moderate';
      insightDescription = 'This action aligns with a learning phase. It shows a moment of conscious choice that builds resilience.';
    } else {
      alignmentPercentage = 50;
      alignmentStatus = 'Neutral';
      phaseImpact = 'Neutral';
      insightDescription = 'This action reflects a neutral phase. It shows awareness without strong directional impact.';
    }

    return {
      alignment_percentage: Math.round(alignmentPercentage),
      alignment_status: alignmentStatus,
      phase_impact: phaseImpact,
      insight_description: insightDescription,
      footer_message: 'Impact unfolds gradually.',
    };
  }

  /**
   * Get karma entry by ID with full details (Screen 02.5A)
   */
  async getKarmaEntryById(entryId: number, userId: number): Promise<any> {
    const entry = await this.karmaRepository.findById(entryId);

    if (!entry || entry.user_id !== userId || entry.is_deleted) {
      throw new NotFoundException('Karma entry not found');
    }

    // Map karma_type to user-friendly labels
    const karmaTypeLabel = entry.karma_type === 'good' ? 'Good' 
      : entry.karma_type === 'bad' ? 'Challenging' 
      : 'Neutral';

    // Get AI analysis
    const aiAnalysis = entry.ai_analysis || {};
    
    // Generate teaching message
    let teachingMessage = 'This action reflects your current awareness level.';
    if (entry.karma_type === 'good') {
      teachingMessage = 'This action reinforced the value of selfless service and strengthens your connection to community.';
    } else if (entry.karma_type === 'bad') {
      teachingMessage = 'This action provides an opportunity for learning and growth through conscious reflection.';
    } else {
      teachingMessage = 'This action shows neutral awareness without strong directional impact.';
    }

    // Determine karmic phase impact
    const score = Number(entry.score);
    let phaseImpact = 'Moderate';
    if (score >= 8) phaseImpact = 'High';
    else if (score >= 5) phaseImpact = 'Moderate';
    else if (score >= 2) phaseImpact = 'Low';
    else phaseImpact = 'Minimal';

    // Format intention/emotional context to match screen format
    const intentionText = aiAnalysis.reasoning || 'Conscious awareness';
    const emotionalText = aiAnalysis.emotion || 'Neutral';
    const intentionEmotionalContext = `Intention: ${intentionText}. Emotional: ${emotionalText}.`;

    return {
      id: entry.id,
      karma_type: karmaTypeLabel,
      karma_type_internal: entry.karma_type,
      date: entry.entry_date,
      action_description: entry.text,
      intention_emotional_context: intentionEmotionalContext,
      intention_emotional_context_structured: {
        intention: intentionText,
        emotional: emotionalText,
      },
      teaching_message: teachingMessage,
      current_karmic_phase_impact: phaseImpact,
      score: score,
      category: entry.category_name || 'General',
      confidence: aiAnalysis.confidence || 0,
      created_at: entry.added_date,
    };
  }

  /**
   * Get karma list with filters (Screen 02.5B)
   */
  async getKarmaList(
    userId: number,
    filter: 'all' | 'good' | 'neutral' | 'challenging' = 'all',
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    total: number;
    entries: Array<{
      id: number;
      karma_type: string;
      action_text: string;
      date: Date;
      score: number;
      category: string | null;
    }>;
  }> {
    const allEntries = await this.karmaRepository.findByUserId(userId);

    // Filter by type
    let filteredEntries = allEntries;
    if (filter !== 'all') {
      const typeMap: Record<string, string> = {
        good: 'good',
        neutral: 'neutral',
        challenging: 'bad',
      };
      const internalType = typeMap[filter];
      filteredEntries = allEntries.filter((e) => e.karma_type === internalType);
    }

    // Sort by date (newest first)
    filteredEntries.sort((a, b) => {
      const dateA = new Date(a.entry_date).getTime();
      const dateB = new Date(b.entry_date).getTime();
      return dateB - dateA;
    });

    // Apply pagination
    const paginatedEntries = filteredEntries.slice(offset, offset + limit);

    // Map to user-friendly format
    const entries = paginatedEntries.map((entry) => ({
      id: entry.id,
      karma_type: entry.karma_type === 'good' ? 'Good'
        : entry.karma_type === 'bad' ? 'Challenging'
        : 'Neutral',
      action_text: entry.text,
      date: entry.entry_date,
      score: Number(entry.score),
      category: entry.category_name,
    }));

    return {
      total: filteredEntries.length,
      entries,
    };
  }

  /**
   * Get karma patterns with time filter (Screen 02.7)
   */
  async getKarmaPatterns(
    userId: number,
    filter: 'week' | 'month' | 'year' = 'week',
  ): Promise<{
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
  }> {
    const allEntries = await this.karmaRepository.findByUserId(userId);
    const now = new Date();

    // Calculate date range based on filter
    let startDate: Date;
    switch (filter) {
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1); // Start of year
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
        break;
      case 'week':
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    // Filter entries within date range
    const filteredEntries = allEntries.filter((entry) => {
      const entryDate = new Date(entry.entry_date);
      return entryDate >= startDate && entryDate <= now;
    });

    // Group by date
    const dateMap = new Map<string, {
      good: number;
      neutral: number;
      challenging: number;
      total: number;
    }>();

    filteredEntries.forEach((entry) => {
      const dateKey = entry.entry_date.toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { good: 0, neutral: 0, challenging: 0, total: 0 });
      }
      const dayData = dateMap.get(dateKey)!;
      dayData.total++;
      if (entry.karma_type === 'good') {
        dayData.good++;
      } else if (entry.karma_type === 'bad') {
        dayData.challenging++;
      } else {
        dayData.neutral++;
      }
    });

    // Calculate awareness level for each day (based on good vs challenging ratio)
    const awarenessOverTime = Array.from(dateMap.entries())
      .map(([date, data]) => {
        const total = data.total;
        if (total === 0) {
          return {
            date,
            awareness_level: 50,
            good_actions: 0,
            neutral_actions: 0,
            challenging_actions: 0,
            total_actions: 0,
          };
        }
        
        // Awareness level = base 50 + (good ratio * 30) - (challenging ratio * 20)
        const goodRatio = data.good / total;
        const challengingRatio = data.challenging / total;
        const awarenessLevel = Math.max(0, Math.min(100, 50 + (goodRatio * 30) - (challengingRatio * 20)));

        return {
          date,
          awareness_level: Math.round(awarenessLevel),
          good_actions: data.good,
          neutral_actions: data.neutral,
          challenging_actions: data.challenging,
          total_actions: total,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      filter,
      awareness_over_time: awarenessOverTime,
      footer_message: 'Patterns show direction, not destiny.',
    };
  }
}

