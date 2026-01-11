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
var KarmaScoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KarmaScoreService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const karma_score_summary_entity_1 = require("../entities/karma-score-summary.entity");
let KarmaScoreService = KarmaScoreService_1 = class KarmaScoreService {
    constructor(karmaRepository, scoreSummaryRepository) {
        this.karmaRepository = karmaRepository;
        this.scoreSummaryRepository = scoreSummaryRepository;
        this.logger = new common_1.Logger(KarmaScoreService_1.name);
    }
    async calculateUserKarmaScore(userId) {
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
            }
            else if (entry.karma_type === 'bad') {
                totalBadPoints += Math.abs(score);
                badCount++;
            }
            else {
                neutralCount++;
            }
        }
        const rawScore = totalGoodPoints - totalBadPoints;
        const normalizedScore = Math.max(KarmaScoreService_1.MIN_KARMA_SCORE, Math.min(KarmaScoreService_1.MAX_KARMA_SCORE, KarmaScoreService_1.BASE_KARMA_SCORE + (rawScore / KarmaScoreService_1.SCORE_NORMALIZATION_DIVISOR)));
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
    async calculateDailyScore(userId, date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const dayEntries = await this.karmaRepository.findByUserIdAndDateRange(userId, startOfDay, endOfDay);
        return this.createScoreSummary(userId, 'daily', startOfDay, endOfDay, dayEntries);
    }
    async calculateWeeklyScore(userId, weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        const weekEntries = await this.karmaRepository.findByUserIdAndDateRange(userId, weekStart, weekEnd);
        return this.createScoreSummary(userId, 'weekly', weekStart, weekEnd, weekEntries);
    }
    async calculateMonthlyScore(userId, monthStart) {
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);
        const monthEntries = await this.karmaRepository.findByUserIdAndDateRange(userId, monthStart, monthEnd);
        return this.createScoreSummary(userId, 'monthly', monthStart, monthEnd, monthEntries);
    }
    async createScoreSummary(userId, periodType, periodStart, periodEnd, entries) {
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
            }
            else if (entry.karma_type === 'bad') {
                totalBadPoints += Math.abs(score);
                badCount++;
            }
            else {
                neutralCount++;
            }
        }
        const rawScore = totalGoodPoints - totalBadPoints;
        const normalizedScore = Math.max(KarmaScoreService_1.MIN_KARMA_SCORE, Math.min(KarmaScoreService_1.MAX_KARMA_SCORE, KarmaScoreService_1.BASE_KARMA_SCORE + rawScore / KarmaScoreService_1.SCORE_NORMALIZATION_DIVISOR));
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
    async calculateTrend(userId, currentScore) {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const weekStart = new Date(lastWeek);
        weekStart.setDate(weekStart.getDate() - 7);
        const weekEnd = new Date(lastWeek);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const lastWeekSummary = await this.scoreSummaryRepository.findOne({
            where: {
                user_id: userId,
                period_type: 'weekly',
                period_start: (0, typeorm_2.Between)(weekStart, weekEnd),
            },
            order: { period_start: 'DESC' },
        });
        if (!lastWeekSummary) {
            return { direction: 'stable', percentage: 0 };
        }
        const previousScore = Number(lastWeekSummary.karma_score);
        const difference = currentScore - previousScore;
        const percentage = previousScore !== 0
            ? Math.abs((difference / previousScore) * 100)
            : 0;
        if (difference > KarmaScoreService_1.TREND_THRESHOLD) {
            return { direction: 'improving', percentage: Math.round(percentage) };
        }
        else if (difference < -KarmaScoreService_1.TREND_THRESHOLD) {
            return { direction: 'declining', percentage: Math.round(percentage) };
        }
        else {
            return { direction: 'stable', percentage: Math.round(percentage) };
        }
    }
};
exports.KarmaScoreService = KarmaScoreService;
KarmaScoreService.SCORE_NORMALIZATION_DIVISOR = 10;
KarmaScoreService.BASE_KARMA_SCORE = 50;
KarmaScoreService.MAX_KARMA_SCORE = 100;
KarmaScoreService.MIN_KARMA_SCORE = 0;
KarmaScoreService.TREND_THRESHOLD = 2;
exports.KarmaScoreService = KarmaScoreService = KarmaScoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IKarmaRepository')),
    __param(1, (0, typeorm_1.InjectRepository)(karma_score_summary_entity_1.KarmaScoreSummary)),
    __metadata("design:paramtypes", [Object, typeorm_2.Repository])
], KarmaScoreService);
//# sourceMappingURL=karma-score.service.js.map