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
var ManifestationAIEvaluationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestationAIEvaluationService = void 0;
const common_1 = require("@nestjs/common");
const manifestation_llm_analyzer_service_1 = require("./manifestation-llm-analyzer.service");
const manifestation_backend_config_service_1 = require("./manifestation-backend-config.service");
const constants_service_1 = require("../../common/constants/constants.service");
let ManifestationAIEvaluationService = ManifestationAIEvaluationService_1 = class ManifestationAIEvaluationService {
    constructor(llmAnalyzer, backendConfigService, constantsService) {
        this.llmAnalyzer = llmAnalyzer;
        this.backendConfigService = backendConfigService;
        this.constantsService = constantsService;
        this.logger = new common_1.Logger(ManifestationAIEvaluationService_1.name);
    }
    async getPositiveKeywords() {
        return this.constantsService.getPositiveKeywords();
    }
    async getNegativeKeywords() {
        return this.constantsService.getNegativeKeywords();
    }
    async getCategoryPlanets() {
        return this.constantsService.getCategoryPlanets();
    }
    detectCategoryWithBackendConfig(title, description, backendConfig) {
        const text = `${title} ${description}`.toLowerCase();
        const scores = {};
        for (const [cat, keywords] of Object.entries(backendConfig.category_keywords)) {
            scores[cat] = keywords.filter((kw) => text.includes(kw.toLowerCase())).length;
        }
        const scoreEntries = Object.entries(scores);
        if (scoreEntries.length === 0) {
            return undefined;
        }
        const maxCategory = scoreEntries.reduce((a, b) => (scores[a[0]] > scores[b[0]] ? a : b))[0];
        if (scores[maxCategory] >= 2) {
            return maxCategory;
        }
        return undefined;
    }
    async detectCategory(title, description) {
        const combinedText = `${title} ${description}`.toLowerCase();
        const categoryScores = {};
        const backendConfig = await this.backendConfigService.getBackendConfig();
        const categoryKeywords = backendConfig.category_keywords || {};
        for (const category of Object.keys(categoryKeywords)) {
            categoryScores[category] = 0;
        }
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            const keywordArray = keywords;
            for (const keyword of keywordArray) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = combinedText.match(regex);
                if (matches) {
                    categoryScores[category] = (categoryScores[category] || 0) + matches.length;
                }
            }
        }
        let maxScore = 0;
        let detectedCategory = undefined;
        for (const [category, score] of Object.entries(categoryScores)) {
            if (score > maxScore) {
                maxScore = score;
                detectedCategory = category;
            }
        }
        return maxScore >= 2 ? detectedCategory : undefined;
    }
    async evaluateManifestation(title, description, category, user) {
        try {
            const backendConfig = await this.backendConfigService.getBackendConfig();
            const llmAnalysis = await this.llmAnalyzer.analyzeManifestation(title, description, backendConfig, category);
            const finalCategory = llmAnalysis.detected_category || category || 'other';
            const baseScores = llmAnalysis.scores || {
                resonance_score: 50,
                alignment_score: 50,
                antrashaakti_score: 50,
                mahaadha_score: 0,
                astro_support_index: 60,
                mfp_score: 50,
            };
            const baseCoherence = (baseScores.resonance_score + baseScores.alignment_score) / 2;
            const clarityBonus = description.length > 50 ? 5 : 0;
            const confidenceBonus = baseScores.antrashaakti_score > 60 ? 5 : 0;
            const blockagePenalty = baseScores.mahaadha_score > 30 ? -10 : 0;
            const coherence_score = Math.max(0, Math.min(100, baseCoherence + clarityBonus + confidenceBonus + blockagePenalty));
            const scores = {
                resonance_score: baseScores.resonance_score,
                alignment_score: baseScores.alignment_score,
                antrashaakti_score: baseScores.antrashaakti_score,
                mahaadha_score: baseScores.mahaadha_score,
                astro_support_index: baseScores.astro_support_index,
                mfp_score: baseScores.mfp_score,
                coherence_score: Math.round(coherence_score),
            };
            const tips = {
                rituals: llmAnalysis.suggested_rituals || [],
                what_to_manifest: llmAnalysis.what_to_manifest || [],
                what_not_to_manifest: llmAnalysis.what_not_to_manifest || [],
                thought_alignment: llmAnalysis.thought_alignment_tips || [],
                daily_actions: [],
            };
            const insights = {
                ai_narrative: llmAnalysis.insights || '',
                astro_insights: '',
                energy_state: this.mapEnergyState(llmAnalysis.energy_state),
                energy_reason: llmAnalysis.energy_reason,
                keyword_analysis: {
                    detected_category: finalCategory,
                    category_label: llmAnalysis.category_label,
                    energy_state: llmAnalysis.energy_state,
                    energy_reason: llmAnalysis.energy_reason,
                },
                emotional_charge: await this.detectEmotionalCharge(description),
                summary_for_ui: llmAnalysis.summary_for_ui,
                category_label: llmAnalysis.category_label,
            };
            if (!llmAnalysis.scores) {
                const astro_support_index = await this.computeAstroSupportIndex(finalCategory, `${title} ${description}`.toLowerCase(), user);
                scores.astro_support_index = astro_support_index;
                scores.mfp_score = this.computeMFPScore({
                    resonance_score: scores.resonance_score,
                    alignment_score: scores.alignment_score,
                    antrashaakti_score: scores.antrashaakti_score,
                    mahaadha_score: scores.mahaadha_score,
                    astro_support_index,
                });
            }
            return {
                scores,
                tips,
                insights,
                detectedCategory: finalCategory,
            };
        }
        catch (error) {
            this.logger.error('LLM analysis failed, using fallback', error);
            return this.fallbackEvaluation(title, description, category, user);
        }
    }
    async fallbackEvaluation(title, description, category, user) {
        const backendConfig = await this.backendConfigService.getBackendConfig();
        const combinedText = `${title} ${description}`.toLowerCase();
        const finalCategory = category || this.detectCategoryWithBackendConfig(title, description, backendConfig) || backendConfig.fallback_category;
        const resonance_score = await this.computeResonanceScore(combinedText);
        const alignment_score = await this.computeAlignmentScore(combinedText, title);
        const antrashaakti_score = await this.computeAntrashaaktiScore(combinedText);
        const mahaadha_score = await this.computeMahaadhaScore(combinedText);
        const astro_support_index = await this.computeAstroSupportIndex(finalCategory, combinedText, user);
        const mfp_score = this.computeMFPScore({
            resonance_score,
            alignment_score,
            antrashaakti_score,
            mahaadha_score,
            astro_support_index,
        });
        const tips = await this.generateTips(combinedText, finalCategory, mfp_score, mahaadha_score);
        const insights = await this.generateInsights(combinedText, finalCategory, mfp_score, resonance_score, alignment_score, mahaadha_score, astro_support_index);
        const baseCoherence = (resonance_score + alignment_score) / 2;
        const clarityBonus = description.length > 50 ? 5 : 0;
        const confidenceBonus = antrashaakti_score > 60 ? 5 : 0;
        const blockagePenalty = mahaadha_score > 30 ? -10 : 0;
        const coherence_score = Math.max(0, Math.min(100, baseCoherence + clarityBonus + confidenceBonus + blockagePenalty));
        return {
            scores: {
                resonance_score,
                alignment_score,
                antrashaakti_score,
                mahaadha_score,
                astro_support_index,
                mfp_score,
                coherence_score: Math.round(coherence_score),
            },
            tips,
            insights,
            detectedCategory: finalCategory,
        };
    }
    mapEnergyState(llmState) {
        const mapping = {
            aligned: 'aligned',
            scattered: 'unstable',
            blocked: 'blocked',
            doubtful: 'unstable',
            burned_out: 'unstable',
        };
        return mapping[llmState] || 'aligned';
    }
    async detectEmotionalCharge(description) {
        const text = description.toLowerCase();
        const positiveKeywords = await this.getPositiveKeywords();
        const negativeKeywords = await this.getNegativeKeywords();
        const positiveCount = positiveKeywords.filter(kw => text.includes(kw)).length;
        const negativeCount = negativeKeywords.filter(kw => text.includes(kw)).length;
        if (positiveCount > negativeCount * 2)
            return 'highly positive';
        if (positiveCount > negativeCount)
            return 'positive';
        if (negativeCount > positiveCount * 2)
            return 'negative';
        return 'neutral';
    }
    async computeResonanceScore(text) {
        let score = 40;
        let positiveCount = 0;
        const positiveKeywords = await this.getPositiveKeywords();
        for (const kw of positiveKeywords) {
            const regex = new RegExp(`\\b${kw}\\b`, 'gi');
            const matches = text.match(regex);
            if (matches)
                positiveCount += matches.length;
        }
        score += Math.min(positiveCount * 6, 35);
        let negativeCount = 0;
        const negativeKeywords = await this.getNegativeKeywords();
        for (const kw of negativeKeywords) {
            const regex = new RegExp(`\\b${kw}\\b`, 'gi');
            const matches = text.match(regex);
            if (matches)
                negativeCount += matches.length;
        }
        score -= Math.min(negativeCount * 10, 45);
        const intensityWords = await this.constantsService.getIntensityWords();
        const intensityCount = intensityWords.filter((w) => text.includes(w)).length;
        score += Math.min(intensityCount * 3, 10);
        const wordCount = text.split(/\s+/).length;
        if (wordCount > 20)
            score += 5;
        if (wordCount > 50)
            score += 5;
        if (wordCount > 100)
            score += 5;
        const futureTense = await this.constantsService.getFutureTenseWords();
        const hasFutureTense = futureTense.some((ft) => text.includes(ft));
        if (hasFutureTense)
            score += 8;
        const presentTense = await this.constantsService.getPresentTenseWords();
        const hasPresentTense = presentTense.some((pt) => text.includes(pt));
        if (hasPresentTense)
            score += 10;
        if (/\d+/.test(text))
            score += 5;
        if (text.includes('because') || text.includes('since') || text.includes('as'))
            score += 3;
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    async computeAlignmentScore(text, title) {
        let score = 60;
        const titleWords = title.toLowerCase().split(/\s+/);
        const descriptionWords = text.split(/\s+/);
        const matchingWords = titleWords.filter((word) => descriptionWords.some((dw) => dw.includes(word))).length;
        score += Math.min(matchingWords * 3, 20);
        if (text.includes('commit') || text.includes('dedicated') || text.includes('devoted')) {
            score += 10;
        }
        if (/\d+/.test(text))
            score += 5;
        if (text.includes('by ') || text.includes('within '))
            score += 5;
        if (text.includes('clear') || text.includes('specific') || text.includes('exact')) {
            score += 5;
        }
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    async computeAntrashaaktiScore(text) {
        let score = 45;
        const powerWords = await this.constantsService.getPowerWords();
        let powerCount = 0;
        for (const pw of powerWords) {
            const regex = new RegExp(`\\b${pw}\\b`, 'gi');
            const matches = text.match(regex);
            if (matches)
                powerCount += matches.length;
        }
        score += Math.min(powerCount * 7, 35);
        const iAmPattern = /i\s+(am|'m)\s+([a-z]+)/gi;
        const iAmMatches = text.match(iAmPattern);
        if (iAmMatches) {
            const positiveAfterIAm = await this.constantsService.getPositiveAfterIAm();
            let positiveIAmCount = 0;
            for (const match of iAmMatches) {
                if (positiveAfterIAm.some(p => match.toLowerCase().includes(p))) {
                    positiveIAmCount++;
                }
            }
            score += Math.min(positiveIAmCount * 8, 20);
        }
        const actionPhrases = await this.constantsService.getActionPhrases();
        const actionCount = actionPhrases.filter((ap) => text.includes(ap)).length;
        score += Math.min(actionCount * 5, 15);
        const beliefWords = await this.constantsService.getBeliefWords();
        const beliefCount = beliefWords.filter((bw) => text.includes(bw)).length;
        score += Math.min(beliefCount * 4, 12);
        const negativeSelfTalk = await this.constantsService.getNegativeSelfTalk();
        const negativeCount = negativeSelfTalk.filter((nst) => text.includes(nst)).length;
        score -= Math.min(negativeCount * 12, 40);
        const doubtWords = await this.constantsService.getDoubtWords();
        const doubtCount = doubtWords.filter((dw) => text.includes(dw)).length;
        score -= Math.min(doubtCount * 5, 20);
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    async computeMahaadhaScore(text) {
        let blockageScore = 0;
        const negativeKeywords = await this.getNegativeKeywords();
        const negativeCount = negativeKeywords.filter((kw) => text.includes(kw)).length;
        blockageScore += Math.min(negativeCount * 10, 50);
        const limitingPatterns = await this.constantsService.getLimitingPatterns();
        const limitingCount = limitingPatterns.filter((pattern) => text.includes(pattern)).length;
        blockageScore += Math.min(limitingCount * 15, 30);
        const fearWords = ['afraid', 'scared', 'worried'];
        if (fearWords.some(word => text.includes(word)) || negativeKeywords.some(kw => text.includes(kw))) {
            blockageScore += 10;
        }
        const doubtWords = await this.constantsService.getDoubtWords();
        if (doubtWords.some(dw => text.includes(dw))) {
            blockageScore += 5;
        }
        return Math.max(0, Math.min(100, Math.round(blockageScore)));
    }
    async computeAstroSupportIndex(category, text, user) {
        let score = 60;
        if (!category) {
            return Math.round(score);
        }
        const categoryPlanets = await this.getCategoryPlanets();
        const planetMapping = categoryPlanets[category.toLowerCase()];
        if (!planetMapping) {
            return Math.round(score);
        }
        const now = new Date();
        const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
        const favorablePeriod = dayOfYear % 30;
        if (favorablePeriod < 15) {
            score += 20;
        }
        else if (favorablePeriod < 25) {
            score += 10;
        }
        else {
            score -= 10;
        }
        switch (category.toLowerCase()) {
            case 'relationship':
                score += 5;
                break;
            case 'career':
                score += 5;
                break;
            case 'money':
                score += 10;
                break;
            case 'health':
                score += 5;
                break;
            case 'spiritual':
                score += 8;
                break;
        }
        return Math.max(0, Math.min(100, Math.round(score)));
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
    async generateTips(text, category, mfpScore, blockageScore) {
        const tips = {
            rituals: [],
            what_to_manifest: [],
            what_not_to_manifest: [],
            thought_alignment: [],
            daily_actions: [],
        };
        const hasNumbers = /\d+/.test(text);
        const hasTimeframe = /(by|within|before|in)\s+\d+/.test(text);
        const negativeKeywords = await this.getNegativeKeywords();
        const hasNegativeWords = negativeKeywords.some(kw => text.includes(kw));
        const doubtWords = await this.constantsService.getDoubtWords();
        const hasDoubtWords = doubtWords.some(dw => new RegExp(dw, 'i').test(text));
        const wordCount = text.split(/\s+/).length;
        if (category) {
            switch (category.toLowerCase()) {
                case 'relationship':
                    tips.rituals.push('Light a pink or rose candle for love and harmony');
                    tips.rituals.push('Write daily affirmations about your ideal relationship');
                    tips.rituals.push('Practice gratitude for current relationships in your life');
                    if (hasNegativeWords) {
                        tips.rituals.push('Release past relationship patterns through journaling');
                    }
                    break;
                case 'career':
                    tips.rituals.push('Create a vision board with specific career goals');
                    tips.rituals.push('Meditate on your professional purpose and values');
                    tips.rituals.push('Network with intention and authenticity');
                    if (hasTimeframe) {
                        tips.rituals.push('Set weekly milestones toward your career goal');
                    }
                    break;
                case 'money':
                    tips.rituals.push('Visualize money flowing to you effortlessly');
                    tips.rituals.push('Practice giving to create abundance flow');
                    tips.rituals.push('Keep a gratitude journal for financial blessings');
                    if (hasNumbers) {
                        tips.rituals.push('Create a specific savings or income goal visualization');
                    }
                    break;
                case 'health':
                    tips.rituals.push('Set daily wellness intentions each morning');
                    tips.rituals.push('Practice mindful movement or yoga');
                    tips.rituals.push('Nourish your body with intention and gratitude');
                    if (hasTimeframe) {
                        tips.rituals.push('Track your health progress weekly');
                    }
                    break;
                case 'spiritual':
                    tips.rituals.push('Daily meditation or prayer practice');
                    tips.rituals.push('Connect with nature regularly');
                    tips.rituals.push('Read spiritual texts or teachings');
                    break;
                default:
                    tips.rituals.push('Create a vision board for your manifestation');
                    tips.rituals.push('Practice daily meditation or visualization');
                    tips.rituals.push('Keep a gratitude journal');
            }
        }
        else {
            tips.rituals.push('Create a vision board for your manifestation');
            tips.rituals.push('Practice daily meditation or visualization');
            tips.rituals.push('Keep a gratitude journal');
        }
        if (mfpScore && mfpScore > 75) {
            tips.what_to_manifest.push('Focus on the positive aspects of your desire');
            tips.what_to_manifest.push('Visualize the outcome with clarity and emotion');
            tips.what_to_manifest.push('Take aligned action daily toward your goal');
            if (hasTimeframe) {
                tips.what_to_manifest.push('Stay committed to your timeline while remaining flexible');
            }
        }
        else if (mfpScore && mfpScore > 60) {
            tips.what_to_manifest.push('Clarify your intention with more specific details');
            tips.what_to_manifest.push('Focus on the feeling you want to experience');
            tips.what_to_manifest.push('Take small daily actions aligned with your goal');
            if (wordCount < 30) {
                tips.what_to_manifest.push('Add more detail about why this manifestation matters to you');
            }
        }
        else {
            tips.what_to_manifest.push('Reframe your intention in positive, present-tense language');
            tips.what_to_manifest.push('Focus on what you want, not what you lack');
            tips.what_to_manifest.push('Release attachment to the outcome and trust the process');
            if (hasNegativeWords) {
                tips.what_to_manifest.push('Replace negative language with positive affirmations');
            }
        }
        if (blockageScore && blockageScore > 60) {
            tips.what_not_to_manifest.push('Avoid focusing on what you lack or don\'t have');
            tips.what_not_to_manifest.push('Release fear-based thoughts and limiting beliefs');
            tips.what_not_to_manifest.push('Stop comparing yourself to others');
            if (hasDoubtWords) {
                tips.what_not_to_manifest.push('Replace "maybe" and "hopefully" with "I am" statements');
            }
        }
        else if (blockageScore && blockageScore > 30) {
            tips.what_not_to_manifest.push('Avoid negative self-talk and doubt');
            tips.what_not_to_manifest.push('Don\'t force outcomes or become attached');
            tips.what_not_to_manifest.push('Release worry about timing and how it will happen');
        }
        else {
            tips.what_not_to_manifest.push('Avoid negative self-talk');
            tips.what_not_to_manifest.push('Don\'t force outcomes or become overly attached');
        }
        if (hasDoubtWords) {
            tips.thought_alignment.push('Replace doubt words ("maybe", "hopefully") with confident statements');
        }
        if (hasNegativeWords) {
            tips.thought_alignment.push('Reframe negative thoughts into positive affirmations');
        }
        tips.thought_alignment.push('Practice daily affirmations aligned with your desire');
        tips.thought_alignment.push('Monitor and reframe limiting beliefs as they arise');
        tips.thought_alignment.push('Cultivate gratitude for what you already have');
        if (wordCount < 30) {
            tips.daily_actions.push('Expand your manifestation description with more details');
        }
        tips.daily_actions.push('Write in your manifestation journal daily');
        if (hasTimeframe) {
            tips.daily_actions.push('Take one small action toward your goal each day');
        }
        else {
            tips.daily_actions.push('Take one small action toward your goal');
        }
        tips.daily_actions.push('Visualize your desired outcome for 5-10 minutes daily');
        if (category === 'career') {
            tips.daily_actions.push('Update your resume or LinkedIn profile');
        }
        else if (category === 'health') {
            tips.daily_actions.push('Do one healthy activity for your body');
        }
        return tips;
    }
    async generateInsights(text, category, mfpScore, resonanceScore, alignmentScore, blockageScore, astroScore) {
        const wordCount = text.split(/\s+/).length;
        const negativeKeywords = await this.getNegativeKeywords();
        const hasNegativeWords = negativeKeywords.some(kw => text.includes(kw));
        const doubtWords = await this.constantsService.getDoubtWords();
        const hasDoubtWords = doubtWords.some(dw => new RegExp(dw, 'i').test(text));
        const hasTimeframe = /(by|within|before|in)\s+\d+/.test(text);
        const hasNumbers = /\d+/.test(text);
        const hasSpecificDetails = wordCount > 50;
        const positiveWordsFound = [];
        const negativeWordsFound = [];
        const positiveKeywords = await this.getPositiveKeywords();
        const negativeKeywordsList = await this.getNegativeKeywords();
        for (const kw of positiveKeywords) {
            if (text.includes(kw))
                positiveWordsFound.push(kw);
        }
        for (const kw of negativeKeywordsList) {
            if (text.includes(kw))
                negativeWordsFound.push(kw);
        }
        let energy_state = 'aligned';
        if (mfpScore && mfpScore < 45) {
            energy_state = 'blocked';
        }
        else if (mfpScore && mfpScore < 65) {
            energy_state = 'unstable';
        }
        else if (mfpScore && mfpScore >= 65) {
            energy_state = 'aligned';
        }
        let ai_narrative = '';
        if (mfpScore && mfpScore > 80) {
            ai_narrative = `Your manifestation shows strong alignment and clarity. Your intention is clear and well-defined`;
            if (hasSpecificDetails) {
                ai_narrative += ` with good detail`;
            }
            if (hasTimeframe) {
                ai_narrative += ` and a clear timeline`;
            }
            ai_narrative += `. The energy around this desire is highly favorable. Continue focusing on positive thoughts and taking aligned action.`;
        }
        else if (mfpScore && mfpScore > 65) {
            ai_narrative = `Your manifestation has good potential`;
            if (resonanceScore && resonanceScore > 60) {
                ai_narrative += ` with positive emotional resonance`;
            }
            if (hasNegativeWords) {
                ai_narrative += `. However, there are some negative patterns that could be reframed`;
            }
            if (wordCount < 30) {
                ai_narrative += `. Adding more detail about your intention would strengthen it`;
            }
            ai_narrative += `. Focus on clarity and positive emotional charge.`;
        }
        else if (mfpScore && mfpScore > 50) {
            ai_narrative = `Your manifestation needs more clarity and positive energy`;
            if (hasNegativeWords) {
                ai_narrative += `. There are negative words that should be reframed`;
            }
            if (hasDoubtWords) {
                ai_narrative += `. Replace doubt words like "maybe" or "hopefully" with confident statements`;
            }
            if (wordCount < 25) {
                ai_narrative += `. Consider adding more detail about what you want and why`;
            }
            ai_narrative += `. Focus on what you want (not what you don't want) and release fear and doubt.`;
        }
        else {
            ai_narrative = `Your manifestation needs significant reframing`;
            if (hasNegativeWords) {
                ai_narrative += `. There are many negative patterns that are blocking your energy`;
            }
            if (hasDoubtWords) {
                ai_narrative += `. Doubt and uncertainty are present in your language`;
            }
            ai_narrative += `. Reframe your intention in positive, present-tense language. Focus on what you want to experience, not what you're trying to avoid.`;
        }
        let astro_insights = '';
        if (category) {
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            if (astroScore && astroScore > 80) {
                astro_insights = `The planetary energies are exceptionally supportive for ${categoryName} manifestations right now. This is an excellent time to focus on this area with full commitment.`;
            }
            else if (astroScore && astroScore > 70) {
                astro_insights = `The planetary energies are highly supportive for ${categoryName} manifestations right now. This is an excellent time to focus on this area.`;
            }
            else if (astroScore && astroScore > 60) {
                astro_insights = `The planetary energies are moderately supportive for ${categoryName} manifestations. Focus on alignment and positive action.`;
            }
            else {
                astro_insights = `The planetary energies for ${categoryName} manifestations are currently neutral. Focus on inner alignment and clarity.`;
            }
        }
        else {
            astro_insights = 'Consider specifying a category to receive more targeted astrological guidance.';
        }
        let emotional_charge = 'neutral';
        if (resonanceScore && resonanceScore > 75) {
            emotional_charge = 'highly positive';
        }
        else if (resonanceScore && resonanceScore > 60) {
            emotional_charge = 'positive';
        }
        else if (resonanceScore && resonanceScore < 40) {
            emotional_charge = 'negative';
        }
        const keyword_analysis = {
            positive_words_found: positiveWordsFound,
            negative_words_found: negativeWordsFound,
            word_count: wordCount,
            has_specificity: hasNumbers || hasTimeframe,
            has_doubt_words: hasDoubtWords,
            has_negative_patterns: hasNegativeWords,
            category_detected: category || null,
        };
        return {
            ai_narrative,
            astro_insights,
            energy_state,
            keyword_analysis,
            emotional_charge,
        };
    }
};
exports.ManifestationAIEvaluationService = ManifestationAIEvaluationService;
exports.ManifestationAIEvaluationService = ManifestationAIEvaluationService = ManifestationAIEvaluationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [manifestation_llm_analyzer_service_1.ManifestationLLMAnalyzerService,
        manifestation_backend_config_service_1.ManifestationBackendConfigService,
        constants_service_1.ConstantsService])
], ManifestationAIEvaluationService);
//# sourceMappingURL=manifestation-ai-evaluation.service.js.map