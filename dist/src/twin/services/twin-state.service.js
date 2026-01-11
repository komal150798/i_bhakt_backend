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
var TwinStateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwinStateService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_entity_1 = require("../../users/entities/customer.entity");
const karma_score_service_1 = require("../../karma/services/karma-score.service");
const manifestation_log_entity_1 = require("../../manifestation/entities/manifestation-log.entity");
let TwinStateService = TwinStateService_1 = class TwinStateService {
    constructor(customerRepository, karmaRepository, manifestationRepository, karmaScoreService) {
        this.customerRepository = customerRepository;
        this.karmaRepository = karmaRepository;
        this.manifestationRepository = manifestationRepository;
        this.karmaScoreService = karmaScoreService;
        this.logger = new common_1.Logger(TwinStateService_1.name);
    }
    async getTwinState(userId) {
        const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentManifestations = await this.manifestationRepository.find({
            where: {
                user_id: userId,
                is_deleted: false,
                added_date: (0, typeorm_2.MoreThanOrEqual)(thirtyDaysAgo),
            },
            order: { added_date: 'DESC' },
            take: 10,
        });
        const avgMfp = recentManifestations.length > 0
            ? recentManifestations.reduce((sum, m) => sum + (Number(m.manifestation_probability) || 0), 0) / recentManifestations.length
            : null;
        const energy = this.calculateEnergy(karmaScore.karma_score, karmaScore.trend_percentage);
        const mood = this.determineMood(karmaScore.trend, karmaScore.good_actions_count, karmaScore.bad_actions_count);
        const alignment = this.calculateAlignment(karmaScore.karma_score, avgMfp);
        const aura = this.determineAura(karmaScore.karma_score, karmaScore.trend, avgMfp);
        const highlights = await this.getHighlights(userId, karmaScore, recentManifestations);
        return {
            energy: Math.round(energy),
            mood,
            alignment: Math.round(alignment),
            aura,
            karma_score: karmaScore.karma_score,
            mfp_score: avgMfp ? Math.round(avgMfp * 100) / 100 : null,
            highlights,
            last_updated: new Date(),
        };
    }
    calculateEnergy(karmaScore, trendPercentage) {
        let energy = karmaScore;
        if (trendPercentage > 0) {
            energy += Math.min(10, trendPercentage * 0.1);
        }
        else if (trendPercentage < 0) {
            energy += Math.max(-10, trendPercentage * 0.1);
        }
        return Math.max(0, Math.min(100, energy));
    }
    determineMood(trend, goodCount, badCount) {
        if (trend === 'improving' && goodCount > badCount) {
            return 'positive';
        }
        else if (trend === 'declining' && badCount > goodCount) {
            return 'negative';
        }
        return 'neutral';
    }
    calculateAlignment(karmaScore, avgMfp) {
        if (avgMfp === null) {
            return 50;
        }
        const karmaWeight = 0.6;
        const mfpWeight = 0.4;
        return (karmaScore * karmaWeight) + (avgMfp * 100 * mfpWeight);
    }
    determineAura(karmaScore, trend, avgMfp) {
        let color = 'blue';
        let intensity = 50;
        let evolution_level = 'awaken';
        if (karmaScore >= 80) {
            color = 'gold';
            evolution_level = 'master';
            intensity = 90;
        }
        else if (karmaScore >= 65) {
            color = 'green';
            evolution_level = 'pro';
            intensity = 75;
        }
        else if (karmaScore >= 50) {
            color = 'blue';
            evolution_level = 'builder';
            intensity = 60;
        }
        else {
            color = 'gray';
            evolution_level = 'awaken';
            intensity = 40;
        }
        if (trend === 'improving') {
            intensity = Math.min(100, intensity + 10);
        }
        else if (trend === 'declining') {
            intensity = Math.max(20, intensity - 10);
        }
        if (avgMfp && avgMfp > 0.7) {
            intensity = Math.min(100, intensity + 5);
            if (color === 'blue')
                color = 'green';
        }
        return { color, intensity, evolution_level };
    }
    async getHighlights(userId, karmaScore, manifestations) {
        const highlights = {};
        highlights.karma_trend = karmaScore.trend;
        if (manifestations.length > 0) {
            const lockedCount = manifestations.filter(m => m.metadata?.locked === true).length;
            highlights.manifestation_progress = Math.round((lockedCount / manifestations.length) * 100);
        }
        if (karmaScore.trend === 'improving' && karmaScore.trend_percentage > 5) {
            highlights.recent_achievement = 'Your karma is improving! Keep up the positive actions.';
        }
        return highlights;
    }
};
exports.TwinStateService = TwinStateService;
exports.TwinStateService = TwinStateService = TwinStateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(1, (0, common_1.Inject)('IKarmaRepository')),
    __param(2, (0, typeorm_1.InjectRepository)(manifestation_log_entity_1.ManifestationLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object, typeorm_2.Repository,
        karma_score_service_1.KarmaScoreService])
], TwinStateService);
//# sourceMappingURL=twin-state.service.js.map