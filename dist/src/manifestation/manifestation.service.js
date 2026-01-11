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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const manifestation_log_entity_1 = require("./entities/manifestation-log.entity");
const swiss_ephemeris_service_1 = require("../astrology/services/swiss-ephemeris.service");
const user_entity_1 = require("../users/entities/user.entity");
const constants_service_1 = require("../common/constants/constants.service");
let ManifestationService = class ManifestationService {
    constructor(manifestationRepository, userRepository, swissEphemerisService, constantsService) {
        this.manifestationRepository = manifestationRepository;
        this.userRepository = userRepository;
        this.swissEphemerisService = swissEphemerisService;
        this.constantsService = constantsService;
    }
    async createManifestation(userId, dto) {
        if (!dto.title || dto.title.trim().length === 0) {
            throw new common_1.BadRequestException('Manifestation title is required');
        }
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        const clarity = await this.calculateClarity(dto.title);
        const coherence = await this.calculateCoherence(dto.title);
        const mfpScore = (clarity + coherence) / 2;
        const astroIndex = await this.calculateAstroIndex(user, dto.title);
        const bestManifestationDate = await this.calculateBestManifestationDate(user, astroIndex);
        const manifestation = this.manifestationRepository.create({
            user_id: userId,
            desire_text: dto.title,
            emotional_coherence: coherence,
            linguistic_clarity: clarity,
            astrological_resonance: astroIndex,
            manifestation_probability: mfpScore,
            best_manifestation_date: bestManifestationDate,
            analysis_data: {
                clarity_breakdown: this.getClarityBreakdown(dto.title),
                coherence_breakdown: this.getCoherenceBreakdown(dto.title),
                astro_support: this.getAstroSupport(astroIndex),
            },
            metadata: dto.metadata || {},
        });
        return await this.manifestationRepository.save(manifestation);
    }
    async getUserManifestations(userId) {
        return this.manifestationRepository.find({
            where: {
                user_id: userId,
                is_deleted: false,
            },
            order: {
                added_date: 'DESC',
            },
        });
    }
    async getManifestationById(userId, manifestationId) {
        const manifestation = await this.manifestationRepository.findOne({
            where: {
                id: manifestationId,
                user_id: userId,
                is_deleted: false,
            },
        });
        if (!manifestation) {
            throw new common_1.NotFoundException('Manifestation not found');
        }
        return manifestation;
    }
    async updateManifestation(userId, manifestationId, updateData) {
        const manifestation = await this.getManifestationById(userId, manifestationId);
        if (updateData.is_locked !== undefined) {
            manifestation.metadata = {
                ...manifestation.metadata,
                is_locked: updateData.is_locked,
            };
        }
        if (updateData.metadata) {
            manifestation.metadata = {
                ...manifestation.metadata,
                ...updateData.metadata,
            };
        }
        return await this.manifestationRepository.save(manifestation);
    }
    async deleteManifestation(userId, manifestationId) {
        const manifestation = await this.getManifestationById(userId, manifestationId);
        manifestation.is_deleted = true;
        await this.manifestationRepository.save(manifestation);
    }
    async calculateClarity(text) {
        const words = text.split(/\s+/).length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        const avgWordsPerSentence = words / Math.max(sentences, 1);
        let clarity = 70;
        if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
            clarity += 15;
        }
        else if (avgWordsPerSentence < 5 || avgWordsPerSentence > 30) {
            clarity -= 20;
        }
        const specificIndicators = await this.constantsService.getSpecificIndicators();
        const hasSpecificLanguage = specificIndicators.some(indicator => text.toLowerCase().includes(indicator.toLowerCase()));
        if (hasSpecificLanguage) {
            clarity += 10;
        }
        const vagueWords = await this.constantsService.getVagueWords();
        const hasVagueLanguage = vagueWords.some(word => text.toLowerCase().includes(word.toLowerCase()));
        if (hasVagueLanguage) {
            clarity -= 15;
        }
        return Math.max(0, Math.min(100, clarity));
    }
    async calculateCoherence(text) {
        const lowerText = text.toLowerCase();
        let coherence = 60;
        const positiveWords = await this.constantsService.getPositiveManifestationWords();
        const negativeWords = await this.constantsService.getNegativeManifestationWords();
        const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
        coherence += positiveCount * 5;
        const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
        coherence -= negativeCount * 10;
        if (lowerText.includes('i am') || lowerText.includes('i will')) {
            coherence += 10;
        }
        if (lowerText.includes('i hope') || lowerText.includes('i wish') || lowerText.includes('if only')) {
            coherence -= 10;
        }
        return Math.max(0, Math.min(100, coherence));
    }
    async calculateAstroIndex(user, desireText) {
        if (!user) {
            return 0.5;
        }
        try {
            const birthDate = user.date_of_birth || user.birth_date;
            const latitude = user.latitude;
            const longitude = user.longitude;
            if (!birthDate || !latitude || !longitude) {
                return 0.5;
            }
            const now = new Date();
            const currentKundli = await this.swissEphemerisService.calculateKundli({
                datetime: now,
                latitude: latitude,
                longitude: longitude,
                timezone: user.timezone || 'Asia/Kolkata',
            });
            const jupiter = currentKundli.planets.find(p => p.name === 'Jupiter');
            const venus = currentKundli.planets.find(p => p.name === 'Venus');
            const moon = currentKundli.planets.find(p => p.name === 'Moon');
            let astroScore = 0.5;
            if (jupiter) {
                const beneficialSigns = ['Sagittarius', 'Pisces', 'Cancer'];
                if (beneficialSigns.includes(jupiter.sign)) {
                    astroScore += 0.15;
                }
                else if (!jupiter.isRetrograde) {
                    astroScore += 0.08;
                }
            }
            if (venus) {
                const beneficialSigns = ['Taurus', 'Libra', 'Pisces'];
                if (beneficialSigns.includes(venus.sign)) {
                    astroScore += 0.12;
                }
                else if (!venus.isRetrograde) {
                    astroScore += 0.06;
                }
            }
            if (moon) {
                const moonPhase = (moon.longitude % 360) / 360;
                if (moonPhase >= 0 && moonPhase <= 0.5) {
                    astroScore += 0.1;
                }
                if (moonPhase >= 0.45 && moonPhase <= 0.55) {
                    astroScore += 0.05;
                }
            }
            return Math.max(0, Math.min(1, astroScore));
        }
        catch (error) {
            return 0.5;
        }
    }
    async calculateBestManifestationDate(user, astroIndex) {
        if (astroIndex > 0.6) {
            const bestDate = new Date();
            bestDate.setDate(bestDate.getDate() + 30);
            return bestDate;
        }
        return null;
    }
    getClarityBreakdown(text) {
        return {
            word_count: text.split(/\s+/).length,
            sentence_count: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
            has_specific_language: true,
        };
    }
    getCoherenceBreakdown(text) {
        return {
            positive_language_score: 0.7,
            confidence_score: 0.6,
        };
    }
    getAstroSupport(astroIndex) {
        if (astroIndex >= 0.7) {
            return 'Strong astrological support for manifestation';
        }
        else if (astroIndex >= 0.5) {
            return 'Moderate astrological support';
        }
        else if (astroIndex >= 0.3) {
            return 'Weak astrological support';
        }
        else {
            return 'Limited astrological support - consider waiting for better timing';
        }
    }
};
exports.ManifestationService = ManifestationService;
exports.ManifestationService = ManifestationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(manifestation_log_entity_1.ManifestationLog)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        swiss_ephemeris_service_1.SwissEphemerisService,
        constants_service_1.ConstantsService])
], ManifestationService);
//# sourceMappingURL=manifestation.service.js.map