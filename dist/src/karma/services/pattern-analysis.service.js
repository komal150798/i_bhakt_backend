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
var PatternAnalysisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatternAnalysisService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const karma_pattern_entity_1 = require("../entities/karma-pattern.entity");
let PatternAnalysisService = PatternAnalysisService_1 = class PatternAnalysisService {
    constructor(karmaRepository, patternRepository) {
        this.karmaRepository = karmaRepository;
        this.patternRepository = patternRepository;
        this.logger = new common_1.Logger(PatternAnalysisService_1.name);
    }
    async analyzeUserPatterns(userId) {
        const entries = await this.karmaRepository.findByUserId(userId);
        const patternMap = new Map();
        for (const entry of entries) {
            const aiAnalysis = entry.ai_analysis || {};
            const patternKey = aiAnalysis.pattern_key || 'unknown';
            const patternName = aiAnalysis.emotion || 'Unknown Pattern';
            const patternType = entry.karma_type || 'neutral';
            const score = Number(entry.score) || 0;
            if (!patternMap.has(patternKey)) {
                patternMap.set(patternKey, {
                    pattern_key: patternKey,
                    pattern_name: patternName,
                    pattern_type: patternType,
                    frequency: 0,
                    total_impact: 0,
                    first_detected: new Date(entry.entry_date),
                    last_detected: new Date(entry.entry_date),
                    sample_actions: [],
                });
            }
            const pattern = patternMap.get(patternKey);
            pattern.frequency++;
            pattern.total_impact += score;
            const entryDate = new Date(entry.entry_date);
            if (entryDate < pattern.first_detected) {
                pattern.first_detected = entryDate;
            }
            if (entryDate > pattern.last_detected) {
                pattern.last_detected = entryDate;
            }
            if (pattern.sample_actions.length < 5) {
                pattern.sample_actions.push(entry.text.substring(0, 100));
            }
        }
        const detectedPatterns = Array.from(patternMap.values())
            .sort((a, b) => b.frequency - a.frequency);
        const strengths = detectedPatterns
            .filter((p) => p.pattern_type === 'good' && p.frequency >= 3)
            .map((p) => p.pattern_name);
        const weaknesses = detectedPatterns
            .filter((p) => p.pattern_type === 'bad' && p.frequency >= 2)
            .map((p) => p.pattern_name);
        const dominantPattern = detectedPatterns[0];
        const dominantEmotion = dominantPattern ? dominantPattern.pattern_key : 'neutral';
        const behavioralInsights = this.generateBehavioralInsights(detectedPatterns, strengths, weaknesses);
        await this.savePatternsToDatabase(userId, detectedPatterns);
        return {
            detected_patterns: detectedPatterns,
            strengths,
            weaknesses,
            dominant_emotion: dominantEmotion,
            behavioral_insights: behavioralInsights,
        };
    }
    generateBehavioralInsights(patterns, strengths, weaknesses) {
        const insights = [];
        if (strengths.length > 0) {
            insights.push(`You show strong patterns of ${strengths.join(', ')}. These are your key strengths that contribute positively to your karma.`);
        }
        if (weaknesses.length > 0) {
            insights.push(`Areas for improvement include ${weaknesses.join(', ')}. These patterns appear frequently and may be impacting your overall karma score.`);
        }
        const topPattern = patterns[0];
        if (topPattern) {
            if (topPattern.pattern_type === 'good') {
                insights.push(`Your most common behavior is "${topPattern.pattern_name}" (appeared ${topPattern.frequency} times), which is excellent for your spiritual growth.`);
            }
            else {
                insights.push(`Your most common behavior is "${topPattern.pattern_name}" (appeared ${topPattern.frequency} times). Consider focusing on transforming this pattern.`);
            }
        }
        if (insights.length === 0) {
            insights.push('You have a balanced karma profile. Continue maintaining awareness of your actions and their impact.');
        }
        return insights.join(' ');
    }
    async savePatternsToDatabase(userId, patterns) {
        for (const pattern of patterns) {
            const existing = await this.patternRepository.findOne({
                where: {
                    user_id: userId,
                    pattern_key: pattern.pattern_key,
                },
                order: { detected_date: 'DESC' },
            });
            if (existing) {
                existing.frequency_count = pattern.frequency;
                existing.total_score_impact = pattern.total_impact;
                existing.last_detected_date = pattern.last_detected;
                existing.sample_actions = pattern.sample_actions;
                await this.patternRepository.save(existing);
            }
            else {
                const newPattern = this.patternRepository.create({
                    user_id: userId,
                    pattern_key: pattern.pattern_key,
                    pattern_name: pattern.pattern_name,
                    pattern_type: pattern.pattern_type,
                    frequency_count: pattern.frequency,
                    total_score_impact: pattern.total_impact,
                    detected_date: new Date(),
                    first_detected_date: pattern.first_detected,
                    last_detected_date: pattern.last_detected,
                    sample_actions: pattern.sample_actions,
                });
                await this.patternRepository.save(newPattern);
            }
        }
    }
    async getUserPatterns(userId) {
        return this.patternRepository.find({
            where: { user_id: userId },
            order: { frequency_count: 'DESC' },
        });
    }
};
exports.PatternAnalysisService = PatternAnalysisService;
exports.PatternAnalysisService = PatternAnalysisService = PatternAnalysisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IKarmaRepository')),
    __param(1, (0, typeorm_1.InjectRepository)(karma_pattern_entity_1.KarmaPattern)),
    __metadata("design:paramtypes", [Object, typeorm_2.Repository])
], PatternAnalysisService);
//# sourceMappingURL=pattern-analysis.service.js.map