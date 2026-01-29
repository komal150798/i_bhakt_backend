"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var KarmaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KarmaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const customer_entity_1 = require("../../users/entities/customer.entity");
const ai_classification_service_1 = require("./ai-classification.service");
const karma_score_service_1 = require("./karma-score.service");
const pattern_analysis_service_1 = require("./pattern-analysis.service");
const habit_recommendation_service_1 = require("./habit-recommendation.service");
const karma_streak_service_1 = require("./karma-streak.service");
const karma_type_enum_1 = require("../../common/enums/karma-type.enum");
const prompt_service_1 = require("../../common/ai/prompt.service");
let KarmaService = KarmaService_1 = class KarmaService {
    constructor(karmaRepository, customerRepository, aiClassificationService, karmaScoreService, patternAnalysisService, habitRecommendationService, karmaStreakService, promptService, configService, httpService) {
        this.karmaRepository = karmaRepository;
        this.customerRepository = customerRepository;
        this.aiClassificationService = aiClassificationService;
        this.karmaScoreService = karmaScoreService;
        this.patternAnalysisService = patternAnalysisService;
        this.habitRecommendationService = habitRecommendationService;
        this.karmaStreakService = karmaStreakService;
        this.promptService = promptService;
        this.configService = configService;
        this.httpService = httpService;
        this.logger = new common_1.Logger(KarmaService_1.name);
        this.openaiApiKey = this.configService.get('OPENAI_API_KEY') || '';
        this.openaiBaseUrl = this.configService.get('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
        this.useLLM = !!this.openaiApiKey;
    }
    async addKarmaAction(dto) {
        if (!dto.action_text || dto.action_text.trim().length === 0) {
            throw new common_1.BadRequestException('Action text is required');
        }
        const customer = await this.customerRepository.findOne({
            where: { id: dto.user_id, is_deleted: false },
        });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer with ID ${dto.user_id} not found. Please ensure the user exists in the customer table.`);
        }
        const classification = await this.aiClassificationService.classifyAction(dto.action_text, dto.user_id);
        const karmaTypeMap = {
            good: karma_type_enum_1.KarmaType.GOOD,
            bad: karma_type_enum_1.KarmaType.BAD,
            neutral: karma_type_enum_1.KarmaType.NEUTRAL,
        };
        const karmaType = karmaTypeMap[classification.type] || karma_type_enum_1.KarmaType.NEUTRAL;
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
        this.logger.log(`Karma action added for user ${dto.user_id}: ${classification.type} (confidence: ${classification.confidence}%)`);
        return entry;
    }
    async getUserKarmaSummary(userId) {
        const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
        const patternAnalysis = await this.patternAnalysisService.analyzeUserPatterns(userId);
        const habitPlan = await this.habitRecommendationService.generateHabitPlan(userId, patternAnalysis);
        const recentActions = await this.karmaRepository.findByUserId(userId);
        const recent = recentActions.slice(0, 10);
        const insights = await this.generateInsights(userId, karmaScore, patternAnalysis);
        return {
            karma_score: karmaScore,
            pattern_analysis: patternAnalysis,
            habit_plan: habitPlan,
            recent_actions: recent,
            insights,
        };
    }
    async getUserHabits(userId) {
        const patternAnalysis = await this.patternAnalysisService.analyzeUserPatterns(userId);
        return this.habitRecommendationService.generateHabitPlan(userId, patternAnalysis);
    }
    async getUserPatterns(userId) {
        return this.patternAnalysisService.analyzeUserPatterns(userId);
    }
    async getWeeklyInsights(userId) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
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
    async getMonthlyInsights(userId) {
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
    async generateInsights(userId, karmaScore, patternAnalysis) {
        const weekly = await this.getWeeklyInsights(userId);
        const monthly = await this.getMonthlyInsights(userId);
        return {
            weekly_summary: weekly.summary_text,
            monthly_summary: monthly.summary_text,
            prediction: karmaScore.trend === 'improving'
                ? `Your karma is improving! If you continue this pattern, your score could reach ${Math.min(KarmaService_1.MAX_KARMA_SCORE, karmaScore.karma_score + KarmaService_1.PREDICTION_SCORE_INCREMENT)} in the next month.`
                : karmaScore.trend === 'declining'
                    ? `Your karma shows a declining trend. Focus on your habit plan to reverse this pattern.`
                    : `Your karma is stable. Continue practicing your recommended habits for steady growth.`,
        };
    }
    async generateWeeklySummaryWithAI(summary, patternAnalysis, weekStart) {
        if (!this.useLLM)
            return null;
        try {
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            const prompt = await this.promptService.getPrompt('karma.insights.weekly.gpt5.1', {
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
            });
            const response = await this.callLLMForInsights(prompt.finalText);
            return response || null;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to generate weekly summary with AI: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
            return null;
        }
    }
    async generateMonthlySummaryWithAI(summary, patternAnalysis, monthStart) {
        if (!this.useLLM)
            return null;
        try {
            const prompt = await this.promptService.getPrompt('karma.insights.monthly.gpt5.1', {
                month: (monthStart.getMonth() + 1).toString(),
                year: monthStart.getFullYear().toString(),
                total_actions: (summary.total_good_actions + summary.total_bad_actions + summary.total_neutral_actions).toString(),
                good_actions: summary.total_good_actions?.toString() || '0',
                bad_actions: summary.total_bad_actions?.toString() || '0',
                karma_score: summary.karma_score?.toFixed(1) || '0',
                trend: 'stable',
                dominant_patterns: patternAnalysis.detected_patterns.slice(0, 3).map(p => p.pattern_name).join(', '),
                strengths: patternAnalysis.strengths.join(', ') || 'None',
                weaknesses: patternAnalysis.weaknesses.join(', ') || 'None',
                habit_recommendations: patternAnalysis.weaknesses.slice(0, 3).join(', ') || 'None',
            });
            const response = await this.callLLMForInsights(prompt.finalText);
            return response || null;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to generate monthly summary with AI: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
            return null;
        }
    }
    async generatePredictionWithAI(summary) {
        if (!this.useLLM)
            return null;
        try {
            const prompt = await this.promptService.getPrompt('karma.insights.monthly.gpt5.1', {
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
            });
            const response = await this.callLLMForInsights(prompt.finalText);
            return response || null;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to generate prediction with AI: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
            return null;
        }
    }
    async callLLMForInsights(prompt) {
        try {
            const model = this.configService.get('OPENAI_MODEL') || 'gpt-4o-mini';
            const apiUrl = `${this.openaiBaseUrl}/chat/completions`;
            const requestBody = {
                model,
                messages: [
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 300,
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(apiUrl, requestBody, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }));
            return response.data.choices[0]?.message?.content?.trim() || null;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`LLM call failed for insights: ${errorMessage}`, errorStack);
            return null;
        }
    }
    generateWeeklySummary(summary, patternAnalysis) {
        const totalActions = summary.total_actions ?? 0;
        const karmaScore = summary.karma_score ?? 0;
        const insights = patternAnalysis.behavioral_insights ?? '';
        return `This week, you recorded ${totalActions} actions. Your karma score is ${karmaScore.toFixed(1)}. ${insights}`;
    }
    generateMonthlySummary(summary, patternAnalysis) {
        const totalActions = summary.total_actions ?? 0;
        const karmaScore = summary.karma_score ?? 0;
        const insights = patternAnalysis.behavioral_insights ?? '';
        return `This month, you recorded ${totalActions} actions. Your karma score is ${karmaScore.toFixed(1)}. ${insights}`;
    }
    generatePrediction(summary) {
        const score = Number(summary.karma_score);
        if (score >= 70) {
            return 'Excellent karma! Continue your positive actions to maintain this high score.';
        }
        else if (score >= 50) {
            return 'Good karma foundation. Focus on your habit plan to improve further.';
        }
        else {
            return 'There is room for improvement. Follow your personalized habit plan to enhance your karma.';
        }
    }
    async getDashboardSummary(userId) {
        const allEntries = await this.karmaRepository.findByUserId(userId);
        const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
        const patternAnalysis = await this.patternAnalysisService.analyzeUserPatterns(userId);
        const habitPlan = await this.habitRecommendationService.generateHabitPlan(userId, patternAnalysis);
        const breakdown = this.calculateBreakdown(allEntries);
        const categories = this.calculateCategoryBreakdown(allEntries);
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
        const grade = this.calculateGrade(karmaScore.karma_score);
        const trend = karmaScore.trend === 'improving' ? 'up' : karmaScore.trend === 'declining' ? 'down' : 'flat';
        const timeRange = this.getTimeRange(allEntries);
        const patterns = this.formatPatterns(patternAnalysis);
        const improvementPlan = this.formatImprovementPlan(habitPlan, patternAnalysis);
        const weeklyTrend = await this.getWeeklyTrend(userId);
        const monthlyTrend = await this.getMonthlyTrend(userId);
        const streak = await this.karmaStreakService.calculateStreak(userId);
        return {
            user: {
                id: userId.toString(),
                name: null,
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
    calculateBreakdown(entries) {
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
            }
            else if (entry.karma_type === 'bad') {
                badCount++;
                badPoints += Math.abs(score);
            }
            else {
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
    calculateCategoryBreakdown(entries) {
        const categoryMap = new Map();
        entries.forEach((entry) => {
            const categorySlug = entry.category_slug || 'general';
            const categoryName = entry.category_name || 'General';
            const score = Number(entry.score) || 0;
            if (!categoryMap.has(categorySlug)) {
                categoryMap.set(categorySlug, { good: 0, bad: 0, name: categoryName });
            }
            const category = categoryMap.get(categorySlug);
            if (!category) {
                return;
            }
            if (entry.karma_type === 'good') {
                category.good += Math.abs(score);
            }
            else if (entry.karma_type === 'bad') {
                category.bad += Math.abs(score);
            }
        });
        return Array.from(categoryMap.entries()).map(([slug, data]) => {
            const netPoints = data.good - data.bad;
            const normalizedScore = Math.max(KarmaService_1.MIN_KARMA_SCORE, Math.min(KarmaService_1.MAX_KARMA_SCORE, KarmaService_1.BASE_KARMA_SCORE + netPoints / KarmaService_1.SCORE_NORMALIZATION_DIVISOR));
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
    getCategoryStatus(score) {
        if (score >= KarmaService_1.SCORE_THRESHOLD_HIGH)
            return 'High';
        if (score >= KarmaService_1.SCORE_THRESHOLD_MEDIUM)
            return 'Medium';
        return 'Needs Work';
    }
    calculateGrade(score) {
        if (score >= 90)
            return 'A+';
        if (score >= 85)
            return 'A';
        if (score >= 80)
            return 'A-';
        if (score >= 75)
            return 'B+';
        if (score >= 70)
            return 'B';
        if (score >= 65)
            return 'B-';
        if (score >= 60)
            return 'C+';
        if (score >= 55)
            return 'C';
        if (score >= 50)
            return 'C-';
        if (score >= 40)
            return 'D';
        return 'F';
    }
    getTimeRange(entries) {
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
    formatPatterns(patternAnalysis) {
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
    formatPatternLabel(patternName) {
        const labels = {
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
    getPatternDescription(patternKey, patternName, type) {
        if (type === 'strength') {
            const descriptions = {
                kindness: 'You are showing consistent acts of kindness and compassion towards others.',
                donating: 'Your generosity and charitable actions are creating positive karma.',
                helping: 'You frequently help others, which is building strong positive karma.',
                discipline: 'Your self-discipline and commitment to growth are admirable.',
                mindfulness: 'Your mindful actions show awareness and intentionality.',
            };
            return descriptions[patternKey] || `You show strong patterns of ${patternName}.`;
        }
        else {
            const descriptions = {
                anger: 'Frequent anger-related actions are lowering your karma. Consider meditation and pause techniques.',
                laziness: 'Procrastination and laziness patterns are impacting your karma. Focus on discipline and planning.',
                dishonesty: 'Dishonest actions are creating negative karma. Practice truthfulness and integrity.',
                ego: 'Selfish or ego-driven behaviors are affecting your karma. Focus on empathy and service.',
            };
            return descriptions[patternKey] || `Frequent ${patternName} patterns are impacting your karma.`;
        }
    }
    formatImprovementPlan(habitPlan, patternAnalysis) {
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
    generateImprovementSummary(patternAnalysis) {
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
    async getWeeklyTrend(userId) {
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
    async getMonthlyTrend(userId) {
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
};
exports.KarmaService = KarmaService;
KarmaService.SCORE_THRESHOLD_HIGH = 70;
KarmaService.SCORE_THRESHOLD_MEDIUM = 50;
KarmaService.SCORE_NORMALIZATION_DIVISOR = 10;
KarmaService.BASE_KARMA_SCORE = 50;
KarmaService.MAX_KARMA_SCORE = 100;
KarmaService.MIN_KARMA_SCORE = 0;
KarmaService.TREND_THRESHOLD = 2;
KarmaService.PREDICTION_SCORE_INCREMENT = 10;
exports.KarmaService = KarmaService = KarmaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IKarmaRepository')),
    __param(1, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [Object, typeorm_2.Repository,
        ai_classification_service_1.AIClassificationService,
        karma_score_service_1.KarmaScoreService,
        pattern_analysis_service_1.PatternAnalysisService,
        habit_recommendation_service_1.HabitRecommendationService,
        karma_streak_service_1.KarmaStreakService,
        prompt_service_1.PromptService,
        config_1.ConfigService,
        axios_1.HttpService])
], KarmaService);
//# sourceMappingURL=karma.service.js.map