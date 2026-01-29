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
var ManifestationEnhancedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestationEnhancedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const manifestation_entity_1 = require("../entities/manifestation.entity");
const manifestation_ai_evaluation_service_1 = require("./manifestation-ai-evaluation.service");
const user_entity_1 = require("../../users/entities/user.entity");
const customer_entity_1 = require("../../users/entities/customer.entity");
const swiss_ephemeris_service_1 = require("../../astrology/services/swiss-ephemeris.service");
const dasha_record_entity_1 = require("../../database/entities/dasha-record.entity");
const antardasha_record_entity_1 = require("../../database/entities/antardasha-record.entity");
const pratyantar_dasha_record_entity_1 = require("../../database/entities/pratyantar-dasha-record.entity");
const sukshma_dasha_record_entity_1 = require("../../database/entities/sukshma-dasha-record.entity");
const kundli_entity_1 = require("../../kundli/entities/kundli.entity");
const kundli_planet_entity_1 = require("../../kundli/entities/kundli-planet.entity");
const kundli_house_entity_1 = require("../../kundli/entities/kundli-house.entity");
const kundli_service_1 = require("../../kundli/services/kundli.service");
let ManifestationEnhancedService = ManifestationEnhancedService_1 = class ManifestationEnhancedService {
    constructor(manifestationRepository, userRepository, customerRepository, dashaRepository, antardashaRepository, pratyantarRepository, sukshmaRepository, kundliRepository, kundliPlanetRepository, kundliHouseRepository, aiEvaluationService, swissEphemerisService, kundliService) {
        this.manifestationRepository = manifestationRepository;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.dashaRepository = dashaRepository;
        this.antardashaRepository = antardashaRepository;
        this.pratyantarRepository = pratyantarRepository;
        this.sukshmaRepository = sukshmaRepository;
        this.kundliRepository = kundliRepository;
        this.kundliPlanetRepository = kundliPlanetRepository;
        this.kundliHouseRepository = kundliHouseRepository;
        this.aiEvaluationService = aiEvaluationService;
        this.swissEphemerisService = swissEphemerisService;
        this.kundliService = kundliService;
        this.logger = new common_1.Logger(ManifestationEnhancedService_1.name);
    }
    async createManifestation(userId, dto) {
        if (dto.description.trim().length < 15) {
            throw new common_1.BadRequestException('Description must be at least 15 characters long. Please provide more details about your manifestation intent.');
        }
        const description = dto.description.trim();
        const firstSentence = description.split(/[.!?]/)[0].trim();
        let title;
        if (firstSentence.length > 0 && firstSentence.length <= 200) {
            title = firstSentence;
        }
        else {
            title = description.substring(0, 50).trim();
            if (title.length < description.length) {
                title += '...';
            }
        }
        if (title.length > 200) {
            title = title.substring(0, 197) + '...';
        }
        let user = null;
        user = await this.customerRepository.findOne({ where: { id: userId, is_deleted: false } });
        if (!user) {
            user = await this.userRepository.findOne({ where: { id: userId, is_deleted: false } });
        }
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const quickScores = await this.getQuickScores(title, description);
        const manifestation = this.manifestationRepository.create({
            user_id: userId,
            title: title,
            description: dto.description.trim(),
            category: quickScores.category,
            emotional_state: null,
            target_date: null,
            resonance_score: quickScores.resonance_score,
            alignment_score: quickScores.alignment_score,
            antrashaakti_score: quickScores.antrashaakti_score,
            mahaadha_score: quickScores.mahaadha_score,
            astro_support_index: quickScores.astro_support_index,
            mfp_score: quickScores.mfp_score,
            coherence_score: quickScores.coherence_score,
            action_windows: null,
            progress_tracking: {
                current_progress: 0,
                journal_entries_count: 0,
                milestones: [],
            },
            tips: null,
            insights: {
                ai_narrative: '',
                astro_insights: '',
                energy_state: quickScores.energy_state,
                keyword_analysis: {},
                emotional_charge: 'neutral',
                category_label: quickScores.category_label,
            },
            is_archived: false,
        });
        const savedManifestation = await this.manifestationRepository.save(manifestation);
        this.enhanceManifestationAsync(savedManifestation.id, userId, title, description, user).catch(error => {
            this.logger.error(`Async enhancement failed for manifestation ${savedManifestation.id}:`, error);
        });
        return savedManifestation;
    }
    async getQuickScores(title, description) {
        const text = `${title} ${description}`.toLowerCase();
        const categoryKeywords = {
            career: ['job', 'career', 'work', 'promotion', 'business', 'office', 'salary', 'profession', 'position', 'cm', 'minister', 'election', 'political', 'government', 'sarpanch', 'mla', 'mp'],
            relationship: ['love', 'relationship', 'marriage', 'partner', 'spouse', 'family', 'friend', 'dating'],
            money: ['money', 'wealth', 'rich', 'income', 'financial', 'earning', 'profit', 'investment'],
            health: ['health', 'fitness', 'weight', 'body', 'disease', 'cure', 'medical', 'wellness'],
            spiritual: ['spiritual', 'meditation', 'peace', 'enlightenment', 'soul', 'divine', 'god', 'prayer'],
        };
        let detectedCategory = 'other';
        let maxScore = 0;
        for (const [cat, keywords] of Object.entries(categoryKeywords)) {
            const score = keywords.filter(kw => text.includes(kw)).length;
            if (score > maxScore) {
                maxScore = score;
                detectedCategory = cat;
            }
        }
        const categoryLabels = {
            career: 'Career & Work',
            relationship: 'Relationships',
            money: 'Wealth & Finance',
            health: 'Health & Wellness',
            spiritual: 'Spirituality',
            other: 'General',
        };
        const positiveWords = ['want', 'wish', 'desire', 'hope', 'dream', 'achieve', 'success', 'happy', 'love', 'grow', 'improve', 'best'];
        const negativeWords = ['not', 'never', 'can\'t', 'won\'t', 'fear', 'worry', 'doubt', 'fail', 'hate', 'problem'];
        const positiveCount = positiveWords.filter(w => text.includes(w)).length;
        const negativeCount = negativeWords.filter(w => text.includes(w)).length;
        let resonance_score = 50 + (positiveCount * 8) - (negativeCount * 10);
        resonance_score = Math.max(20, Math.min(85, resonance_score));
        let alignment_score = 40;
        if (/\d{4}/.test(text))
            alignment_score += 15;
        if (/\d+/.test(text))
            alignment_score += 10;
        if (text.length > 50)
            alignment_score += 10;
        if (text.length > 100)
            alignment_score += 5;
        alignment_score = Math.min(80, alignment_score);
        const powerWords = ['will', 'can', 'able', 'strong', 'confident', 'believe', 'certain'];
        const powerCount = powerWords.filter(w => text.includes(w)).length;
        let antrashaakti_score = 45 + (powerCount * 8);
        antrashaakti_score = Math.min(75, antrashaakti_score);
        let mahaadha_score = negativeCount * 15;
        mahaadha_score = Math.min(50, mahaadha_score);
        const astro_support_index = 60;
        const mahaadhaInfluence = 100 - mahaadha_score;
        const mfp_score = Math.round(resonance_score * 0.25 +
            alignment_score * 0.20 +
            antrashaakti_score * 0.20 +
            mahaadhaInfluence * 0.15 +
            astro_support_index * 0.20);
        const coherence_score = Math.round((resonance_score + alignment_score) / 2);
        let energy_state = 'aligned';
        if (mfp_score < 45)
            energy_state = 'blocked';
        else if (mfp_score < 60)
            energy_state = 'unstable';
        return {
            category: detectedCategory,
            category_label: categoryLabels[detectedCategory] || 'General',
            resonance_score: Math.round(resonance_score),
            alignment_score: Math.round(alignment_score),
            antrashaakti_score: Math.round(antrashaakti_score),
            mahaadha_score: Math.round(mahaadha_score),
            astro_support_index,
            mfp_score,
            coherence_score,
            energy_state,
        };
    }
    async enhanceManifestationAsync(manifestationId, userId, title, description, user) {
        try {
            this.logger.log(`Starting async enhancement for manifestation ${manifestationId}`);
            await this.ensureKundliExists(user);
            const evaluation = await this.aiEvaluationService.evaluateManifestation(title, description, undefined, user);
            const finalCategory = evaluation.detectedCategory || null;
            const kundliBasedScores = await this.calculateKundliBasedScores(userId, finalCategory);
            let astro_support_index = evaluation.scores.astro_support_index;
            let mahaadha_score = evaluation.scores.mahaadha_score;
            let antrashaakti_score = evaluation.scores.antrashaakti_score;
            if (kundliBasedScores) {
                astro_support_index = kundliBasedScores.astro_support_index;
                if (kundliBasedScores.dasha_challenging > 50) {
                    mahaadha_score = Math.min(100, evaluation.scores.mahaadha_score + Math.round(kundliBasedScores.dasha_challenging * 0.3));
                }
                if (kundliBasedScores.dasha_supportive > 70) {
                    antrashaakti_score = Math.min(100, evaluation.scores.antrashaakti_score + Math.round((kundliBasedScores.dasha_supportive - 50) * 0.2));
                }
            }
            const mfp_score = this.computeMFPScore({
                resonance_score: evaluation.scores.resonance_score,
                alignment_score: evaluation.scores.alignment_score,
                antrashaakti_score: antrashaakti_score,
                mahaadha_score: mahaadha_score,
                astro_support_index: astro_support_index,
            });
            const actionWindows = await this.calculateActionWindows(finalCategory, user);
            const enhancedInsights = { ...evaluation.insights };
            if (kundliBasedScores && kundliBasedScores.currentDasha) {
                const mahaLord = kundliBasedScores.currentDasha.mahadasha?.lord || 'Unknown';
                const antaraLord = kundliBasedScores.currentDasha.antardasha?.lord || 'Unknown';
                enhancedInsights.astro_insights = `Current Dasha: ${mahaLord}-${antaraLord}. ${kundliBasedScores.dasha_supportive > 60
                    ? `This period is favorable (${Math.round(kundliBasedScores.dasha_supportive)}% supportive) for ${finalCategory || 'your'} manifestations.`
                    : `This period has some challenges (${Math.round(kundliBasedScores.dasha_challenging)}% challenging). Focus on inner alignment and patience.`}`;
            }
            await this.manifestationRepository.update(manifestationId, {
                category: finalCategory,
                resonance_score: evaluation.scores.resonance_score,
                alignment_score: evaluation.scores.alignment_score,
                antrashaakti_score: antrashaakti_score,
                mahaadha_score: mahaadha_score,
                astro_support_index: astro_support_index,
                mfp_score: mfp_score,
                coherence_score: evaluation.scores.coherence_score,
                action_windows: actionWindows,
                tips: evaluation.tips,
                insights: enhancedInsights,
            });
            this.logger.log(`Async enhancement completed for manifestation ${manifestationId}`);
        }
        catch (error) {
            this.logger.error(`Async enhancement failed for manifestation ${manifestationId}:`, error);
        }
    }
    async getDashboard(userId) {
        const activeManifestations = await this.manifestationRepository.find({
            where: {
                user_id: userId,
                is_archived: false,
                is_deleted: false,
            },
            order: { added_date: 'ASC' },
        });
        const lockedManifestations = activeManifestations.filter(m => m.is_locked === true);
        this.logger.debug(`Total active manifestations: ${activeManifestations.length}`);
        this.logger.debug(`Locked manifestations: ${lockedManifestations.length}`);
        if (lockedManifestations.length > 0) {
            this.logger.debug(`Locked manifestation IDs: ${lockedManifestations.map(m => m.id).join(', ')}`);
            this.logger.debug(`Locked manifestation scores:`, lockedManifestations.map(m => ({
                id: m.id,
                resonance: m.resonance_score,
                alignment: m.alignment_score,
                astro: m.astro_support_index,
            })));
        }
        let top_resonance = 0;
        let alignment_score = 0;
        let astro_support = 0;
        let energy_state = 'aligned';
        if (lockedManifestations.length > 0) {
            const totalResonance = lockedManifestations.reduce((sum, m) => {
                let score = 0;
                if (m.resonance_score !== null && m.resonance_score !== undefined) {
                    score = typeof m.resonance_score === 'string'
                        ? parseFloat(m.resonance_score)
                        : Number(m.resonance_score);
                    if (isNaN(score))
                        score = 0;
                }
                return sum + score;
            }, 0);
            const totalAlignment = lockedManifestations.reduce((sum, m) => {
                let score = 0;
                if (m.alignment_score !== null && m.alignment_score !== undefined) {
                    score = typeof m.alignment_score === 'string'
                        ? parseFloat(m.alignment_score)
                        : Number(m.alignment_score);
                    if (isNaN(score))
                        score = 0;
                }
                return sum + score;
            }, 0);
            const totalAstro = lockedManifestations.reduce((sum, m) => {
                let score = 0;
                if (m.astro_support_index !== null && m.astro_support_index !== undefined) {
                    score = typeof m.astro_support_index === 'string'
                        ? parseFloat(m.astro_support_index)
                        : Number(m.astro_support_index);
                    if (isNaN(score))
                        score = 0;
                }
                return sum + score;
            }, 0);
            top_resonance = Math.round((totalResonance / lockedManifestations.length) * 100) / 100;
            alignment_score = Math.round((totalAlignment / lockedManifestations.length) * 100) / 100;
            astro_support = Math.round((totalAstro / lockedManifestations.length) * 100) / 100;
            top_resonance = (isNaN(top_resonance) || top_resonance === null || top_resonance === undefined) ? 0 : top_resonance;
            alignment_score = (isNaN(alignment_score) || alignment_score === null || alignment_score === undefined) ? 0 : alignment_score;
            astro_support = (isNaN(astro_support) || astro_support === null || astro_support === undefined) ? 0 : astro_support;
            const mostRecentLocked = lockedManifestations[lockedManifestations.length - 1];
            energy_state = mostRecentLocked.insights?.energy_state || 'aligned';
            this.logger.debug(`Dashboard calculation: ${lockedManifestations.length} locked manifestations`);
            this.logger.debug(`Calculated scores: resonance=${top_resonance}, alignment=${alignment_score}, astro=${astro_support}`);
        }
        else if (activeManifestations.length > 0) {
            const topManifestation = activeManifestations[0];
            top_resonance = topManifestation.resonance_score !== null && topManifestation.resonance_score !== undefined
                ? (typeof topManifestation.resonance_score === 'string'
                    ? parseFloat(topManifestation.resonance_score) || 0
                    : Number(topManifestation.resonance_score) || 0)
                : 0;
            alignment_score = topManifestation.alignment_score !== null && topManifestation.alignment_score !== undefined
                ? (typeof topManifestation.alignment_score === 'string'
                    ? parseFloat(topManifestation.alignment_score) || 0
                    : Number(topManifestation.alignment_score) || 0)
                : 0;
            astro_support = topManifestation.astro_support_index !== null && topManifestation.astro_support_index !== undefined
                ? (typeof topManifestation.astro_support_index === 'string'
                    ? parseFloat(topManifestation.astro_support_index) || 0
                    : Number(topManifestation.astro_support_index) || 0)
                : 0;
            energy_state = topManifestation.insights?.energy_state || 'aligned';
        }
        const summary = {
            top_resonance: top_resonance !== null && top_resonance !== undefined && !isNaN(top_resonance) ? Number(top_resonance) : 0,
            alignment_score: alignment_score !== null && alignment_score !== undefined && !isNaN(alignment_score) ? Number(alignment_score) : 0,
            astro_support: astro_support !== null && astro_support !== undefined && !isNaN(astro_support) ? Number(astro_support) : 0,
            energy_state: energy_state || 'aligned',
        };
        this.logger.debug(`Dashboard summary calculated:`, JSON.stringify(summary));
        this.logger.debug(`Locked manifestations count: ${lockedManifestations.length}`);
        return {
            summary,
            manifestations: activeManifestations.map((m) => ({
                id: m.id,
                title: m.title,
                description: m.description,
                resonance_score: typeof m.resonance_score === 'string'
                    ? parseFloat(m.resonance_score)
                    : (m.resonance_score || null),
                alignment_score: typeof m.alignment_score === 'string'
                    ? parseFloat(m.alignment_score)
                    : (m.alignment_score || null),
                coherence_score: typeof m.coherence_score === 'string'
                    ? parseFloat(m.coherence_score)
                    : (m.coherence_score || null),
                mfp_score: typeof m.mfp_score === 'string'
                    ? parseFloat(m.mfp_score)
                    : (m.mfp_score || null),
                astro_support_index: typeof m.astro_support_index === 'string'
                    ? parseFloat(m.astro_support_index)
                    : (m.astro_support_index || null),
                is_archived: m.is_archived,
                is_locked: m.is_locked,
                added_date: m.added_date,
                category: m.category,
                category_label: m.category,
                action_windows: m.action_windows,
                progress_tracking: m.progress_tracking,
            })),
        };
    }
    async getManifestationById(id, userId) {
        const manifestation = await this.manifestationRepository.findOne({
            where: { id, user_id: userId, is_deleted: false },
        });
        if (!manifestation) {
            throw new common_1.NotFoundException('Manifestation not found');
        }
        return manifestation;
    }
    async archiveManifestation(id, userId) {
        const manifestation = await this.manifestationRepository.findOne({
            where: { id, user_id: userId, is_deleted: false },
        });
        if (!manifestation) {
            throw new common_1.NotFoundException('Manifestation not found');
        }
        manifestation.is_archived = true;
        return await this.manifestationRepository.save(manifestation);
    }
    async toggleLockManifestation(id, userId) {
        const manifestation = await this.manifestationRepository.findOne({
            where: { id, user_id: userId, is_deleted: false },
        });
        if (!manifestation) {
            throw new common_1.NotFoundException('Manifestation not found');
        }
        manifestation.is_locked = !manifestation.is_locked;
        return await this.manifestationRepository.save(manifestation);
    }
    async getTips(id, userId) {
        const manifestation = await this.manifestationRepository.findOne({
            where: { id, user_id: userId, is_deleted: false },
        });
        if (!manifestation) {
            throw new common_1.NotFoundException('Manifestation not found');
        }
        return {
            tips: manifestation.tips || {
                rituals: [],
                what_to_manifest: [],
                what_not_to_manifest: [],
                thought_alignment: [],
                daily_actions: [],
            },
        };
    }
    async calculateActionWindows(category, user) {
        const optimalDates = [];
        const planetaryInfluences = [];
        const today = new Date();
        const next30Days = [];
        for (let i = 1; i <= 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            next30Days.push(date);
        }
        const categoryPlanets = {
            relationship: { primary: 'Venus', secondary: 'Jupiter' },
            love: { primary: 'Venus', secondary: 'Jupiter' },
            career: { primary: 'Mercury', secondary: 'Jupiter' },
            wealth: { primary: 'Jupiter', secondary: 'Venus' },
            money: { primary: 'Jupiter', secondary: 'Venus' },
            health: { primary: 'Mars', secondary: 'Sun' },
            spiritual: { primary: 'Jupiter', secondary: 'Ketu' },
            spirituality: { primary: 'Jupiter', secondary: 'Ketu' },
        };
        const planets = category && categoryPlanets[category.toLowerCase()]
            ? [categoryPlanets[category.toLowerCase()].primary, categoryPlanets[category.toLowerCase()].secondary]
            : ['Jupiter', 'Venus'];
        for (const date of next30Days) {
            try {
                const kundliData = await this.swissEphemerisService.calculateKundli({
                    datetime: date,
                    latitude: user?.latitude || 28.6139,
                    longitude: user?.longitude || 77.2090,
                    timezone: 'Asia/Kolkata',
                });
                let positiveInfluence = 0;
                let planetInfluence = null;
                for (const planetName of planets) {
                    const planet = kundliData.planets.find((p) => p.name === planetName);
                    if (planet) {
                        const favorableSigns = {
                            Venus: ['Taurus', 'Libra', 'Pisces'],
                            Jupiter: ['Sagittarius', 'Pisces', 'Cancer'],
                            Mercury: ['Gemini', 'Virgo'],
                            Mars: ['Aries', 'Scorpio', 'Capricorn'],
                            Sun: ['Leo', 'Aries'],
                        };
                        if (favorableSigns[planetName]?.includes(planet.sign)) {
                            positiveInfluence += 2;
                            planetInfluence = {
                                planet: planetName,
                                influence: 'positive',
                                description: `${planetName} is in favorable sign ${planet.sign}`,
                            };
                        }
                        else {
                            positiveInfluence += 1;
                            if (!planetInfluence) {
                                planetInfluence = {
                                    planet: planetName,
                                    influence: 'neutral',
                                    description: `${planetName} is in ${planet.sign}`,
                                };
                            }
                        }
                    }
                }
                const moon = kundliData.planets.find((p) => p.name === 'Moon');
                if (moon) {
                    const moonPhase = (moon.longitude % 360) / 360;
                    if (moonPhase < 0.1 || moonPhase > 0.9) {
                        positiveInfluence += 3;
                        if (planetInfluence) {
                            planetInfluence.influence = 'positive';
                            planetInfluence.description += ` + Powerful Moon phase`;
                        }
                    }
                }
                if (positiveInfluence >= 4) {
                    optimalDates.push(date.toISOString().split('T')[0]);
                    if (planetInfluence) {
                        planetaryInfluences.push({
                            date: date.toISOString().split('T')[0],
                            ...planetInfluence,
                        });
                    }
                }
            }
            catch (error) {
                continue;
            }
        }
        const topOptimalDates = optimalDates.slice(0, 5);
        return {
            optimal_dates: topOptimalDates,
            next_optimal_date: topOptimalDates.length > 0 ? topOptimalDates[0] : null,
            planetary_influences: planetaryInfluences.slice(0, 5),
        };
    }
    async getAllManifestations(userId, includeArchived = false) {
        const where = {
            user_id: userId,
            is_deleted: false,
        };
        if (!includeArchived) {
            where.is_archived = false;
        }
        return await this.manifestationRepository.find({
            where,
            order: { added_date: 'DESC' },
        });
    }
    async calculateKundliBasedScores(userId, category) {
        try {
            const kundli = await this.kundliRepository.findOne({
                where: { user_id: userId, is_deleted: false },
            });
            if (!kundli) {
                this.logger.warn(`No kundli found for user ${userId}, using default astro scores`);
                return null;
            }
            const currentDate = new Date();
            let currentMahadasha = null;
            let currentAntardasha = null;
            let currentPratyantar = null;
            if (kundli.dasha_timeline) {
                const dashaTimeline = kundli.dasha_timeline;
                if (!Array.isArray(dashaTimeline) && dashaTimeline.vimshottari && dashaTimeline.vimshottari.mahadasha) {
                    const mahadashas = dashaTimeline.vimshottari.mahadasha;
                    const birthDate = kundli.birth_date instanceof Date ? kundli.birth_date : new Date(kundli.birth_date);
                    const dashaData = this.calculateCurrentDashaFromTimeline(mahadashas, currentDate, birthDate);
                    if (dashaData) {
                        currentMahadasha = dashaData.mahadasha;
                        currentAntardasha = dashaData.antardasha;
                        currentPratyantar = dashaData.pratyantar;
                    }
                }
                else if (Array.isArray(dashaTimeline)) {
                    const birthDate = kundli.birth_date instanceof Date ? kundli.birth_date : new Date(kundli.birth_date);
                    const dashaData = this.calculateCurrentDashaFromTimeline(dashaTimeline, currentDate, birthDate);
                    if (dashaData) {
                        currentMahadasha = dashaData.mahadasha;
                        currentAntardasha = dashaData.antardasha;
                        currentPratyantar = dashaData.pratyantar;
                    }
                }
            }
            if (!currentMahadasha && kundli.nakshatra) {
                const birthDate = kundli.birth_date instanceof Date ? kundli.birth_date : new Date(kundli.birth_date);
                const birthTime = kundli.birth_time ? `${kundli.birth_date}T${kundli.birth_time}` : kundli.birth_date;
                const birthDateTime = new Date(birthTime);
                const dashaData = this.calculateDashaFromBirthDateAndNakshatra(birthDateTime, kundli.nakshatra, currentDate);
                if (dashaData) {
                    currentMahadasha = dashaData.mahadasha;
                    currentAntardasha = dashaData.antardasha;
                    currentPratyantar = dashaData.pratyantar;
                }
            }
            if (!currentMahadasha) {
                try {
                    const dashaRecords = await this.dashaRepository.find({
                        where: { user_id: userId },
                        relations: ['antardashas', 'antardashas.pratyantardashas'],
                        order: { start_date: 'ASC' },
                    });
                    for (const dasha of dashaRecords) {
                        if (new Date(dasha.start_date) <= currentDate && new Date(dasha.end_date) >= currentDate) {
                            currentMahadasha = {
                                lord: dasha.mahadasha_lord,
                                start: new Date(dasha.start_date),
                                end: new Date(dasha.end_date),
                            };
                            for (const antara of dasha.antardashas || []) {
                                if (new Date(antara.start_date) <= currentDate && new Date(antara.end_date) >= currentDate) {
                                    currentAntardasha = {
                                        lord: antara.antardasha_lord,
                                        start: new Date(antara.start_date),
                                        end: new Date(antara.end_date),
                                    };
                                    for (const pratyantar of antara.pratyantardashas || []) {
                                        if (new Date(pratyantar.start_date) <= currentDate && new Date(pratyantar.end_date) >= currentDate) {
                                            currentPratyantar = {
                                                lord: pratyantar.pratyantar_lord,
                                                start: new Date(pratyantar.start_date),
                                                end: new Date(pratyantar.end_date),
                                            };
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }
                catch (error) {
                    this.logger.warn('Could not fetch Dasha records:', error.message);
                }
            }
            if (!currentMahadasha) {
                this.logger.warn(`Could not calculate dasha for user ${userId}`);
                return null;
            }
            const categoryPlanets = {
                relationship: {
                    primary: ['Venus', 'Jupiter'],
                    secondary: ['Moon', 'Mercury'],
                    neutral: ['Sun', 'Mars'],
                    challenging: ['Saturn', 'Rahu', 'Ketu'],
                },
                love: {
                    primary: ['Venus', 'Jupiter'],
                    secondary: ['Moon'],
                    neutral: ['Mercury', 'Sun'],
                    challenging: ['Saturn', 'Mars', 'Rahu', 'Ketu'],
                },
                career: {
                    primary: ['Mercury', 'Jupiter', 'Sun'],
                    secondary: ['Venus', 'Moon'],
                    neutral: ['Mars'],
                    challenging: ['Saturn', 'Rahu', 'Ketu'],
                },
                wealth: {
                    primary: ['Jupiter', 'Venus'],
                    secondary: ['Mercury', 'Moon'],
                    neutral: ['Sun'],
                    challenging: ['Saturn', 'Mars', 'Rahu', 'Ketu'],
                },
                money: {
                    primary: ['Jupiter', 'Venus'],
                    secondary: ['Mercury'],
                    neutral: ['Sun', 'Moon'],
                    challenging: ['Saturn', 'Mars', 'Rahu', 'Ketu'],
                },
                health: {
                    primary: ['Mars', 'Sun', 'Moon'],
                    secondary: ['Jupiter'],
                    neutral: ['Mercury', 'Venus'],
                    challenging: ['Saturn', 'Rahu', 'Ketu'],
                },
                spiritual: {
                    primary: ['Jupiter', 'Ketu', 'Saturn'],
                    secondary: ['Moon', 'Sun'],
                    neutral: ['Mercury', 'Venus'],
                    challenging: ['Mars', 'Rahu'],
                },
                other: {
                    primary: ['Jupiter', 'Venus'],
                    secondary: ['Mercury', 'Moon'],
                    neutral: ['Sun', 'Mars'],
                    challenging: ['Saturn', 'Rahu', 'Ketu'],
                },
            };
            const planetAlignment = categoryPlanets[category?.toLowerCase() || 'other'] || categoryPlanets.other;
            const calculateDashaResonance = (lord) => {
                if (!lord)
                    return { supportive: 50, challenging: 50 };
                if (planetAlignment.primary.includes(lord)) {
                    return { supportive: 90, challenging: 10 };
                }
                else if (planetAlignment.secondary.includes(lord)) {
                    return { supportive: 75, challenging: 25 };
                }
                else if (planetAlignment.neutral.includes(lord)) {
                    return { supportive: 55, challenging: 45 };
                }
                else if (planetAlignment.challenging.includes(lord)) {
                    return { supportive: 30, challenging: 70 };
                }
                return { supportive: 50, challenging: 50 };
            };
            const mahaResonance = calculateDashaResonance(currentMahadasha?.lord);
            const antaraResonance = calculateDashaResonance(currentAntardasha?.lord);
            const pratyantarResonance = calculateDashaResonance(currentPratyantar?.lord);
            const dasha_supportive = Math.round(mahaResonance.supportive * 0.50 +
                antaraResonance.supportive * 0.35 +
                pratyantarResonance.supportive * 0.15);
            const dasha_challenging = Math.round(mahaResonance.challenging * 0.50 +
                antaraResonance.challenging * 0.35 +
                pratyantarResonance.challenging * 0.15);
            const astro_support_index = dasha_supportive;
            this.logger.log(`Kundli-based scores for user ${userId}: astro_support=${astro_support_index}, dasha_supportive=${dasha_supportive}, Mahadasha=${currentMahadasha?.lord}, Antardasha=${currentAntardasha?.lord}`);
            return {
                astro_support_index,
                dasha_supportive,
                dasha_challenging,
                currentDasha: {
                    mahadasha: currentMahadasha,
                    antardasha: currentAntardasha,
                    pratyantar: currentPratyantar,
                },
            };
        }
        catch (error) {
            this.logger.error(`Error calculating kundli-based scores for user ${userId}:`, error);
            return null;
        }
    }
    computeMFPScore(scores) {
        const weights = {
            resonance: 0.25,
            alignment: 0.20,
            antrashaakti: 0.20,
            mahaadha: 0.15,
            astro: 0.20,
        };
        const mahaadhaInfluence = 100 - scores.mahaadha_score;
        const mfp = scores.resonance_score * weights.resonance +
            scores.alignment_score * weights.alignment +
            scores.antrashaakti_score * weights.antrashaakti +
            mahaadhaInfluence * weights.mahaadha +
            scores.astro_support_index * weights.astro;
        return Math.max(0, Math.min(100, Math.round(mfp)));
    }
    async ensureKundliExists(user) {
        try {
            const existingKundli = await this.kundliRepository.findOne({
                where: { user_id: user.id, is_deleted: false },
            });
            if (existingKundli) {
                this.logger.debug(`Kundli already exists for user ${user.id}`);
                return;
            }
            const birthDate = user.date_of_birth || user.birth_date;
            const birthTime = user.time_of_birth || user.birth_time;
            const latitude = user.latitude;
            const longitude = user.longitude;
            const placeName = user.place_name || user.birth_place;
            if (!birthDate || !birthTime || !latitude || !longitude) {
                this.logger.warn(`User ${user.id} missing birth data for kundli calculation`);
                return;
            }
            this.logger.log(`Calculating kundli for user ${user.id}`);
            const firstName = user.first_name || 'User';
            const lastName = user.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            await this.kundliService.generateKundli({
                name: fullName,
                birth_date: birthDate instanceof Date ? birthDate.toISOString().split('T')[0] : birthDate,
                birth_time: birthTime,
                birth_place: placeName || 'Unknown',
                latitude,
                longitude,
                timezone: user.timezone || 'Asia/Kolkata',
            }, user.id);
        }
        catch (error) {
            this.logger.error(`Failed to ensure kundli exists for user ${user.id}:`, error);
        }
    }
    async calculateAndStoreDashaPeriods(userId, user) {
        try {
            const existingDasha = await this.dashaRepository.findOne({
                where: { user_id: userId },
            });
            if (existingDasha) {
                this.logger.debug(`Dasha periods already exist for user ${userId}`);
                return;
            }
            const nakshatra = user.nakshatra;
            const dashaAtBirth = user.dasha_at_birth;
            const birthDate = user.date_of_birth || user.birth_date;
            const moonLongitude = user.moon_longitude;
            if (!nakshatra || !dashaAtBirth || !birthDate) {
                this.logger.warn(`User ${userId} missing nakshatra or birth data for Dasha calculation`);
                return;
            }
            const dashaSequence = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
            const dashaDurations = {
                Ketu: 7,
                Venus: 20,
                Sun: 6,
                Moon: 10,
                Mars: 7,
                Rahu: 18,
                Jupiter: 16,
                Saturn: 19,
                Mercury: 17,
            };
            const nakshatraData = {
                'Ashwini': { start: 0, end: 13.333, lord: 'Ketu' },
                'Bharani': { start: 13.333, end: 26.667, lord: 'Venus' },
                'Krittika': { start: 26.667, end: 40, lord: 'Sun' },
                'Rohini': { start: 40, end: 53.333, lord: 'Moon' },
                'Mrigashira': { start: 53.333, end: 66.667, lord: 'Mars' },
                'Ardra': { start: 66.667, end: 80, lord: 'Rahu' },
                'Punarvasu': { start: 80, end: 93.333, lord: 'Jupiter' },
                'Pushya': { start: 93.333, end: 106.667, lord: 'Saturn' },
                'Ashlesha': { start: 106.667, end: 120, lord: 'Mercury' },
                'Magha': { start: 120, end: 133.333, lord: 'Ketu' },
                'Purva Phalguni': { start: 133.333, end: 146.667, lord: 'Venus' },
                'Uttara Phalguni': { start: 146.667, end: 160, lord: 'Sun' },
                'Hasta': { start: 160, end: 173.333, lord: 'Moon' },
                'Chitra': { start: 173.333, end: 186.667, lord: 'Mars' },
                'Swati': { start: 186.667, end: 200, lord: 'Rahu' },
                'Vishakha': { start: 200, end: 213.333, lord: 'Jupiter' },
                'Anuradha': { start: 213.333, end: 226.667, lord: 'Saturn' },
                'Jyeshtha': { start: 226.667, end: 240, lord: 'Mercury' },
                'Mula': { start: 240, end: 253.333, lord: 'Ketu' },
                'Purva Ashadha': { start: 253.333, end: 266.667, lord: 'Venus' },
                'Uttara Ashadha': { start: 266.667, end: 280, lord: 'Sun' },
                'Shravana': { start: 280, end: 293.333, lord: 'Moon' },
                'Dhanishta': { start: 293.333, end: 306.667, lord: 'Mars' },
                'Shatabhisha': { start: 306.667, end: 320, lord: 'Rahu' },
                'Purva Bhadrapada': { start: 320, end: 333.333, lord: 'Jupiter' },
                'Uttara Bhadrapada': { start: 333.333, end: 346.667, lord: 'Saturn' },
                'Revati': { start: 346.667, end: 360, lord: 'Mercury' },
            };
            const startIndex = dashaSequence.indexOf(dashaAtBirth);
            if (startIndex === -1) {
                this.logger.warn(`Invalid dasha_at_birth: ${dashaAtBirth}, using Moon as default`);
            }
            const birthDateTime = new Date(birthDate);
            if (user.time_of_birth) {
                const timeStr = user.time_of_birth;
                if (timeStr.includes(':')) {
                    const [hours, minutes] = timeStr.split(':');
                    birthDateTime.setHours(parseInt(hours) || 12, parseInt(minutes) || 0, 0, 0);
                }
            }
            else {
                birthDateTime.setHours(12, 0, 0, 0);
            }
            const nakshatraSpan = 13.333333;
            let balanceYears = dashaDurations[dashaAtBirth];
            if (moonLongitude !== undefined && moonLongitude >= 0) {
                const nakshatraInfo = nakshatraData[nakshatra];
                if (nakshatraInfo) {
                    const degreesRemaining = nakshatraInfo.end - moonLongitude;
                    const balanceRatio = Math.max(0, Math.min(1, degreesRemaining / nakshatraSpan));
                    balanceYears = balanceRatio * dashaDurations[dashaAtBirth];
                    this.logger.log(`Dasha balance calculation: Moon at ${moonLongitude}°, Nakshatra end ${nakshatraInfo.end}°, Balance ${balanceYears.toFixed(2)} years`);
                }
            }
            else {
                this.logger.warn(`Moon longitude not available for user ${userId}, using full dasha duration for first period`);
            }
            const actualStartIndex = startIndex !== -1 ? startIndex : dashaSequence.indexOf('Moon');
            let currentDate = new Date(birthDateTime);
            const mahadashas = [];
            for (let i = 0; i < 4; i++) {
                const lordIndex = (actualStartIndex + i) % 9;
                const lord = dashaSequence[lordIndex];
                const duration = (i === 0) ? balanceYears : dashaDurations[lord];
                const start = new Date(currentDate);
                const end = new Date(currentDate);
                end.setTime(end.getTime() + duration * 365.25 * 24 * 60 * 60 * 1000);
                mahadashas.push({ lord, start, end, duration });
                currentDate = new Date(end);
            }
            for (const maha of mahadashas) {
                const mahaRecord = this.dashaRepository.create({
                    user_id: userId,
                    mahadasha_lord: maha.lord,
                    start_date: maha.start,
                    end_date: maha.end,
                    duration_years: maha.duration,
                });
                const savedMaha = await this.dashaRepository.save(mahaRecord);
                const antaraSequence = dashaSequence;
                const antaraStartIndex = dashaSequence.indexOf(maha.lord);
                let antaraCurrentDate = new Date(maha.start);
                for (let j = 0; j < 9; j++) {
                    const antaraLordIndex = (antaraStartIndex + j) % 9;
                    const antaraLord = antaraSequence[antaraLordIndex];
                    const mahaLord = maha.lord;
                    const antaraDuration = (dashaDurations[antaraLord] * dashaDurations[mahaLord]) / 120;
                    const antaraStart = new Date(antaraCurrentDate);
                    const antaraEnd = new Date(antaraCurrentDate);
                    antaraEnd.setTime(antaraEnd.getTime() + antaraDuration * 365.25 * 24 * 60 * 60 * 1000);
                    if (antaraEnd > maha.end) {
                        antaraEnd.setTime(maha.end.getTime());
                    }
                    const antaraRecord = this.antardashaRepository.create({
                        dasha_record_id: savedMaha.id,
                        antardasha_lord: antaraLord,
                        start_date: antaraStart,
                        end_date: antaraEnd,
                        duration_years: antaraDuration,
                    });
                    const savedAntara = await this.antardashaRepository.save(antaraRecord);
                    const pratyantarStartIndex = dashaSequence.indexOf(antaraLord);
                    let pratyantarCurrentDate = new Date(antaraStart);
                    for (let k = 0; k < 9; k++) {
                        const pratyantarLordIndex = (pratyantarStartIndex + k) % 9;
                        const pratyantarLord = antaraSequence[pratyantarLordIndex];
                        const pratyantarDuration = (dashaDurations[pratyantarLord] * dashaDurations[antaraLord]) / 120;
                        const pratyantarStart = new Date(pratyantarCurrentDate);
                        const pratyantarEnd = new Date(pratyantarCurrentDate);
                        pratyantarEnd.setTime(pratyantarEnd.getTime() + pratyantarDuration * 365.25 * 24 * 60 * 60 * 1000);
                        if (pratyantarEnd > antaraEnd) {
                            pratyantarEnd.setTime(antaraEnd.getTime());
                        }
                        const pratyantarRecord = this.pratyantarRepository.create({
                            antardasha_record_id: savedAntara.id,
                            pratyantar_lord: pratyantarLord,
                            start_date: pratyantarStart,
                            end_date: pratyantarEnd,
                            duration_years: pratyantarDuration,
                        });
                        const savedPratyantar = await this.pratyantarRepository.save(pratyantarRecord);
                        const sukshmaStartIndex = dashaSequence.indexOf(pratyantarLord);
                        let sukshmaCurrentDate = new Date(pratyantarStart);
                        for (let l = 0; l < 9; l++) {
                            const sukshmaLordIndex = (sukshmaStartIndex + l) % 9;
                            const sukshmaLord = antaraSequence[sukshmaLordIndex];
                            const sukshmaDuration = (dashaDurations[sukshmaLord] * dashaDurations[pratyantarLord]) / 120;
                            const sukshmaStart = new Date(sukshmaCurrentDate);
                            const sukshmaEnd = new Date(sukshmaCurrentDate);
                            sukshmaEnd.setTime(sukshmaEnd.getTime() + sukshmaDuration * 365.25 * 24 * 60 * 60 * 1000);
                            if (sukshmaEnd > pratyantarEnd) {
                                sukshmaEnd.setTime(pratyantarEnd.getTime());
                            }
                            const sukshmaRecord = this.sukshmaRepository.create({
                                pratyantar_dasha_record_id: savedPratyantar.id,
                                sukshma_lord: sukshmaLord,
                                start_date: sukshmaStart,
                                end_date: sukshmaEnd,
                                duration_years: sukshmaDuration,
                            });
                            await this.sukshmaRepository.save(sukshmaRecord);
                            sukshmaCurrentDate = new Date(sukshmaEnd);
                            if (sukshmaCurrentDate >= pratyantarEnd)
                                break;
                        }
                        pratyantarCurrentDate = new Date(pratyantarEnd);
                        if (pratyantarCurrentDate >= antaraEnd)
                            break;
                    }
                    antaraCurrentDate = new Date(antaraEnd);
                    if (antaraCurrentDate >= maha.end)
                        break;
                }
            }
            this.logger.log(`Dasha periods calculated and stored for user ${userId}`);
        }
        catch (error) {
            this.logger.error(`Failed to calculate Dasha periods for user ${userId}:`, error);
        }
    }
    async calculateDetailedResonance(userId, description) {
        let user = null;
        user = await this.customerRepository.findOne({ where: { id: userId, is_deleted: false } });
        if (!user) {
            user = await this.userRepository.findOne({ where: { id: userId, is_deleted: false } });
        }
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.ensureKundliExists(user);
        const firstSentence = description.split(/[.!?]/)[0].trim();
        const title = firstSentence.length > 0 && firstSentence.length <= 200
            ? firstSentence
            : description.substring(0, 50).trim() + (description.length > 50 ? '...' : '');
        const evaluation = await this.aiEvaluationService.evaluateManifestation(title, description, null, user);
        const resonanceScore = evaluation.scores.resonance_score;
        const category = evaluation.detectedCategory || 'other';
        const categoryLabel = evaluation.insights?.category_label || category;
        const kundli = await this.kundliRepository.findOne({
            where: { user_id: userId, is_deleted: false },
        });
        let planets = [];
        let houses = [];
        if (kundli) {
            try {
                planets = await this.kundliPlanetRepository.find({
                    where: { kundli_id: kundli.id, is_deleted: false },
                });
                houses = await this.kundliHouseRepository.find({
                    where: { kundli_id: kundli.id, is_deleted: false },
                });
                this.logger.debug(`Found ${planets.length} planets and ${houses.length} houses for kundli ${kundli.id}`);
            }
            catch (error) {
                this.logger.warn('Could not fetch planets/houses, continuing without them:', error.message);
            }
        }
        const currentDate = new Date();
        let currentMahadasha = null;
        let currentAntardasha = null;
        let currentPratyantar = null;
        let currentSukshma = null;
        if (kundli) {
            this.logger.debug(`Kundli found for user ${userId}, nakshatra: ${kundli.nakshatra}, dasha_timeline exists: ${!!kundli.dasha_timeline}`);
            let dashaData = null;
            if (kundli.dasha_timeline) {
                this.logger.debug(`dasha_timeline type: ${typeof kundli.dasha_timeline}, isArray: ${Array.isArray(kundli.dasha_timeline)}`);
                const dashaTimeline = kundli.dasha_timeline;
                if (!Array.isArray(dashaTimeline) && dashaTimeline.vimshottari && dashaTimeline.vimshottari.mahadasha) {
                    this.logger.debug('Using nested vimshottari structure');
                    const mahadashas = dashaTimeline.vimshottari.mahadasha;
                    const birthDate = kundli.birth_date instanceof Date ? kundli.birth_date : new Date(kundli.birth_date);
                    dashaData = this.calculateCurrentDashaFromTimeline(mahadashas, currentDate, birthDate);
                }
                else if (Array.isArray(dashaTimeline)) {
                    this.logger.debug('Using direct array format');
                    const birthDate = kundli.birth_date instanceof Date ? kundli.birth_date : new Date(kundli.birth_date);
                    dashaData = this.calculateCurrentDashaFromTimeline(dashaTimeline, currentDate, birthDate);
                }
                else {
                    this.logger.warn(`Unexpected dasha_timeline format: ${typeof dashaTimeline}`);
                }
            }
            if (!dashaData && kundli.nakshatra) {
                this.logger.log(`Calculating dasha from birth date (${kundli.birth_date}) and nakshatra (${kundli.nakshatra})`);
                const birthDate = kundli.birth_date instanceof Date ? kundli.birth_date : new Date(kundli.birth_date);
                const birthTime = kundli.birth_time ? `${kundli.birth_date}T${kundli.birth_time}` : kundli.birth_date;
                const birthDateTime = new Date(birthTime);
                dashaData = this.calculateDashaFromBirthDateAndNakshatra(birthDateTime, kundli.nakshatra, currentDate);
            }
            if (dashaData) {
                currentMahadasha = dashaData.mahadasha;
                currentAntardasha = dashaData.antardasha;
                currentPratyantar = dashaData.pratyantar;
                currentSukshma = dashaData.sukshma;
                this.logger.log(`Current Dasha calculated: Mahadasha=${currentMahadasha?.lord || 'Unknown'}, Antardasha=${currentAntardasha?.lord || 'Unknown'}`);
            }
            else {
                this.logger.warn(`Could not calculate dasha from kundli data. Nakshatra: ${kundli.nakshatra}, Birth date: ${kundli.birth_date}`);
            }
        }
        else {
            this.logger.warn(`No kundli found for user ${userId}`);
        }
        if (!currentMahadasha) {
            this.logger.warn('No dasha_timeline in kundli, trying dasha_records table');
            try {
                const dashaRecords = await this.dashaRepository.find({
                    where: { user_id: userId },
                    relations: ['antardashas', 'antardashas.pratyantardashas', 'antardashas.pratyantardashas.sukshmadashas'],
                    order: { start_date: 'ASC' },
                });
                for (const dasha of dashaRecords) {
                    if (new Date(dasha.start_date) <= currentDate && new Date(dasha.end_date) >= currentDate) {
                        currentMahadasha = dasha;
                        for (const antara of dasha.antardashas || []) {
                            if (new Date(antara.start_date) <= currentDate && new Date(antara.end_date) >= currentDate) {
                                currentAntardasha = antara;
                                for (const pratyantar of antara.pratyantardashas || []) {
                                    if (new Date(pratyantar.start_date) <= currentDate && new Date(pratyantar.end_date) >= currentDate) {
                                        currentPratyantar = pratyantar;
                                        for (const sukshma of pratyantar.sukshmadashas || []) {
                                            if (new Date(sukshma.start_date) <= currentDate && new Date(sukshma.end_date) >= currentDate) {
                                                currentSukshma = sukshma;
                                                break;
                                            }
                                        }
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                        break;
                    }
                }
            }
            catch (error) {
                this.logger.warn('Could not fetch Dasha records:', error.message);
            }
        }
        const categoryPlanets = {
            relationship: {
                primary: ['Venus', 'Jupiter'],
                secondary: ['Moon', 'Mercury'],
                neutral: ['Sun', 'Mars'],
                challenging: ['Saturn', 'Rahu', 'Ketu'],
            },
            love: {
                primary: ['Venus', 'Jupiter'],
                secondary: ['Moon'],
                neutral: ['Mercury', 'Sun'],
                challenging: ['Saturn', 'Mars', 'Rahu', 'Ketu'],
            },
            career: {
                primary: ['Mercury', 'Jupiter', 'Sun'],
                secondary: ['Venus', 'Moon'],
                neutral: ['Mars'],
                challenging: ['Saturn', 'Rahu', 'Ketu'],
            },
            wealth: {
                primary: ['Jupiter', 'Venus'],
                secondary: ['Mercury', 'Moon'],
                neutral: ['Sun'],
                challenging: ['Saturn', 'Mars', 'Rahu', 'Ketu'],
            },
            money: {
                primary: ['Jupiter', 'Venus'],
                secondary: ['Mercury'],
                neutral: ['Sun', 'Moon'],
                challenging: ['Saturn', 'Mars', 'Rahu', 'Ketu'],
            },
            health: {
                primary: ['Mars', 'Sun', 'Moon'],
                secondary: ['Jupiter'],
                neutral: ['Mercury', 'Venus'],
                challenging: ['Saturn', 'Rahu', 'Ketu'],
            },
            spiritual: {
                primary: ['Jupiter', 'Ketu', 'Saturn'],
                secondary: ['Moon', 'Sun'],
                neutral: ['Mercury', 'Venus'],
                challenging: ['Mars', 'Rahu'],
            },
            other: {
                primary: ['Jupiter', 'Venus'],
                secondary: ['Mercury', 'Moon'],
                neutral: ['Sun', 'Mars'],
                challenging: ['Saturn', 'Rahu', 'Ketu'],
            },
        };
        const planetAlignment = categoryPlanets[category] || categoryPlanets.other;
        const calculateDashaResonance = (lord) => {
            if (!lord || lord === 'Unknown') {
                return { supportive: 0, challenging: 100 };
            }
            if (planetAlignment.primary.includes(lord)) {
                return { supportive: 90, challenging: 10 };
            }
            else if (planetAlignment.secondary.includes(lord)) {
                return { supportive: 77, challenging: 23 };
            }
            else if (planetAlignment.neutral.includes(lord)) {
                return { supportive: 55, challenging: 45 };
            }
            else if (planetAlignment.challenging.includes(lord)) {
                return { supportive: 32, challenging: 68 };
            }
            else {
                return { supportive: 50, challenging: 50 };
            }
        };
        const mahadashaResonance = calculateDashaResonance(currentMahadasha?.lord || currentMahadasha?.mahadasha_lord || null);
        const antardashaResonance = calculateDashaResonance(currentAntardasha?.lord || currentAntardasha?.antardasha_lord || null);
        const pratyantarResonance = calculateDashaResonance(currentPratyantar?.lord || currentPratyantar?.pratyantar_lord || null);
        const sukshmaResonance = calculateDashaResonance(currentSukshma?.lord || currentSukshma?.sukshma_lord || null);
        const supportiveFactors = [];
        if (currentMahadasha && mahadashaResonance.supportive >= 70) {
            const mahaLord = currentMahadasha.lord || currentMahadasha.mahadasha_lord;
            const score = Math.round(mahadashaResonance.supportive);
            const startDate = currentMahadasha.start instanceof Date ? currentMahadasha.start : new Date(currentMahadasha.start || currentMahadasha.start_date);
            const endDate = currentMahadasha.end instanceof Date ? currentMahadasha.end : new Date(currentMahadasha.end || currentMahadasha.end_date);
            supportiveFactors.push({
                type: 'mahadasha',
                description: `Best Mahadasha period: ${mahaLord} (${score}% supportive)`,
                score: score,
                weightage: 0.5,
                period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
            });
        }
        if (currentAntardasha && antardashaResonance.supportive >= 70) {
            const antaraLord = currentAntardasha.lord || currentAntardasha.antardasha_lord;
            const score = Math.round(antardashaResonance.supportive);
            const startDate = currentAntardasha.start instanceof Date ? currentAntardasha.start : new Date(currentAntardasha.start || currentAntardasha.start_date);
            const endDate = currentAntardasha.end instanceof Date ? currentAntardasha.end : new Date(currentAntardasha.end || currentAntardasha.end_date);
            supportiveFactors.push({
                type: 'antardasha',
                description: `Best Antardasha period: ${antaraLord} (${score}% supportive)`,
                score: score,
                weightage: 0.9,
                period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
            });
        }
        if (currentPratyantar && pratyantarResonance.supportive >= 70) {
            const pratyantarLord = currentPratyantar.lord || currentPratyantar.pratyantar_lord;
            const score = Math.round(pratyantarResonance.supportive);
            const startDate = currentPratyantar.start instanceof Date ? currentPratyantar.start : new Date(currentPratyantar.start || currentPratyantar.start_date);
            const endDate = currentPratyantar.end instanceof Date ? currentPratyantar.end : new Date(currentPratyantar.end || currentPratyantar.end_date);
            supportiveFactors.push({
                type: 'pratyantar',
                description: `Favorable Pratyantar period: ${pratyantarLord} (${score}% supportive)`,
                score: score,
                weightage: 0.3,
                period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
            });
        }
        if (currentMahadasha && currentAntardasha) {
            const avgSupport = Math.round((mahadashaResonance.supportive + antardashaResonance.supportive) / 2);
            supportiveFactors.push({
                type: 'dasha_analysis',
                description: `Analyzed Dasha periods from now until fulfillment date. Average support: ${avgSupport}%`,
                score: avgSupport,
                weightage: 1.0,
            });
        }
        const challengingFactors = [];
        if (currentMahadasha && mahadashaResonance.challenging >= 60) {
            const mahaLord = currentMahadasha.lord || currentMahadasha.mahadasha_lord;
            challengingFactors.push({
                type: 'mahadasha',
                description: `${mahaLord} Mahadasha period is challenging for this manifestation (${Math.round(mahadashaResonance.challenging)}% challenging)`,
                impact: Math.round(mahadashaResonance.challenging),
                weightage: 15,
            });
        }
        if (currentAntardasha && antardashaResonance.challenging >= 60) {
            const antaraLord = currentAntardasha.lord || currentAntardasha.antardasha_lord;
            challengingFactors.push({
                type: 'antardasha',
                description: `${antaraLord} Antardasha period creates obstacles (${Math.round(antardashaResonance.challenging)}% challenging)`,
                impact: Math.round(antardashaResonance.challenging),
                weightage: 10,
            });
        }
        if (evaluation.scores.mahaadha_score > 30) {
            challengingFactors.push({
                type: 'karma_debt',
                description: `Recent karma debt reduces momentum (Mahaadha score: ${Math.round(evaluation.scores.mahaadha_score)})`,
                impact: Math.min(50, Math.round(evaluation.scores.mahaadha_score)),
                weightage: 10,
            });
        }
        if (resonanceScore < 50) {
            challengingFactors.push({
                type: 'low_resonance',
                description: `Manifestation needs more clarity and positive energy (Resonance: ${Math.round(resonanceScore)}%)`,
                impact: Math.round(100 - resonanceScore),
                weightage: 20,
            });
        }
        const avgDashaSupport = currentMahadasha && currentAntardasha
            ? (mahadashaResonance.supportive + antardashaResonance.supportive) / 2
            : mahadashaResonance.supportive;
        let manifestationClass = 'neutral';
        let manifestationClassLabel = 'Neutral';
        if (resonanceScore >= 80 && avgDashaSupport >= 75) {
            manifestationClass = 'highly_favourable';
            manifestationClassLabel = 'Highly Favourable - Strong Dasha Alignment';
        }
        else if (resonanceScore >= 70 && avgDashaSupport >= 65) {
            manifestationClass = 'highly_favourable';
            manifestationClassLabel = 'Highly Favourable - Good Dasha Alignment';
        }
        else if (resonanceScore >= 60 || avgDashaSupport >= 60) {
            manifestationClass = 'favourable';
            manifestationClassLabel = 'Favourable';
        }
        else if (resonanceScore < 40 || avgDashaSupport < 40) {
            manifestationClass = 'challenging';
            manifestationClassLabel = 'Challenging - Needs More Alignment';
        }
        else {
            manifestationClass = 'neutral';
            manifestationClassLabel = 'Neutral - Moderate Support';
        }
        return {
            resonance_score: Math.round(resonanceScore * 10) / 10,
            category,
            category_label: categoryLabel,
            manifestation_class: manifestationClass,
            manifestation_class_label: manifestationClassLabel,
            supportive_factors: supportiveFactors,
            challenging_factors: challengingFactors,
            dasha_resonance: {
                mahadasha: {
                    lord: currentMahadasha?.lord || currentMahadasha?.mahadasha_lord || 'Unknown',
                    supportive: mahadashaResonance.supportive,
                    challenging: mahadashaResonance.challenging,
                    period: currentMahadasha
                        ? `${(currentMahadasha.start instanceof Date ? currentMahadasha.start : new Date(currentMahadasha.start || currentMahadasha.start_date)).toISOString().split('T')[0]} to ${(currentMahadasha.end instanceof Date ? currentMahadasha.end : new Date(currentMahadasha.end || currentMahadasha.end_date)).toISOString().split('T')[0]}`
                        : 'N/A',
                },
                antardasha: {
                    lord: currentAntardasha?.lord || currentAntardasha?.antardasha_lord || 'Unknown',
                    supportive: antardashaResonance.supportive,
                    challenging: antardashaResonance.challenging,
                    period: currentAntardasha
                        ? `${(currentAntardasha.start instanceof Date ? currentAntardasha.start : new Date(currentAntardasha.start || currentAntardasha.start_date)).toISOString().split('T')[0]} to ${(currentAntardasha.end instanceof Date ? currentAntardasha.end : new Date(currentAntardasha.end || currentAntardasha.end_date)).toISOString().split('T')[0]}`
                        : 'N/A',
                },
                pratyantar: {
                    lord: currentPratyantar?.lord || currentPratyantar?.pratyantar_lord || 'Unknown',
                    supportive: pratyantarResonance.supportive,
                    challenging: pratyantarResonance.challenging,
                    period: currentPratyantar
                        ? `${(currentPratyantar.start instanceof Date ? currentPratyantar.start : new Date(currentPratyantar.start || currentPratyantar.start_date)).toISOString().split('T')[0]} to ${(currentPratyantar.end instanceof Date ? currentPratyantar.end : new Date(currentPratyantar.end || currentPratyantar.end_date)).toISOString().split('T')[0]}`
                        : 'N/A',
                },
                sukshma: {
                    lord: currentSukshma?.lord || currentSukshma?.sukshma_lord || 'Unknown',
                    supportive: sukshmaResonance.supportive,
                    challenging: sukshmaResonance.challenging,
                    period: currentSukshma
                        ? `${(currentSukshma.start instanceof Date ? currentSukshma.start : new Date(currentSukshma.start || currentSukshma.start_date)).toISOString().split('T')[0]} to ${(currentSukshma.end instanceof Date ? currentSukshma.end : new Date(currentSukshma.end || currentSukshma.end_date)).toISOString().split('T')[0]}`
                        : 'N/A',
                },
            },
            tips: await this.generateEnhancedTips(evaluation.tips, category, currentMahadasha, currentAntardasha, planets, houses, kundli),
            insights: await this.generateEnhancedInsights(evaluation.insights, category, currentMahadasha, currentAntardasha, planets, houses, kundli),
        };
    }
    calculateCurrentDashaFromTimeline(dashaTimeline, currentDate, birthDate) {
        const dashaSequence = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
        const dashaDurations = {
            Ketu: 7,
            Venus: 20,
            Sun: 6,
            Moon: 10,
            Mars: 7,
            Rahu: 18,
            Jupiter: 16,
            Saturn: 19,
            Mercury: 17,
        };
        if (Array.isArray(dashaTimeline) && dashaTimeline.length > 0) {
            const currentMaha = dashaTimeline.find((d) => {
                const start = d.start instanceof Date ? d.start : new Date(d.start || d.start_date);
                const end = d.end instanceof Date ? d.end : new Date(d.end || d.end_date);
                return currentDate >= start && currentDate < end;
            });
            if (currentMaha) {
                const mahaLord = currentMaha.lord || currentMaha.mahadasha_lord;
                const mahaStart = new Date(currentMaha.start || currentMaha.start_date);
                const mahaEnd = new Date(currentMaha.end || currentMaha.end_date);
                const mahaIndex = dashaSequence.indexOf(mahaLord);
                const mahaDuration = dashaDurations[mahaLord];
                const elapsed = (currentDate.getTime() - mahaStart.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                const progress = elapsed / mahaDuration;
                const antaraIndex = Math.floor(progress * 9);
                const antaraLord = dashaSequence[(mahaIndex + antaraIndex) % 9];
                const antaraDuration = mahaDuration / 9;
                const antaraStart = new Date(mahaStart);
                antaraStart.setTime(antaraStart.getTime() + antaraIndex * antaraDuration * 365.25 * 24 * 60 * 60 * 1000);
                const antaraEnd = new Date(antaraStart);
                antaraEnd.setTime(antaraEnd.getTime() + antaraDuration * 365.25 * 24 * 60 * 60 * 1000);
                const pratyantarIndex = Math.floor((progress * 9 - antaraIndex) * 9);
                const pratyantarLord = dashaSequence[(dashaSequence.indexOf(antaraLord) + pratyantarIndex) % 9];
                const pratyantarDuration = antaraDuration / 9;
                const pratyantarStart = new Date(antaraStart);
                pratyantarStart.setTime(pratyantarStart.getTime() + pratyantarIndex * pratyantarDuration * 365.25 * 24 * 60 * 60 * 1000);
                const pratyantarEnd = new Date(pratyantarStart);
                pratyantarEnd.setTime(pratyantarEnd.getTime() + pratyantarDuration * 365.25 * 24 * 60 * 60 * 1000);
                const sukshmaIndex = Math.floor(((progress * 9 - antaraIndex) * 9 - pratyantarIndex) * 9);
                const sukshmaLord = dashaSequence[(dashaSequence.indexOf(pratyantarLord) + sukshmaIndex) % 9];
                const sukshmaDuration = pratyantarDuration / 9;
                const sukshmaStart = new Date(pratyantarStart);
                sukshmaStart.setTime(sukshmaStart.getTime() + sukshmaIndex * sukshmaDuration * 365.25 * 24 * 60 * 60 * 1000);
                const sukshmaEnd = new Date(sukshmaStart);
                sukshmaEnd.setTime(sukshmaEnd.getTime() + sukshmaDuration * 365.25 * 24 * 60 * 60 * 1000);
                return {
                    mahadasha: { lord: mahaLord, start: mahaStart, end: mahaEnd },
                    antardasha: { lord: antaraLord, start: antaraStart, end: antaraEnd },
                    pratyantar: { lord: pratyantarLord, start: pratyantarStart, end: pratyantarEnd },
                    sukshma: { lord: sukshmaLord, start: sukshmaStart, end: sukshmaEnd },
                };
            }
        }
        return {
            mahadasha: null,
            antardasha: null,
            pratyantar: null,
            sukshma: null,
        };
    }
    calculateDashaFromBirthDateAndNakshatra(birthDate, nakshatraName, currentDate) {
        const dashaSequence = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
        const dashaDurations = {
            Ketu: 7,
            Venus: 20,
            Sun: 6,
            Moon: 10,
            Mars: 7,
            Rahu: 18,
            Jupiter: 16,
            Saturn: 19,
            Mercury: 17,
        };
        const nakshatraLords = {
            'Ashwini': 'Ketu',
            'Bharani': 'Venus',
            'Krittika': 'Sun',
            'Rohini': 'Moon',
            'Mrigashira': 'Mars',
            'Ardra': 'Rahu',
            'Punarvasu': 'Jupiter',
            'Pushya': 'Saturn',
            'Ashlesha': 'Mercury',
            'Magha': 'Ketu',
            'Purva Phalguni': 'Venus',
            'Uttara Phalguni': 'Sun',
            'Hasta': 'Moon',
            'Chitra': 'Mars',
            'Swati': 'Rahu',
            'Vishakha': 'Jupiter',
            'Anuradha': 'Saturn',
            'Jyeshtha': 'Mercury',
            'Mula': 'Ketu',
            'Purva Ashadha': 'Venus',
            'Uttara Ashadha': 'Sun',
            'Shravana': 'Moon',
            'Dhanishta': 'Mars',
            'Shatabhisha': 'Rahu',
            'Purva Bhadrapada': 'Jupiter',
            'Uttara Bhadrapada': 'Saturn',
            'Revati': 'Mercury',
        };
        const nakshatraLord = nakshatraLords[nakshatraName] || 'Moon';
        const startIndex = dashaSequence.indexOf(nakshatraLord);
        const actualStartIndex = startIndex !== -1 ? startIndex : dashaSequence.indexOf('Moon');
        const mahadashas = [];
        let loopDate = new Date(birthDate);
        for (let i = 0; i < 9; i++) {
            const lordIndex = (actualStartIndex + i) % 9;
            const lord = dashaSequence[lordIndex];
            const duration = dashaDurations[lord];
            const start = new Date(loopDate);
            const end = new Date(loopDate);
            end.setTime(end.getTime() + duration * 365.25 * 24 * 60 * 60 * 1000);
            mahadashas.push({ lord, start, end });
            loopDate = new Date(end);
        }
        const currentMaha = mahadashas.find((m) => currentDate >= m.start && currentDate < m.end) || mahadashas[0];
        if (!currentMaha) {
            return {
                mahadasha: null,
                antardasha: null,
                pratyantar: null,
                sukshma: null,
            };
        }
        const mahaLord = currentMaha.lord;
        const mahaStart = currentMaha.start;
        const mahaEnd = currentMaha.end;
        const mahaDuration = dashaDurations[mahaLord];
        const elapsed = (currentDate.getTime() - mahaStart.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        const progress = Math.max(0, Math.min(1, elapsed / mahaDuration));
        const mahaIndex = dashaSequence.indexOf(mahaLord);
        const antaraIndex = Math.floor(progress * 9);
        const antaraLord = dashaSequence[(mahaIndex + antaraIndex) % 9];
        const antaraDuration = mahaDuration / 9;
        const antaraStart = new Date(mahaStart);
        antaraStart.setTime(antaraStart.getTime() + antaraIndex * antaraDuration * 365.25 * 24 * 60 * 60 * 1000);
        const antaraEnd = new Date(antaraStart);
        antaraEnd.setTime(antaraEnd.getTime() + antaraDuration * 365.25 * 24 * 60 * 60 * 1000);
        const pratyantarProgress = (progress * 9 - antaraIndex);
        const pratyantarIndex = Math.floor(pratyantarProgress * 9);
        const pratyantarLord = dashaSequence[(dashaSequence.indexOf(antaraLord) + pratyantarIndex) % 9];
        const pratyantarDuration = antaraDuration / 9;
        const pratyantarStart = new Date(antaraStart);
        pratyantarStart.setTime(pratyantarStart.getTime() + pratyantarIndex * pratyantarDuration * 365.25 * 24 * 60 * 60 * 1000);
        const pratyantarEnd = new Date(pratyantarStart);
        pratyantarEnd.setTime(pratyantarEnd.getTime() + pratyantarDuration * 365.25 * 24 * 60 * 60 * 1000);
        const sukshmaProgress = (pratyantarProgress * 9 - pratyantarIndex);
        const sukshmaIndex = Math.floor(sukshmaProgress * 9);
        const sukshmaLord = dashaSequence[(dashaSequence.indexOf(pratyantarLord) + sukshmaIndex) % 9];
        const sukshmaDuration = pratyantarDuration / 9;
        const sukshmaStart = new Date(pratyantarStart);
        sukshmaStart.setTime(sukshmaStart.getTime() + sukshmaIndex * sukshmaDuration * 365.25 * 24 * 60 * 60 * 1000);
        const sukshmaEnd = new Date(sukshmaStart);
        sukshmaEnd.setTime(sukshmaEnd.getTime() + sukshmaDuration * 365.25 * 24 * 60 * 60 * 1000);
        return {
            mahadasha: { lord: mahaLord, start: mahaStart, end: mahaEnd },
            antardasha: { lord: antaraLord, start: antaraStart, end: antaraEnd },
            pratyantar: { lord: pratyantarLord, start: pratyantarStart, end: pratyantarEnd },
            sukshma: { lord: sukshmaLord, start: sukshmaStart, end: sukshmaEnd },
        };
    }
    async generateEnhancedTips(baseTips, category, mahadasha, antardasha, planets, houses, kundli) {
        const tips = { ...baseTips };
        if (mahadasha && antardasha) {
            const dashaRituals = this.getDashaSpecificRituals(mahadasha.lord, antardasha.lord, category);
            if (dashaRituals.length > 0) {
                tips.rituals = [...(tips.rituals || []), ...dashaRituals];
            }
        }
        if (planets.length > 0) {
            const planetaryGuidance = this.getPlanetaryGuidance(planets, category);
            if (planetaryGuidance.whatToManifest.length > 0) {
                tips.what_to_manifest = [...(tips.what_to_manifest || []), ...planetaryGuidance.whatToManifest];
            }
            if (planetaryGuidance.whatNotToManifest.length > 0) {
                tips.what_not_to_manifest = [...(tips.what_not_to_manifest || []), ...planetaryGuidance.whatNotToManifest];
            }
        }
        if (houses.length > 0) {
            const karmicTheme = this.getKarmicTheme(houses, category);
            if (karmicTheme) {
                tips.karmic_theme = karmicTheme;
            }
        }
        if (mahadasha) {
            const alignmentTips = this.getDashaAlignmentTips(mahadasha.lord, category);
            if (alignmentTips.length > 0) {
                tips.thought_alignment = [...(tips.thought_alignment || []), ...alignmentTips];
            }
        }
        if (planets.length > 0 && mahadasha) {
            tips.daily_actions = this.getDailyActions(planets, mahadasha.lord, category);
        }
        return tips;
    }
    async generateEnhancedInsights(baseInsights, category, mahadasha, antardasha, planets, houses, kundli) {
        const insights = { ...baseInsights };
        if (kundli && planets.length > 0) {
            insights.astro_insights = this.generateAstroInsights(kundli, planets, houses, mahadasha, antardasha, category);
        }
        return insights;
    }
    getDashaSpecificRituals(mahadashaLord, antardashaLord, category) {
        const rituals = [];
        const mahaRituals = {
            Jupiter: {
                career: [
                    'Chant "Om Gurave Namah" 108 times daily for career growth.',
                    'Wear yellow clothes on Thursdays and offer yellow flowers to Lord Vishnu.',
                ],
                wealth: [
                    'Donate yellow items (turmeric, yellow clothes) on Thursdays.',
                    'Recite Guru Mantra: "Om Brihaspataye Namah" 108 times.',
                ],
            },
            Venus: {
                love: [
                    'Chant "Om Shukraya Namah" 108 times daily for relationship harmony.',
                    'Wear white clothes on Fridays and offer white flowers.',
                ],
                career: [
                    'Wear white or light-colored clothes on Fridays for professional success.',
                ],
            },
            Sun: {
                career: [
                    'Chant "Om Suryaya Namah" 108 times at sunrise.',
                    'Offer water to Sun God every morning facing east.',
                ],
            },
            Moon: {
                love: [
                    'Chant "Om Chandraya Namah" 108 times on Mondays.',
                    'Observe Monday fasts and offer white items to Lord Shiva.',
                ],
            },
            Mercury: {
                career: [
                    'Chant "Om Budhaya Namah" 108 times on Wednesdays.',
                    'Wear green clothes and offer green items on Wednesdays.',
                ],
            },
        };
        if (mahaRituals[mahadashaLord] && mahaRituals[mahadashaLord][category]) {
            rituals.push(...mahaRituals[mahadashaLord][category]);
        }
        return rituals;
    }
    getPlanetaryGuidance(planets, category) {
        const whatToManifest = [];
        const whatNotToManifest = [];
        const categoryPlanets = {
            career: ['Sun', 'Mercury', 'Jupiter'],
            love: ['Venus', 'Moon', 'Jupiter'],
            wealth: ['Jupiter', 'Venus'],
            health: ['Sun', 'Moon', 'Mars'],
        };
        const relevantPlanets = categoryPlanets[category] || [];
        planets.forEach((planet) => {
            if (relevantPlanets.includes(planet.planet_name)) {
                if (planet.house_number <= 6) {
                    whatToManifest.push(`Focus on ${planet.planet_name}'s energy in ${planet.house_number}th house for ${category} growth.`);
                }
                if (planet.is_retrograde) {
                    whatNotToManifest.push(`Avoid hasty decisions during ${planet.planet_name} retrograde period.`);
                }
            }
        });
        return { whatToManifest, whatNotToManifest };
    }
    getKarmicTheme(houses, category) {
        const categoryHouses = {
            career: [10, 6, 1],
            love: [7, 5, 4],
            wealth: [2, 11, 9],
            health: [6, 1, 8],
        };
        const relevantHouses = categoryHouses[category] || [];
        const houseData = houses.filter((h) => relevantHouses.includes(h.house_number));
        if (houseData.length > 0) {
            const signs = houseData.map((h) => h.sign_name).join(', ');
            return `Your karmic theme for ${category} is influenced by ${signs} energy in key houses. Focus on balancing these energies.`;
        }
        return null;
    }
    getDashaAlignmentTips(mahadashaLord, category) {
        const tips = [];
        const alignmentGuidance = {
            Jupiter: {
                career: [
                    'Align your thoughts with expansion and growth. Jupiter supports learning and teaching.',
                    'Focus on long-term goals and ethical practices.',
                ],
                wealth: [
                    'Think abundantly. Jupiter brings prosperity through wisdom and generosity.',
                ],
            },
            Venus: {
                love: [
                    'Align with harmony and beauty. Venus supports relationships and artistic pursuits.',
                ],
                career: [
                    'Focus on creative and diplomatic approaches. Venus supports partnerships.',
                ],
            },
            Sun: {
                career: [
                    'Align with leadership and authority. Sun supports confidence and recognition.',
                ],
            },
        };
        if (alignmentGuidance[mahadashaLord] && alignmentGuidance[mahadashaLord][category]) {
            tips.push(...alignmentGuidance[mahadashaLord][category]);
        }
        return tips;
    }
    getDailyActions(planets, mahadashaLord, category) {
        const actions = [];
        const categoryPlanetMap = {
            career: 'Sun',
            love: 'Venus',
            wealth: 'Jupiter',
            health: 'Mars',
        };
        const relevantPlanetName = categoryPlanetMap[category] || 'Jupiter';
        const relevantPlanet = planets.find((p) => p.planet_name === relevantPlanetName);
        if (relevantPlanet) {
            actions.push(`Meditate on ${relevantPlanet.planet_name}'s energy in ${relevantPlanet.house_number}th house daily.`);
            if (relevantPlanet.is_retrograde) {
                actions.push(`During ${relevantPlanet.planet_name} retrograde, focus on review and reflection rather than new initiatives.`);
            }
        }
        if (mahadashaLord) {
            actions.push(`Align your daily actions with ${mahadashaLord} Mahadasha energy for better results.`);
        }
        return actions;
    }
    generateAstroInsights(kundli, planets, houses, mahadasha, antardasha, category) {
        const insights = [];
        if (mahadasha && antardasha) {
            insights.push(`Current Dasha: ${mahadasha.lord} Mahadasha with ${antardasha.lord} Antardasha.`);
        }
        if (kundli.nakshatra) {
            insights.push(`Your birth Nakshatra is ${kundli.nakshatra}, which influences your approach to ${category}.`);
        }
        if (kundli.lagna_name) {
            insights.push(`Your Ascendant (Lagna) is ${kundli.lagna_name}, indicating your natural approach to ${category} matters.`);
        }
        const categoryPlanets = {
            career: ['Sun', 'Mercury', 'Jupiter'],
            love: ['Venus', 'Moon'],
            wealth: ['Jupiter', 'Venus'],
        };
        const relevantPlanets = categoryPlanets[category] || [];
        const userPlanets = planets.filter((p) => relevantPlanets.includes(p.planet_name));
        if (userPlanets.length > 0) {
            const planetInfo = userPlanets.map((p) => `${p.planet_name} in ${p.house_number}th house`).join(', ');
            insights.push(`Key planetary influences: ${planetInfo}.`);
        }
        return insights.join(' ') || 'Astrological analysis based on your birth chart supports this manifestation.';
    }
    async getResonanceScoreBreakdown(manifestationId, userId) {
        const manifestation = await this.getManifestationById(manifestationId, userId);
        const clarityScore = manifestation.coherence_score
            ? Number(manifestation.coherence_score)
            : Math.round((manifestation.resonance_score || 0) * 1.1);
        const emotionalCoherence = manifestation.alignment_score
            ? Number(manifestation.alignment_score)
            : Math.round((manifestation.resonance_score || 0) * 0.9);
        const karmaInfluence = manifestation.mahaadha_score
            ? Math.round(100 - Number(manifestation.mahaadha_score))
            : 50;
        const astrologicalSupport = manifestation.astro_support_index
            ? Number(manifestation.astro_support_index)
            : 50;
        const overallScore = manifestation.resonance_score
            ? Number(manifestation.resonance_score)
            : 0;
        let insight = '';
        if (overallScore >= 70) {
            insight = 'Your intention is strongly aligned. Maintain emotional consistency to optimize outcomes.';
        }
        else if (overallScore >= 50) {
            insight = 'Your intention is moderately aligned. Emotional consistency can improve outcomes.';
        }
        else {
            insight = 'Your intention needs more clarity. Focus on aligning your thoughts and emotions.';
        }
        return {
            overall_score: Math.round(overallScore),
            clarity_score: Math.min(100, Math.max(0, Math.round(clarityScore))),
            emotional_coherence: Math.min(100, Math.max(0, Math.round(emotionalCoherence))),
            karma_influence: Math.min(100, Math.max(0, karmaInfluence)),
            astrological_support: Math.min(100, Math.max(0, Math.round(astrologicalSupport))),
            insight,
        };
    }
    async getAlignmentActions(manifestationId, userId) {
        const manifestation = await this.getManifestationById(manifestationId, userId);
        const category = manifestation.category || 'general';
        const actions = this.generateAlignmentActions(category, manifestation.tips);
        return { actions };
    }
    generateAlignmentActions(category, tips) {
        const baseActions = [
            {
                id: 1,
                title: 'Gratitude Practice',
                description: 'Write down three things you are grateful for daily.',
                icon: 'lotus',
                effort_level: 'Low',
                karma_score: 5,
                category: 'mindfulness',
            },
            {
                id: 2,
                title: 'Emotional Regulation Suggestion',
                description: 'Practice deep breathing for 5 mins when stressed.',
                icon: 'meditation',
                effort_level: 'Low',
                karma_score: 7,
                category: 'wellness',
            },
            {
                id: 3,
                title: 'Simple Ritual',
                description: 'Light a candle and set your intention each morning.',
                icon: 'candle',
                effort_level: 'Medium',
                karma_score: 10,
                category: 'ritual',
            },
            {
                id: 4,
                title: 'Behavioral Adjustment',
                description: 'Avoid negative talk and gossip for the next 48 hours.',
                icon: 'prayer',
                effort_level: 'Medium',
                karma_score: 15,
                category: 'behavior',
            },
        ];
        const categoryActions = {
            career: [
                {
                    id: 5,
                    title: 'Professional Visualization',
                    description: 'Spend 10 minutes visualizing your ideal career outcome.',
                    icon: 'briefcase',
                    effort_level: 'Low',
                    karma_score: 8,
                    category: 'visualization',
                },
                {
                    id: 6,
                    title: 'Skill Development',
                    description: 'Dedicate 30 minutes daily to learning a new skill.',
                    icon: 'book',
                    effort_level: 'Medium',
                    karma_score: 12,
                    category: 'growth',
                },
            ],
            relationship: [
                {
                    id: 5,
                    title: 'Heart Opening Practice',
                    description: 'Practice loving-kindness meditation for 10 minutes.',
                    icon: 'heart',
                    effort_level: 'Low',
                    karma_score: 8,
                    category: 'meditation',
                },
                {
                    id: 6,
                    title: 'Connection Ritual',
                    description: 'Express genuine appreciation to someone you care about.',
                    icon: 'connection',
                    effort_level: 'Low',
                    karma_score: 10,
                    category: 'relationship',
                },
            ],
            love: [
                {
                    id: 5,
                    title: 'Self-Love Practice',
                    description: 'Practice self-compassion affirmations in the mirror.',
                    icon: 'heart',
                    effort_level: 'Low',
                    karma_score: 8,
                    category: 'self-care',
                },
                {
                    id: 6,
                    title: 'Venus Ritual',
                    description: 'Wear white on Fridays and offer white flowers.',
                    icon: 'flower',
                    effort_level: 'Medium',
                    karma_score: 12,
                    category: 'ritual',
                },
            ],
            wealth: [
                {
                    id: 5,
                    title: 'Abundance Affirmation',
                    description: 'Recite abundance affirmations for 5 minutes daily.',
                    icon: 'coin',
                    effort_level: 'Low',
                    karma_score: 7,
                    category: 'affirmation',
                },
                {
                    id: 6,
                    title: 'Generosity Practice',
                    description: 'Donate a small amount to charity this week.',
                    icon: 'giving',
                    effort_level: 'Medium',
                    karma_score: 15,
                    category: 'charity',
                },
            ],
            money: [
                {
                    id: 5,
                    title: 'Financial Clarity',
                    description: 'Review and organize your finances for 15 minutes.',
                    icon: 'calculator',
                    effort_level: 'Medium',
                    karma_score: 10,
                    category: 'planning',
                },
                {
                    id: 6,
                    title: 'Jupiter Mantra',
                    description: 'Chant "Om Gurave Namah" 108 times on Thursdays.',
                    icon: 'om',
                    effort_level: 'Medium',
                    karma_score: 12,
                    category: 'mantra',
                },
            ],
            health: [
                {
                    id: 5,
                    title: 'Morning Movement',
                    description: 'Practice 15 minutes of gentle yoga or stretching.',
                    icon: 'yoga',
                    effort_level: 'Low',
                    karma_score: 8,
                    category: 'exercise',
                },
                {
                    id: 6,
                    title: 'Mindful Eating',
                    description: 'Eat one meal mindfully without distractions.',
                    icon: 'food',
                    effort_level: 'Low',
                    karma_score: 7,
                    category: 'nutrition',
                },
            ],
            spiritual: [
                {
                    id: 5,
                    title: 'Meditation Practice',
                    description: 'Meditate for 20 minutes focusing on your intention.',
                    icon: 'meditation',
                    effort_level: 'Medium',
                    karma_score: 12,
                    category: 'meditation',
                },
                {
                    id: 6,
                    title: 'Sacred Reading',
                    description: 'Read spiritual texts for 15 minutes daily.',
                    icon: 'book',
                    effort_level: 'Low',
                    karma_score: 8,
                    category: 'study',
                },
            ],
        };
        const categorySpecific = categoryActions[category.toLowerCase()] || [];
        return [...baseActions, ...categorySpecific];
    }
    async addAlignmentActionsToKarma(manifestationId, actionIds, userId) {
        const manifestation = await this.getManifestationById(manifestationId, userId);
        const category = manifestation.category || 'general';
        const allActions = this.generateAlignmentActions(category, manifestation.tips);
        const selectedActions = allActions.filter((action) => actionIds.includes(action.id));
        const totalKarmaScore = selectedActions.reduce((sum, action) => sum + action.karma_score, 0);
        const currentProgress = manifestation.progress_tracking || {
            current_progress: 0,
            journal_entries_count: 0,
        };
        const alignmentActions = currentProgress.alignment_actions || [];
        const newActions = selectedActions.map((action) => ({
            ...action,
            added_at: new Date().toISOString(),
            manifestation_id: manifestationId,
        }));
        manifestation.progress_tracking = {
            ...currentProgress,
            alignment_actions: [...alignmentActions, ...newActions],
            total_alignment_karma: (currentProgress.total_alignment_karma || 0) + totalKarmaScore,
        };
        await this.manifestationRepository.save(manifestation);
        return {
            added_count: selectedActions.length,
            total_karma_score: totalKarmaScore,
            actions_added: selectedActions.map((a) => ({
                id: a.id,
                title: a.title,
                karma_score: a.karma_score,
            })),
        };
    }
    async commitIntention(manifestationId, userId, commitmentMessage, targetDate) {
        const manifestation = await this.getManifestationById(manifestationId, userId);
        manifestation.is_locked = true;
        const currentProgress = manifestation.progress_tracking || {
            current_progress: 0,
            journal_entries_count: 0,
        };
        const committedAt = new Date().toISOString();
        const commitMessage = commitmentMessage || 'I choose to commit consciously.';
        manifestation.progress_tracking = {
            ...currentProgress,
            is_committed: true,
            committed_at: committedAt,
            commitment_message: commitMessage,
        };
        if (targetDate) {
            manifestation.target_date = new Date(targetDate);
        }
        await this.manifestationRepository.save(manifestation);
        return {
            id: manifestation.id,
            title: manifestation.title,
            is_committed: true,
            committed_at: committedAt,
            commitment_message: commitMessage,
            target_date: manifestation.target_date
                ? manifestation.target_date.toISOString().split('T')[0]
                : null,
        };
    }
    async getCosmicSupportIndex(manifestationId, userId) {
        const manifestation = await this.getManifestationById(manifestationId, userId);
        const category = manifestation.category || 'general';
        const kundli = await this.kundliRepository.findOne({
            where: { user_id: userId, is_deleted: false },
        });
        const currentDate = new Date();
        let dashaData = null;
        if (kundli && kundli.nakshatra) {
            const birthDate = kundli.birth_date instanceof Date
                ? kundli.birth_date
                : new Date(kundli.birth_date);
            dashaData = this.calculateDashaFromBirthDateAndNakshatra(birthDate, kundli.nakshatra, currentDate);
        }
        const calculateStatus = (lord) => {
            if (!lord)
                return 'Neutral';
            const categoryPlanets = {
                career: {
                    supportive: ['Mercury', 'Jupiter', 'Sun'],
                    challenging: ['Saturn', 'Rahu', 'Ketu'],
                },
                relationship: {
                    supportive: ['Venus', 'Jupiter', 'Moon'],
                    challenging: ['Saturn', 'Rahu', 'Mars'],
                },
                love: {
                    supportive: ['Venus', 'Jupiter', 'Moon'],
                    challenging: ['Saturn', 'Mars', 'Rahu'],
                },
                wealth: {
                    supportive: ['Jupiter', 'Venus', 'Mercury'],
                    challenging: ['Saturn', 'Rahu', 'Ketu'],
                },
                money: {
                    supportive: ['Jupiter', 'Venus', 'Mercury'],
                    challenging: ['Saturn', 'Rahu', 'Ketu'],
                },
                health: {
                    supportive: ['Sun', 'Moon', 'Mars'],
                    challenging: ['Saturn', 'Rahu', 'Ketu'],
                },
                spiritual: {
                    supportive: ['Jupiter', 'Ketu', 'Saturn'],
                    challenging: ['Mars', 'Rahu'],
                },
            };
            const alignment = categoryPlanets[category.toLowerCase()] || categoryPlanets.career;
            if (alignment.supportive.includes(lord))
                return 'Supportive';
            if (alignment.challenging.includes(lord))
                return 'Challenging';
            return 'Neutral';
        };
        const getDescription = (lord, status) => {
            if (!lord)
                return 'Unable to determine current period.';
            const descriptions = {
                Jupiter: {
                    Supportive: 'Jupiter period enhances growth and opportunity. Favorable for new ventures.',
                    Neutral: 'Jupiter brings moderate support. Focus on learning and expansion.',
                    Challenging: 'Jupiter period may bring over-expansion. Stay grounded.',
                },
                Saturn: {
                    Supportive: 'Saturn supports discipline and structure. Good for long-term goals.',
                    Neutral: 'Saturn period requires patience. Progress is slow but steady.',
                    Challenging: 'Saturn period may bring delays. Patience and perseverance required.',
                },
                Venus: {
                    Supportive: 'Venus period enhances relationships and creativity. Favorable for manifestation.',
                    Neutral: 'Venus brings harmony. Focus on balance and beauty.',
                    Challenging: 'Venus period may bring indulgence. Practice moderation.',
                },
                Mars: {
                    Supportive: 'Mars period brings energy and action. Great for initiative.',
                    Neutral: 'Mars brings drive. Channel energy constructively.',
                    Challenging: 'Mars period may bring impatience or conflict. Stay grounded.',
                },
                Mercury: {
                    Supportive: 'Mercury period enhances communication and intellect. Great for learning.',
                    Neutral: 'Mercury brings mental activity. Stay focused.',
                    Challenging: 'Mercury period may bring restlessness. Practice stillness.',
                },
                Moon: {
                    Supportive: 'Moon period enhances intuition and emotional alignment.',
                    Neutral: 'Moon brings emotional awareness. Honor your feelings.',
                    Challenging: 'Moon period may bring emotional fluctuations. Practice stability.',
                },
                Sun: {
                    Supportive: 'Sun period enhances leadership and confidence. Shine bright.',
                    Neutral: 'Sun brings vitality. Focus on self-expression.',
                    Challenging: 'Sun period may bring ego challenges. Practice humility.',
                },
                Rahu: {
                    Supportive: 'Rahu period brings unconventional opportunities. Stay discerning.',
                    Neutral: 'Rahu brings transformation. Embrace change mindfully.',
                    Challenging: 'Rahu period may bring confusion or illusion. Seek clarity.',
                },
                Ketu: {
                    Supportive: 'Ketu period enhances spiritual growth and detachment.',
                    Neutral: 'Ketu brings introspection. Look within.',
                    Challenging: 'Ketu period may bring isolation or loss. Practice acceptance.',
                },
            };
            return descriptions[lord]?.[status] || `${lord} period influences your manifestation journey.`;
        };
        const mahadashaLord = dashaData?.mahadasha?.lord || 'Unknown';
        const antardashaLord = dashaData?.antardasha?.lord || 'Unknown';
        const pratyantarLord = dashaData?.pratyantar?.lord || 'Unknown';
        const mahadashaStatus = calculateStatus(mahadashaLord);
        const antardashaStatus = calculateStatus(antardashaLord);
        const pratyantarStatus = calculateStatus(pratyantarLord);
        let guidanceMessage = 'This guidance helps with timing, not fate.';
        if (mahadashaStatus === 'Supportive' && antardashaStatus === 'Supportive') {
            guidanceMessage = 'Excellent cosmic support! This is an auspicious time for your manifestation.';
        }
        else if (mahadashaStatus === 'Challenging' || antardashaStatus === 'Challenging') {
            guidanceMessage = 'Current cosmic energies suggest patience. Focus on inner alignment and preparation.';
        }
        else {
            guidanceMessage = 'Moderate cosmic support. Stay consistent with your alignment practices.';
        }
        return {
            current_mahadasha: {
                lord: mahadashaLord,
                description: getDescription(mahadashaLord, mahadashaStatus),
                status: mahadashaStatus,
            },
            current_antardasha: {
                lord: antardashaLord,
                description: getDescription(antardashaLord, antardashaStatus),
                status: antardashaStatus,
            },
            current_pratyantar: {
                lord: pratyantarLord,
                description: getDescription(pratyantarLord, pratyantarStatus),
                status: pratyantarStatus,
            },
            guidance_message: guidanceMessage,
        };
    }
    async getAlignmentSummary(manifestationId, userId) {
        const manifestation = await this.getManifestationById(manifestationId, userId);
        const cosmicSupport = await this.getCosmicSupportIndex(manifestationId, userId);
        const resonanceScore = manifestation.resonance_score
            ? Number(manifestation.resonance_score)
            : 0;
        let resonanceLabel = 'Low Alignment';
        if (resonanceScore >= 70) {
            resonanceLabel = 'Highly Aligned';
        }
        else if (resonanceScore >= 50) {
            resonanceLabel = 'Moderately Aligned';
        }
        else if (resonanceScore >= 30) {
            resonanceLabel = 'Partially Aligned';
        }
        const today = new Date();
        const periodEnd = new Date(today);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        const cosmicSupportPeriod = `${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        const progressTracking = manifestation.progress_tracking || {
            current_progress: 0,
            journal_entries_count: 0,
        };
        const commitmentStatus = progressTracking.is_committed
            ? 'Consciously Committed'
            : 'Not Committed';
        const alignmentActions = progressTracking.alignment_actions || [];
        const activeActions = alignmentActions.slice(-4).map((action) => ({
            id: action.id,
            title: action.title,
            icon: action.icon,
            karma_score: action.karma_score,
        }));
        return {
            manifestation_title: manifestation.title,
            resonance_score: Math.round(resonanceScore),
            resonance_label: resonanceLabel,
            cosmic_support_status: cosmicSupport.current_mahadasha.status,
            cosmic_support_period: cosmicSupportPeriod,
            commitment_status: commitmentStatus,
            active_alignment_actions: activeActions,
        };
    }
    async getJourneyTimeline(manifestationId, userId) {
        const manifestation = await this.getManifestationById(manifestationId, userId);
        const progressTracking = manifestation.progress_tracking || {};
        const createdDate = manifestation.added_date || new Date();
        const targetDate = manifestation.target_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        const totalDays = Math.ceil((targetDate.getTime() - new Date(createdDate).getTime()) / (24 * 60 * 60 * 1000));
        const elapsedDays = Math.ceil((Date.now() - new Date(createdDate).getTime()) / (24 * 60 * 60 * 1000));
        const totalProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
        const phases = this.generateJourneyPhases(createdDate, targetDate);
        const currentPhaseIndex = phases.findIndex((p) => p.status === 'In Progress');
        const currentPhase = phases[currentPhaseIndex] || phases[0];
        const resonanceScore = manifestation.resonance_score
            ? Number(manifestation.resonance_score)
            : 0;
        let insight = 'Continue your alignment practices.';
        if (currentPhase.id === 'intention_locked') {
            insight = 'Your intention is set. Focus on emotional alignment.';
        }
        else if (currentPhase.id === 'karma_action') {
            insight = 'Complete your daily karma actions for best results.';
        }
        else if (currentPhase.id === 'karma_consistency') {
            insight = 'Maintain daily gratitude to align your emotions.';
        }
        else if (currentPhase.id === 'astrological_support') {
            insight = 'Favorable cosmic window for decision making.';
        }
        return {
            total_progress: totalProgress,
            phases,
            current_phase: {
                id: currentPhase.id,
                title: currentPhase.title,
                insight,
                resonance_score: Math.round(resonanceScore),
            },
        };
    }
    generateJourneyPhases(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        const phaseDuration = Math.ceil(totalDays / 5);
        const phases = [
            {
                id: 'intention_locked',
                title: 'Intention Locked',
                description: 'Your manifestation intention has been set.',
            },
            {
                id: 'karma_action',
                title: 'Karma Action Phase',
                description: 'Complete your daily karma actions.',
            },
            {
                id: 'karma_consistency',
                title: 'Karma Consistency Check',
                description: 'Maintain consistency in your practices.',
            },
            {
                id: 'astrological_support',
                title: 'Astrological Support Phase',
                description: 'Favorable cosmic window for decision making.',
            },
            {
                id: 'manifestation_window',
                title: 'Manifestation Window',
                description: 'Peak alignment period for manifestation.',
            },
        ];
        return phases.map((phase, index) => {
            const phaseStart = new Date(start);
            phaseStart.setDate(phaseStart.getDate() + index * phaseDuration);
            const phaseEnd = new Date(phaseStart);
            phaseEnd.setDate(phaseEnd.getDate() + phaseDuration);
            let status = 'Upcoming';
            let progressPercentage;
            if (now >= phaseEnd) {
                status = 'Completed';
            }
            else if (now >= phaseStart && now < phaseEnd) {
                status = 'In Progress';
                const phaseElapsed = now.getTime() - phaseStart.getTime();
                const phaseDurationMs = phaseEnd.getTime() - phaseStart.getTime();
                progressPercentage = Math.round((phaseElapsed / phaseDurationMs) * 100);
            }
            return {
                id: phase.id,
                title: phase.title,
                description: phase.description,
                date_range: `${phaseStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${phaseEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
                status,
                progress_percentage: progressPercentage,
            };
        });
    }
};
exports.ManifestationEnhancedService = ManifestationEnhancedService;
exports.ManifestationEnhancedService = ManifestationEnhancedService = ManifestationEnhancedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(manifestation_entity_1.Manifestation)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(3, (0, typeorm_1.InjectRepository)(dasha_record_entity_1.DashaRecord)),
    __param(4, (0, typeorm_1.InjectRepository)(antardasha_record_entity_1.AntardashaRecord)),
    __param(5, (0, typeorm_1.InjectRepository)(pratyantar_dasha_record_entity_1.PratyantarDashaRecord)),
    __param(6, (0, typeorm_1.InjectRepository)(sukshma_dasha_record_entity_1.SukshmaDashaRecord)),
    __param(7, (0, typeorm_1.InjectRepository)(kundli_entity_1.Kundli)),
    __param(8, (0, typeorm_1.InjectRepository)(kundli_planet_entity_1.KundliPlanet)),
    __param(9, (0, typeorm_1.InjectRepository)(kundli_house_entity_1.KundliHouse)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        manifestation_ai_evaluation_service_1.ManifestationAIEvaluationService,
        swiss_ephemeris_service_1.SwissEphemerisService,
        kundli_service_1.KundliService])
], ManifestationEnhancedService);
//# sourceMappingURL=manifestation-enhanced.service.js.map