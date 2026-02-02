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
var DigitalTwinService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigitalTwinService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_entity_1 = require("../../users/entities/customer.entity");
const karma_score_service_1 = require("../../karma/services/karma-score.service");
const manifestation_entity_1 = require("../../manifestation/entities/manifestation.entity");
const journal_entry_entity_1 = require("../../journal/entities/journal-entry.entity");
const karma_entry_entity_1 = require("../../karma/entities/karma-entry.entity");
let DigitalTwinService = DigitalTwinService_1 = class DigitalTwinService {
    constructor(customerRepository, karmaRepository, manifestationRepository, journalRepository, karmaEntryRepository, karmaScoreService) {
        this.customerRepository = customerRepository;
        this.karmaRepository = karmaRepository;
        this.manifestationRepository = manifestationRepository;
        this.journalRepository = journalRepository;
        this.karmaEntryRepository = karmaEntryRepository;
        this.karmaScoreService = karmaScoreService;
        this.logger = new common_1.Logger(DigitalTwinService_1.name);
    }
    async generateDigitalTwin(userId) {
        const customer = await this.customerRepository.findOne({
            where: { id: userId, is_deleted: false },
        });
        if (!customer) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            success: true,
            message: "We've created a living reflection of your current alignment.",
            twin_id: customer.unique_id,
        };
    }
    async getAlignmentIndex(userId) {
        const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
        const activeManifestations = await this.manifestationRepository.find({
            where: {
                user_id: userId,
                is_deleted: false,
                is_locked: true,
            },
            take: 1,
        });
        const hasClearDesire = activeManifestations.length > 0 && activeManifestations[0].coherence_score && activeManifestations[0].coherence_score > 70;
        const karmaTrend = karmaScore.trend;
        const timeSupport = karmaScore.trend_percentage > 5 ? 'Favorable' : karmaScore.trend_percentage < -5 ? 'Unfavorable' : 'Neutral';
        let alignmentScore = karmaScore.karma_score;
        if (activeManifestations.length > 0 && activeManifestations[0].mfp_score) {
            alignmentScore = (alignmentScore + (activeManifestations[0].mfp_score * 100)) / 2;
        }
        let status;
        if (alignmentScore >= 75) {
            status = 'Fully Aligned';
        }
        else if (alignmentScore >= 50) {
            status = 'Partially Aligned';
        }
        else {
            status = 'Misaligned';
        }
        return {
            status,
            score: Math.round(alignmentScore),
            components: {
                desire_clarity: hasClearDesire ? 'Clear' : 'Unclear',
                karma_trend: karmaTrend === 'improving' ? 'Improving' : karmaTrend === 'declining' ? 'Declining' : 'Stable',
                current_time_support: timeSupport,
            },
            focus_message: status === 'Fully Aligned'
                ? 'Continue your focused intention with patience.'
                : status === 'Partially Aligned'
                    ? 'Clarify your intentions and align your actions.'
                    : 'Focus on improving your karma and clarifying your desires.',
            determination_note: 'It is a blend of your stated goals, current karma state, and cosmic timing.',
        };
    }
    async getConsciousnessState(userId) {
        const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
        const recentJournals = await this.journalRepository.find({
            where: {
                user_id: userId,
                is_deleted: false,
            },
            order: { entry_date: 'DESC' },
            take: 5,
        });
        const hasReflections = recentJournals.length > 0;
        const isStable = karmaScore.trend === 'stable' || karmaScore.trend === 'improving';
        let state;
        if (isStable && hasReflections) {
            state = 'Stable';
        }
        else if (karmaScore.trend === 'improving') {
            state = 'Expanding';
        }
        else if (karmaScore.trend === 'declining') {
            state = 'Contracted';
        }
        else {
            state = 'Unstable';
        }
        return {
            state,
            meaning: state === 'Stable'
                ? 'You are noticing your thoughts and emotions without getting swept away by them.'
                : state === 'Expanding'
                    ? 'Your awareness is growing, and you are becoming more conscious of your patterns.'
                    : state === 'Contracted'
                        ? 'You may be experiencing resistance or limiting beliefs.'
                        : 'Your consciousness is fluctuating. Focus on grounding practices.',
            influence_factors: [
                'Recent reflections',
                'Emotional patterns',
                'Awareness vs reaction',
            ],
            action_suggestion: state === 'Stable'
                ? 'Notice your thoughts without attachment.'
                : 'Practice mindfulness and self-observation.',
        };
    }
    async getCurrentPhase(userId) {
        const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
        const isFavorable = karmaScore.trend === 'improving' && karmaScore.trend_percentage > 5;
        const direction = isFavorable ? 'Favorable ↑' : karmaScore.trend === 'declining' ? 'Unfavorable ↓' : 'Neutral →';
        return {
            phase_label: isFavorable ? 'Expansion Phase' : karmaScore.trend === 'declining' ? 'Contraction Phase' : 'Stable Phase',
            direction: direction,
            advisory_text: isFavorable
                ? 'This is a time for action and expansion. Seize the momentum now.'
                : karmaScore.trend === 'declining'
                    ? 'This is a time for reflection and inner work. Focus on healing.'
                    : 'This is a time for steady progress. Maintain your current practices.',
            time_window_note: isFavorable
                ? 'Short-term energy window is open. Seize the momentum now.'
                : 'Energy window is neutral. Focus on consistent actions.',
        };
    }
    async getEmotionalBaseline(userId) {
        const recentJournals = await this.journalRepository.find({
            where: {
                user_id: userId,
                is_deleted: false,
            },
            order: { entry_date: 'DESC' },
            take: 7,
        });
        let totalSentiment = 0;
        let count = 0;
        recentJournals.forEach(journal => {
            if (journal.sentiment_analysis?.score) {
                totalSentiment += journal.sentiment_analysis.score;
                count++;
            }
        });
        const avgSentiment = count > 0 ? totalSentiment / count : 0.5;
        const stabilityIndicator = Array.from({ length: 7 }, (_, i) => {
            const base = avgSentiment * 100;
            return Math.max(0, Math.min(100, base + (Math.random() * 20 - 10)));
        });
        let baseline;
        if (avgSentiment > 0.7) {
            baseline = 'Calm';
        }
        else if (avgSentiment > 0.5) {
            baseline = 'Stable';
        }
        else if (avgSentiment > 0.3) {
            baseline = 'Neutral';
        }
        else {
            baseline = 'Anxious';
        }
        return {
            baseline,
            stability_indicator: stabilityIndicator,
            insight_text: 'Your emotional baseline is the calm undercurrent of your being, regardless of surface fluctuations.',
            reflection_prompt: 'What brings you back to your calm center?',
        };
    }
    async getEnergyLevel(userId) {
        const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
        const energy = this.calculateEnergyFromKarma(karmaScore);
        let level;
        if (energy >= 75) {
            level = 'High';
        }
        else if (energy >= 50) {
            level = 'Balanced';
        }
        else if (energy >= 30) {
            level = 'Fluctuating';
        }
        else {
            level = 'Low';
        }
        return {
            level,
            icon: '⚡',
            suggested_approach: {
                act: level === 'High' ? 'Focus on priorities' : level === 'Balanced' ? 'Maintain momentum' : 'Take small steps',
                reflect: level === 'High' ? 'Assess your path' : 'Review your progress',
                rest: level === 'Low' ? 'Recharge mindfully' : 'Maintain balance',
            },
            influence_text: 'Your energy is influenced by mental clarity, emotional state, and physical vitality.',
            wisdom_prompt: 'How can you use this energy wisely?',
        };
    }
    async getKarmaState(userId) {
        const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);
        const monthStart = new Date(now);
        monthStart.setDate(monthStart.getDate() - 30);
        monthStart.setHours(0, 0, 0, 0);
        const todayEntries = await this.karmaEntryRepository.find({
            where: {
                user_id: userId,
                is_deleted: false,
                entry_date: (0, typeorm_2.MoreThanOrEqual)(todayStart),
            },
        });
        const weekEntries = await this.karmaEntryRepository.find({
            where: {
                user_id: userId,
                is_deleted: false,
                entry_date: (0, typeorm_2.MoreThanOrEqual)(weekStart),
            },
        });
        const monthEntries = await this.karmaEntryRepository.find({
            where: {
                user_id: userId,
                is_deleted: false,
                entry_date: (0, typeorm_2.MoreThanOrEqual)(monthStart),
            },
        });
        const countByType = (entries) => ({
            good: entries.filter(e => e.karma_type === 'good').length,
            bad: entries.filter(e => e.karma_type === 'bad').length,
            neutral: entries.filter(e => e.karma_type === 'neutral').length,
        });
        const recentInfluence = [];
        if (todayEntries.length > 0)
            recentInfluence.push('Journaling');
        if (karmaScore.good_actions_count > karmaScore.bad_actions_count)
            recentInfluence.push('Actions');
        if (monthEntries.length > 10)
            recentInfluence.push('Rituals');
        return {
            state: karmaScore.karma_score >= 60 ? 'Positive' : karmaScore.karma_score < 40 ? 'Negative' : 'Neutral',
            trend: karmaScore.trend === 'improving' ? 'Improving' : karmaScore.trend === 'declining' ? 'Declining' : 'Stable',
            icon: '⚖️',
            summary: {
                today: countByType(todayEntries),
                this_week: countByType(weekEntries),
                this_month: countByType(monthEntries),
            },
            recent_influence: recentInfluence,
            why_this_state: 'Your actions have aligned with your intentions, creating positive momentum.',
            focus_message: 'Focus on mindful actions.',
        };
    }
    async getManifestationResonance(userId) {
        const activeManifestation = await this.manifestationRepository.findOne({
            where: {
                user_id: userId,
                is_deleted: false,
                is_locked: true,
            },
            order: { added_date: 'DESC' },
        });
        const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
        if (!activeManifestation) {
            return {
                active_manifestation: null,
                resonance_state: 'Neutral →',
                influence_summary: {
                    karma: 'No active manifestation',
                    emotion: 'Neutral',
                    timing: 'Open',
                },
                guidance_text: 'Create a manifestation to see resonance analysis.',
            };
        }
        const resonanceScore = activeManifestation.resonance_score || 0;
        const resonanceState = resonanceScore > 70 ? 'Supportive ↑' : resonanceScore > 50 ? 'Neutral →' : 'Challenging ↓';
        return {
            active_manifestation: {
                name: activeManifestation.title,
                time_horizon: activeManifestation.target_date
                    ? `${Math.ceil((new Date(activeManifestation.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`
                    : 'Next 6 Months',
            },
            resonance_state: resonanceState,
            influence_summary: {
                karma: karmaScore.trend === 'improving' ? 'Positive Trend' : karmaScore.trend === 'declining' ? 'Negative Trend' : 'Stable',
                emotion: 'Stable Foundation',
                timing: 'Open Window',
            },
            guidance_text: 'Your current energy is well-aligned. Continue your focused intention with patience.',
        };
    }
    async getRecentActionInfluence(userId) {
        const recentKarma = await this.karmaEntryRepository.find({
            where: {
                user_id: userId,
                is_deleted: false,
            },
            order: { entry_date: 'DESC' },
            take: 5,
        });
        const recentJournals = await this.journalRepository.find({
            where: {
                user_id: userId,
                is_deleted: false,
            },
            order: { entry_date: 'DESC' },
            take: 3,
        });
        const lastActions = [
            ...recentJournals.slice(0, 2).map(j => ({
                action: 'Morning Meditation',
                status: 'Completed',
                impact: 'High Impact',
            })),
            ...recentJournals.slice(0, 1).map(j => ({
                action: 'Evening Reflections',
                status: 'Completed',
                impact: 'Moderate Impact',
            })),
            ...recentKarma.slice(0, 1).map(k => ({
                action: 'Karma Actions',
                status: 'Completed',
                impact: (Math.abs(Number(k.score)) > 5 ? 'High Impact' : 'Moderate Impact'),
            })),
            {
                action: 'Gratitude Journaling',
                status: 'Completed',
                impact: 'Moderate Impact',
            },
        ];
        const impactIndicator = recentKarma.length > 0 && recentKarma[0].karma_type === 'good'
            ? 'Strengthening ↑'
            : 'Stable →';
        return {
            last_actions: lastActions.slice(0, 4),
            impact_indicator: impactIndicator,
            insight_text: 'Your consistent positive actions are fortifying your digital twin\'s alignment with your intentions.',
        };
    }
    async getReflectionPrompt(userId) {
        const questions = [
            'What was my most aligned action today?',
            'How did I show up authentically today?',
            'What am I grateful for today?',
            'What did I learn about myself today?',
            'How did I contribute positively today?',
        ];
        const dayOfWeek = new Date().getDay();
        const question = questions[dayOfWeek % questions.length];
        return {
            question,
            type: 'daily',
        };
    }
    async getTwinEvolution(userId) {
        const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);
        const recentKarma = await this.karmaEntryRepository.count({
            where: {
                user_id: userId,
                is_deleted: false,
                entry_date: (0, typeorm_2.MoreThanOrEqual)(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
            },
        });
        const consistency = Math.min(100, (recentKarma / 30) * 100);
        const awareness = karmaScore.karma_score;
        const alignment = await this.getAlignmentIndex(userId).then(a => a.score);
        let currentStage;
        const avgScore = (consistency + awareness + alignment) / 3;
        if (avgScore >= 80) {
            currentStage = 'Mastering';
        }
        else if (avgScore >= 60) {
            currentStage = 'Expanding';
        }
        else if (avgScore >= 40) {
            currentStage = 'Building';
        }
        else {
            currentStage = 'Awakening';
        }
        return {
            current_stage: currentStage,
            growth_indicators: {
                consistency: {
                    value: Math.round(consistency),
                    label: consistency >= 70 ? 'Strong' : consistency >= 50 ? 'Moderate' : 'Developing',
                },
                awareness: {
                    value: Math.round(awareness),
                    label: awareness >= 70 ? 'Expanding' : awareness >= 50 ? 'Growing' : 'Developing',
                },
                alignment: {
                    value: Math.round(alignment),
                    label: alignment >= 70 ? 'Improving' : alignment >= 50 ? 'Stable' : 'Developing',
                },
            },
            locked_states: currentStage === 'Awakening'
                ? ['Building', 'Expanding', 'Mastering']
                : currentStage === 'Building'
                    ? ['Expanding', 'Mastering']
                    : currentStage === 'Expanding'
                        ? ['Mastering']
                        : [],
        };
    }
    async getCompleteTwinSummary(userId) {
        const [alignmentIndex, consciousnessState, currentPhase, emotionalBaseline, energyLevel, karmaState, manifestationResonance, recentActions, reflection, evolution,] = await Promise.all([
            this.getAlignmentIndex(userId),
            this.getConsciousnessState(userId),
            this.getCurrentPhase(userId),
            this.getEmotionalBaseline(userId),
            this.getEnergyLevel(userId),
            this.getKarmaState(userId),
            this.getManifestationResonance(userId),
            this.getRecentActionInfluence(userId),
            this.getReflectionPrompt(userId),
            this.getTwinEvolution(userId),
        ]);
        return {
            alignment_index: alignmentIndex,
            consciousness_state: consciousnessState,
            current_phase: currentPhase,
            emotional_baseline: emotionalBaseline,
            energy_level: energyLevel,
            karma_state: karmaState,
            manifestation_resonance: manifestationResonance,
            recent_actions: recentActions,
            reflection,
            evolution,
        };
    }
    calculateEnergyFromKarma(karmaScore) {
        let energy = karmaScore.karma_score;
        if (karmaScore.trend === 'improving') {
            energy += Math.min(10, karmaScore.trend_percentage * 0.1);
        }
        else if (karmaScore.trend === 'declining') {
            energy += Math.max(-10, karmaScore.trend_percentage * 0.1);
        }
        return Math.max(0, Math.min(100, energy));
    }
};
exports.DigitalTwinService = DigitalTwinService;
exports.DigitalTwinService = DigitalTwinService = DigitalTwinService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(1, (0, common_1.Inject)('IKarmaRepository')),
    __param(2, (0, typeorm_1.InjectRepository)(manifestation_entity_1.Manifestation)),
    __param(3, (0, typeorm_1.InjectRepository)(journal_entry_entity_1.JournalEntry)),
    __param(4, (0, typeorm_1.InjectRepository)(karma_entry_entity_1.KarmaEntry)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object, typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        karma_score_service_1.KarmaScoreService])
], DigitalTwinService);
//# sourceMappingURL=digital-twin.service.js.map