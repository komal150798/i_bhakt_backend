"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ManifestationAlignmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestationAlignmentService = void 0;
const common_1 = require("@nestjs/common");
let ManifestationAlignmentService = ManifestationAlignmentService_1 = class ManifestationAlignmentService {
    constructor() {
        this.logger = new common_1.Logger(ManifestationAlignmentService_1.name);
    }
    detectManifestationWeakness(text) {
        const lowerText = text.toLowerCase().trim();
        const desirePatterns = [
            /\b(i want|i hope|i wish|i desire|i need|i would like)\b/gi,
            /\b(want to|hope to|wish to|desire to)\b/gi,
        ];
        const uses_desire_language = desirePatterns.some((pattern) => pattern.test(lowerText));
        const authorityPatterns = [
            /\b(i am|i'm|i have|i lead|i serve|i create|i build)\b/gi,
            /\b(am becoming|am growing|am developing)\b/gi,
        ];
        const hasAuthority = authorityPatterns.some((pattern) => pattern.test(lowerText));
        const authority_missing = !hasAuthority;
        const futurePatterns = [
            /\b(in \d{4}|by \d{4}|someday|one day|in the future|eventually)\b/gi,
            /\b(will be|will become|will have)\b/gi,
        ];
        const time_dependency = futurePatterns.some((pattern) => pattern.test(lowerText));
        return {
            uses_desire_language,
            authority_missing,
            time_dependency,
        };
    }
    evaluateKundliSupport(manifestation, kundli, planets, houses) {
        const goalType = this.determineGoalType(manifestation);
        const profile = {
            sun_support: 'weak',
            saturn_support: 'weak',
            moon_stability: 'unstable',
            jupiter_guidance: false,
            rahu_support: 'weak',
        };
        const sunPlanet = planets.find((p) => p.planet_name.toLowerCase() === 'sun');
        const saturnPlanet = planets.find((p) => p.planet_name.toLowerCase() === 'saturn');
        const moonPlanet = planets.find((p) => p.planet_name.toLowerCase() === 'moon');
        const jupiterPlanet = planets.find((p) => p.planet_name.toLowerCase() === 'jupiter');
        const rahuPlanet = planets.find((p) => p.planet_name.toLowerCase() === 'rahu');
        if (sunPlanet) {
            profile.sun_support = this.evaluatePlanetStrength(sunPlanet, goalType === 'authority' || goalType === 'politics');
        }
        if (saturnPlanet) {
            profile.saturn_support = this.evaluatePlanetStrength(saturnPlanet, goalType === 'authority' || goalType === 'longevity');
        }
        if (moonPlanet) {
            const strongHouses = [1, 4, 7, 10];
            profile.moon_stability = strongHouses.includes(moonPlanet.house_number)
                ? 'stable'
                : 'unstable';
        }
        if (jupiterPlanet) {
            const goodHouses = [1, 2, 4, 5, 7, 9, 10, 11];
            profile.jupiter_guidance = goodHouses.includes(jupiterPlanet.house_number);
        }
        if (rahuPlanet) {
            profile.rahu_support = this.evaluatePlanetStrength(rahuPlanet, goalType === 'leadership' || goalType === 'public');
        }
        return profile;
    }
    determineGoalType(manifestation) {
        const category = manifestation.category?.toLowerCase() || '';
        const description = (manifestation.description || '').toLowerCase();
        const title = (manifestation.title || '').toLowerCase();
        const combined = `${category} ${description} ${title}`;
        if (/(pm|cm|minister|president|leader|authority|political|government)/i.test(combined)) {
            return 'authority';
        }
        if (/(lead|leadership|mass|public|people|followers)/i.test(combined)) {
            return 'leadership';
        }
        if (/(famous|popular|recognized|accepted|known)/i.test(combined)) {
            return 'public';
        }
        if (/(long|sustain|endure|lasting|permanent)/i.test(combined)) {
            return 'longevity';
        }
        return category || 'general';
    }
    evaluatePlanetStrength(planet, isRelevant) {
        if (!isRelevant) {
            return 'weak';
        }
        const strongHouses = [1, 4, 5, 7, 9, 10, 11];
        const mediumHouses = [2, 3, 6, 8];
        if (strongHouses.includes(planet.house_number)) {
            return 'strong';
        }
        else if (mediumHouses.includes(planet.house_number)) {
            return 'medium';
        }
        else {
            return 'weak';
        }
    }
    rewriteManifestationText(originalText, kundliProfile) {
        let rewritten = originalText.trim();
        rewritten = rewritten.replace(/\b(i want to|i hope to|i wish to|i desire to)\b/gi, 'i am');
        rewritten = rewritten.replace(/\b(i want|i hope|i wish)\b/gi, 'i am');
        rewritten = rewritten.replace(/\b(want to|hope to|wish to)\b/gi, 'am');
        if (kundliProfile.saturn_support === 'strong') {
            if (!/(discipline|patience|responsibility|service|duty)/i.test(rewritten)) {
                rewritten = this.addProcessWords(rewritten, 'saturn');
            }
        }
        if (kundliProfile.jupiter_guidance) {
            if (!/(service|guidance|wisdom|teaching|helping)/i.test(rewritten)) {
                rewritten = this.addProcessWords(rewritten, 'jupiter');
            }
        }
        if (kundliProfile.moon_stability === 'unstable') {
            rewritten = rewritten.replace(/\b(i feel|i feel like|feeling|emotionally)\b/gi, '');
            rewritten = rewritten.replace(/\s+/g, ' ').trim();
        }
        if (kundliProfile.sun_support === 'strong') {
            if (!/(lead|authority|responsibility|command)/i.test(rewritten)) {
                rewritten = this.addProcessWords(rewritten, 'sun');
            }
        }
        rewritten = rewritten.replace(/\b(in \d{4}|by \d{4})\b/gi, '');
        rewritten = rewritten.replace(/\b(someday|one day|eventually)\b/gi, '');
        rewritten = rewritten.replace(/\s+/g, ' ').trim();
        if (!/\b(i am|i'm|am becoming|am growing)\b/i.test(rewritten)) {
            rewritten = `I am ${rewritten.toLowerCase()}`;
            rewritten = rewritten.charAt(0).toUpperCase() + rewritten.slice(1);
        }
        return rewritten;
    }
    addProcessWords(text, planet) {
        const words = {
            saturn: ['through discipline', 'with patience', 'through responsibility'],
            jupiter: ['through service', 'with wisdom', 'by helping others'],
            sun: ['with authority', 'through leadership', 'by taking responsibility'],
        };
        const selectedWords = words[planet];
        const randomIndex = Math.floor(text.length % selectedWords.length);
        const phrase = selectedWords[randomIndex];
        const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
        if (sentences.length > 0) {
            const lastSentence = sentences[sentences.length - 1].trim();
            sentences[sentences.length - 1] = `${lastSentence} ${phrase}.`;
            return sentences.join('. ').trim();
        }
        return `${text} ${phrase}.`;
    }
    applySafeResponseUpdate(manifestation, rewrittenTitle, rewrittenDescription, kundliProfile, alignmentImprovement) {
        const updates = {};
        if (rewrittenTitle !== manifestation.title) {
            updates.title = rewrittenTitle;
        }
        if (rewrittenDescription !== manifestation.description) {
            updates.description = rewrittenDescription;
        }
        if (alignmentImprovement > 0) {
            const currentAlignment = manifestation.alignment_score || 0;
            const newAlignment = Math.min(100, Math.max(0, currentAlignment + alignmentImprovement));
            updates.alignment_score = newAlignment;
        }
        if (alignmentImprovement > 0) {
            const currentCoherence = manifestation.coherence_score || 0;
            const coherenceIncrease = Math.floor(alignmentImprovement * 0.5);
            const newCoherence = Math.min(100, Math.max(0, currentCoherence + coherenceIncrease));
            updates.coherence_score = newCoherence;
        }
        const currentTips = manifestation.tips || {};
        const newRituals = [...(currentTips.rituals || [])];
        const kundliRitual = this.generateKundliAlignedRitual(kundliProfile);
        if (kundliRitual && !newRituals.includes(kundliRitual)) {
            newRituals.push(kundliRitual);
        }
        const newThoughtAlignment = [...(currentTips.thought_alignment || [])];
        const kundliThought = this.generateKundliAlignedThought(kundliProfile);
        if (kundliThought && !newThoughtAlignment.includes(kundliThought)) {
            newThoughtAlignment.push(kundliThought);
        }
        updates.tips = {
            ...currentTips,
            rituals: newRituals,
            thought_alignment: newThoughtAlignment,
        };
        const currentInsights = manifestation.insights || {};
        const enhancedNarrative = this.enhanceNarrative(currentInsights.ai_narrative || '', kundliProfile);
        updates.insights = {
            ...currentInsights,
            ai_narrative: enhancedNarrative,
        };
        const enhancedSummary = this.generateSummaryForUI(kundliProfile, alignmentImprovement);
        updates.insights = {
            ...(updates.insights || currentInsights),
            summary_for_ui: enhancedSummary,
        };
        return updates;
    }
    generateKundliAlignedRitual(profile) {
        if (profile.saturn_support === 'strong') {
            return 'Begin each day with responsibility-based action rather than visualization alone.';
        }
        if (profile.jupiter_guidance) {
            return 'Practice service-oriented actions that align with your higher purpose.';
        }
        if (profile.sun_support === 'strong') {
            return 'Take leadership actions daily, even in small ways.';
        }
        return null;
    }
    generateKundliAlignedThought(profile) {
        if (profile.saturn_support === 'strong') {
            return 'I lead with patience, ethics, and service.';
        }
        if (profile.jupiter_guidance) {
            return 'My actions serve a higher purpose and benefit others.';
        }
        if (profile.sun_support === 'strong') {
            return 'I am growing into my natural authority through responsible action.';
        }
        return null;
    }
    enhanceNarrative(existingNarrative, profile) {
        if (!existingNarrative) {
            return '';
        }
        const enhancements = [];
        if (profile.sun_support === 'strong') {
            enhancements.push('Your Kundli shows strong Sun support for authority and leadership.');
        }
        if (profile.saturn_support === 'strong') {
            enhancements.push('Saturn indicates that success will come through discipline and long-term commitment.');
        }
        if (profile.jupiter_guidance) {
            enhancements.push('Jupiter supports your goal through service and ethical action.');
        }
        if (profile.moon_stability === 'unstable') {
            enhancements.push('Focus on consistent action rather than emotional fluctuations.');
        }
        if (enhancements.length > 0) {
            return `${existingNarrative} ${enhancements.join(' ')}`;
        }
        return existingNarrative;
    }
    generateSummaryForUI(profile, alignmentImprovement) {
        if (alignmentImprovement > 0) {
            if (profile.sun_support === 'strong' && profile.saturn_support === 'strong') {
                return 'Your goal is strongly supported by your Kundli. Success depends on disciplined long-term effort and taking responsible action.';
            }
            if (profile.jupiter_guidance) {
                return 'Your goal is supported by your Kundli, especially through service-oriented actions and ethical behavior.';
            }
            return 'Your goal is supported by your Kundli, but success depends on consistent action and alignment with your natural strengths.';
        }
        return 'Your goal requires focused effort and alignment with your Kundli strengths.';
    }
    analyzeManifestationText(manifestation, kundli, planets, houses) {
        if (!kundli || planets.length === 0) {
            return {
                shouldRewrite: false,
                alignmentImprovement: 0,
            };
        }
        const weakness = this.detectManifestationWeakness(manifestation.description || manifestation.title);
        if (!weakness.uses_desire_language &&
            !weakness.authority_missing &&
            !weakness.time_dependency) {
            return {
                shouldRewrite: false,
                alignmentImprovement: 0,
            };
        }
        const kundliProfile = this.evaluateKundliSupport(manifestation, kundli, planets, houses);
        const rewrittenTitle = this.rewriteManifestationText(manifestation.title, kundliProfile);
        const rewrittenDescription = this.rewriteManifestationText(manifestation.description, kundliProfile);
        let alignmentImprovement = 0;
        if (weakness.uses_desire_language)
            alignmentImprovement += 5;
        if (weakness.authority_missing)
            alignmentImprovement += 5;
        if (weakness.time_dependency)
            alignmentImprovement += 3;
        if (kundliProfile.sun_support === 'strong')
            alignmentImprovement += 5;
        if (kundliProfile.saturn_support === 'strong')
            alignmentImprovement += 5;
        if (kundliProfile.jupiter_guidance)
            alignmentImprovement += 3;
        if (kundliProfile.moon_stability === 'stable')
            alignmentImprovement += 2;
        alignmentImprovement = Math.min(20, alignmentImprovement);
        return {
            shouldRewrite: true,
            rewrittenTitle,
            rewrittenDescription,
            alignmentImprovement,
            kundliProfile,
        };
    }
};
exports.ManifestationAlignmentService = ManifestationAlignmentService;
exports.ManifestationAlignmentService = ManifestationAlignmentService = ManifestationAlignmentService_1 = __decorate([
    (0, common_1.Injectable)()
], ManifestationAlignmentService);
//# sourceMappingURL=manifestation-alignment.service.js.map