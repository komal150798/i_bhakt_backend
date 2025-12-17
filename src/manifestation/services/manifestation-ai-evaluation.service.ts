import { Injectable, Logger } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { ManifestationLLMAnalyzerService } from './manifestation-llm-analyzer.service';
import { ManifestationBackendConfigService } from './manifestation-backend-config.service';
import { ConstantsService } from '../../common/constants/constants.service';

export interface ManifestationScores {
  resonance_score: number;
  alignment_score: number;
  antrashaakti_score: number;
  mahaadha_score: number;
  astro_support_index: number;
  mfp_score: number;
}

export interface ManifestationTips {
  rituals: string[];
  what_to_manifest: string[];
  what_not_to_manifest: string[];
  thought_alignment: string[];
  daily_actions: string[];
}

export interface ManifestationInsights {
  ai_narrative: string;
  astro_insights: string;
  energy_state: 'aligned' | 'unstable' | 'blocked';
  energy_reason?: string; // From LLM analysis
  keyword_analysis: Record<string, any>;
  emotional_charge: string;
  summary_for_ui?: string; // From LLM analysis
  category_label?: string; // From LLM analysis
}

/**
 * AI + Swiss Ephemeris Manifestation Evaluation Service
 * 
 * This service analyzes manifestation text and computes:
 * - Resonance Score (emotional clarity, positive intent)
 * - Alignment Score (thought alignment, commitment strength)
 * - Antrashaakti Score (Inner Power)
 * - Mahaadha Score (blockages, limiting beliefs)
 * - Astro Support Index (planetary transits influence)
 * - MFP Score (Manifestation Fulfillment Probability)
 */
@Injectable()
export class ManifestationAIEvaluationService {
  private readonly logger = new Logger(ManifestationAIEvaluationService.name);

  constructor(
    private readonly llmAnalyzer: ManifestationLLMAnalyzerService,
    private readonly backendConfigService: ManifestationBackendConfigService,
    private readonly constantsService: ConstantsService,
  ) {}

  // Helper methods to get constants (cached and loaded from database)
  private async getPositiveKeywords(): Promise<string[]> {
    return this.constantsService.getPositiveKeywords();
  }

  private async getNegativeKeywords(): Promise<string[]> {
    return this.constantsService.getNegativeKeywords();
  }

  private async getCategoryPlanets(): Promise<Record<string, any>> {
    return this.constantsService.getCategoryPlanets();
  }

  /**
   * Auto-detect category using backend config
   */
  private detectCategoryWithBackendConfig(
    title: string,
    description: string,
    backendConfig: any,
  ): string | undefined {
    const text = `${title} ${description}`.toLowerCase();
    
    // Use backend category_keywords
    const scores: Record<string, number> = {};
    for (const [cat, keywords] of Object.entries(backendConfig.category_keywords)) {
      scores[cat] = (keywords as string[]).filter((kw: string) => text.includes(kw.toLowerCase())).length;
    }

    const maxCategory = Object.entries(scores).reduce((a, b) => (scores[a[0]] > scores[b[0]] ? a : b))[0];
    
    if (scores[maxCategory] >= 2) {
      return maxCategory;
    }
    
    return undefined; // Will fallback to backendConfig.fallback_category
  }

  /**
   * Auto-detect category from title and description (legacy - uses backend config if available)
   * NOTE: This method is deprecated - use detectCategoryWithBackendConfig instead
   */
  private async detectCategory(title: string, description: string): Promise<string | undefined> {
    const combinedText = `${title} ${description}`.toLowerCase();
    const categoryScores: Record<string, number> = {};

    // Get backend config to access category keywords
    const backendConfig = await this.backendConfigService.getBackendConfig();
    const categoryKeywords = backendConfig.category_keywords || {};
    
    // Initialize scores for all categories
    for (const category of Object.keys(categoryKeywords)) {
      categoryScores[category] = 0;
    }

    // Count keyword matches for each category (from backend config)
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const keywordArray = keywords as string[];
      for (const keyword of keywordArray) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = combinedText.match(regex);
        if (matches) {
          categoryScores[category] = (categoryScores[category] || 0) + matches.length;
        }
      }
    }

    // Find category with highest score
    let maxScore = 0;
    let detectedCategory: string | undefined = undefined;

    for (const [category, score] of Object.entries(categoryScores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedCategory = category;
      }
    }

    // Only return category if score is significant (at least 2 matches)
    return maxScore >= 2 ? detectedCategory : undefined;
  }

  /**
   * Main evaluation method - uses LLM for dynamic analysis, falls back to rule-based
   */
  async evaluateManifestation(
    title: string,
    description: string,
    category?: string,
    user?: User,
  ): Promise<{
    scores: ManifestationScores;
    tips: ManifestationTips;
    insights: ManifestationInsights;
    detectedCategory?: string;
  }> {
    try {
      // Get backend configuration (all domain knowledge)
      const backendConfig = await this.backendConfigService.getBackendConfig();
      
      // Use LLM analyzer for dynamic, personalized analysis
      const llmAnalysis = await this.llmAnalyzer.analyzeManifestation(
        title,
        description,
        backendConfig,
        category,
      );

      // Map LLM response to existing structure
      const finalCategory = llmAnalysis.detected_category || category || 'other';
      
      // Use scores from LLM analysis if available, otherwise calculate
      const scores = llmAnalysis.scores || {
        resonance_score: 50,
        alignment_score: 50,
        antrashaakti_score: 50,
        mahaadha_score: 0,
        astro_support_index: 60,
        mfp_score: 50,
      };

      // Map LLM tips to existing structure
      const tips: ManifestationTips = {
        rituals: llmAnalysis.suggested_rituals || [],
        what_to_manifest: llmAnalysis.what_to_manifest || [],
        what_not_to_manifest: llmAnalysis.what_not_to_manifest || [],
        thought_alignment: llmAnalysis.thought_alignment_tips || [],
        daily_actions: [], // Can be derived from rituals if needed
      };

      // Map LLM insights to existing structure
      const insights: ManifestationInsights = {
        ai_narrative: llmAnalysis.insights || '',
        astro_insights: '', // Can be enhanced with astro calculations
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

      // Calculate astro support if not provided
      if (!llmAnalysis.scores) {
        const astro_support_index = await this.computeAstroSupportIndex(
          finalCategory,
          `${title} ${description}`.toLowerCase(),
          user,
        );
        scores.astro_support_index = astro_support_index;
        
        // Recalculate MFP with astro support
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
    } catch (error) {
      this.logger.error('LLM analysis failed, using fallback', error);
      // Fallback to rule-based analysis
      return this.fallbackEvaluation(title, description, category, user);
    }
  }

  /**
   * Fallback evaluation using rule-based analysis
   */
  private async fallbackEvaluation(
    title: string,
    description: string,
    category?: string,
    user?: User,
  ): Promise<{
    scores: ManifestationScores;
    tips: ManifestationTips;
    insights: ManifestationInsights;
    detectedCategory?: string;
  }> {
    // Get backend configuration
    const backendConfig = await this.backendConfigService.getBackendConfig();
    const combinedText = `${title} ${description}`.toLowerCase();
    
    // Use backend config for category detection
    const finalCategory = category || this.detectCategoryWithBackendConfig(title, description, backendConfig) || backendConfig.fallback_category;

    const resonance_score = await this.computeResonanceScore(combinedText);
    const alignment_score = await this.computeAlignmentScore(combinedText, title);
    const antrashaakti_score = await this.computeAntrashaaktiScore(combinedText);
    const mahaadha_score = await this.computeMahaadhaScore(combinedText);
    const astro_support_index = await this.computeAstroSupportIndex(
      finalCategory,
      combinedText,
      user,
    );
    const mfp_score = this.computeMFPScore({
      resonance_score,
      alignment_score,
      antrashaakti_score,
      mahaadha_score,
      astro_support_index,
    });

    const tips = await this.generateTips(combinedText, finalCategory, mfp_score, mahaadha_score);
    const insights = await this.generateInsights(
      combinedText,
      finalCategory,
      mfp_score,
      resonance_score,
      alignment_score,
      mahaadha_score,
      astro_support_index,
    );

    return {
      scores: {
        resonance_score,
        alignment_score,
        antrashaakti_score,
        mahaadha_score,
        astro_support_index,
        mfp_score,
      },
      tips,
      insights,
      detectedCategory: finalCategory,
    };
  }

  /**
   * Map LLM energy state to existing energy state format
   */
  private mapEnergyState(
    llmState: 'aligned' | 'scattered' | 'blocked' | 'doubtful' | 'burned_out',
  ): 'aligned' | 'unstable' | 'blocked' {
    const mapping: Record<string, 'aligned' | 'unstable' | 'blocked'> = {
      aligned: 'aligned',
      scattered: 'unstable',
      blocked: 'blocked',
      doubtful: 'unstable',
      burned_out: 'unstable',
    };
    return mapping[llmState] || 'aligned';
  }

  /**
   * Detect emotional charge from description
   */
  private async detectEmotionalCharge(description: string): Promise<string> {
    const text = description.toLowerCase();
    const positiveKeywords = await this.getPositiveKeywords();
    const negativeKeywords = await this.getNegativeKeywords();
    const positiveCount = positiveKeywords.filter(kw => text.includes(kw)).length;
    const negativeCount = negativeKeywords.filter(kw => text.includes(kw)).length;

    if (positiveCount > negativeCount * 2) return 'highly positive';
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount * 2) return 'negative';
    return 'neutral';
  }

  /**
   * Resonance Score: Emotional clarity, positive intent, inner alignment
   * Range: 0-100
   * Analyzes actual text content for emotional charge and clarity
   */
  private async computeResonanceScore(text: string): Promise<number> {
    let score = 40; // Lower base to make it more dynamic

    // Analyze positive keywords with word boundaries (more accurate)
    let positiveCount = 0;
    const positiveKeywords = await this.getPositiveKeywords();
    for (const kw of positiveKeywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) positiveCount += matches.length;
    }
    score += Math.min(positiveCount * 6, 35); // More weight per positive word

    // Analyze negative keywords
    let negativeCount = 0;
    const negativeKeywords = await this.getNegativeKeywords();
    for (const kw of negativeKeywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) negativeCount += matches.length;
    }
    score -= Math.min(negativeCount * 10, 45); // Stronger penalty

    // Emotional intensity indicators (from ConstantsService - no hardcoded words)
    const intensityWords = await this.constantsService.getIntensityWords();
    const intensityCount = intensityWords.filter((w) => text.includes(w)).length;
    score += Math.min(intensityCount * 3, 10);

    // Length and detail analysis (more detail = more clarity)
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 20) score += 5;
    if (wordCount > 50) score += 5;
    if (wordCount > 100) score += 5;

    // Present/future tense analysis (manifestation language)
    const futureTense = await this.constantsService.getFutureTenseWords();
    const hasFutureTense = futureTense.some((ft) => text.includes(ft));
    if (hasFutureTense) score += 8;

    // Present tense "I am" statements (powerful)
    const presentTense = await this.constantsService.getPresentTenseWords();
    const hasPresentTense = presentTense.some((pt) => text.includes(pt));
    if (hasPresentTense) score += 10;

    // Specificity indicators (numbers, dates, concrete details)
    if (/\d+/.test(text)) score += 5;
    if (text.includes('because') || text.includes('since') || text.includes('as')) score += 3;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Alignment Score: Thought alignment, word-likelihood mapping, commitment strength
   * Range: 0-100
   */
  private async computeAlignmentScore(text: string, title: string): Promise<number> {
    let score = 60; // Base score

    // Title-description alignment
    const titleWords = title.toLowerCase().split(/\s+/);
    const descriptionWords = text.split(/\s+/);
    const matchingWords = titleWords.filter((word) =>
      descriptionWords.some((dw) => dw.includes(word)),
    ).length;
    score += Math.min(matchingWords * 3, 20);

    // Commitment indicators
    if (text.includes('commit') || text.includes('dedicated') || text.includes('devoted')) {
      score += 10;
    }

    // Specificity bonus
    if (/\d+/.test(text)) score += 5; // Numbers indicate specificity
    if (text.includes('by ') || text.includes('within ')) score += 5; // Time-bound

    // Clarity indicators
    if (text.includes('clear') || text.includes('specific') || text.includes('exact')) {
      score += 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Antrashaakti Score: Inner Power, self-belief, confidence
   * Range: 0-100
   * Analyzes self-empowerment language and inner strength indicators
   */
  private async computeAntrashaaktiScore(text: string): Promise<number> {
    let score = 45; // Lower base for more dynamic range

    // Power and strength words (from ConstantsService - no hardcoded words)
    const powerWords = await this.constantsService.getPowerWords();
    let powerCount = 0;
    for (const pw of powerWords) {
      const regex = new RegExp(`\\b${pw}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) powerCount += matches.length;
    }
    score += Math.min(powerCount * 7, 35);

    // Self-referential positive statements ("I am", "I'm")
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

    // Action-oriented and proactive language
    const actionPhrases = await this.constantsService.getActionPhrases();
    const actionCount = actionPhrases.filter((ap) => text.includes(ap)).length;
    score += Math.min(actionCount * 5, 15);

    // Self-belief indicators
    const beliefWords = await this.constantsService.getBeliefWords();
    const beliefCount = beliefWords.filter((bw) => text.includes(bw)).length;
    score += Math.min(beliefCount * 4, 12);

    // Negative self-talk reduces score significantly
    const negativeSelfTalk = await this.constantsService.getNegativeSelfTalk();
    const negativeCount = negativeSelfTalk.filter((nst) => text.includes(nst)).length;
    score -= Math.min(negativeCount * 12, 40);

    // Doubt and uncertainty indicators
    const doubtWords = await this.constantsService.getDoubtWords();
    const doubtCount = doubtWords.filter((dw) => text.includes(dw)).length;
    score -= Math.min(doubtCount * 5, 20);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Mahaadha Score: Blockages, limiting beliefs, fear patterns
   * Higher score = more blockages (inverted logic)
   * Range: 0-100 (0 = no blockages, 100 = heavy blockages)
   */
  private async computeMahaadhaScore(text: string): Promise<number> {
    let blockageScore = 0;

    // Negative keywords
    const negativeKeywords = await this.getNegativeKeywords();
    const negativeCount = negativeKeywords.filter((kw) => text.includes(kw)).length;
    blockageScore += Math.min(negativeCount * 10, 50);

    // Limiting belief patterns
    const limitingPatterns = await this.constantsService.getLimitingPatterns();
    const limitingCount = limitingPatterns.filter((pattern) => text.includes(pattern)).length;
    blockageScore += Math.min(limitingCount * 15, 30);

    // Fear indicators (using negative keywords from constants)
    const fearWords = ['afraid', 'scared', 'worried'];
    if (fearWords.some(word => text.includes(word)) || negativeKeywords.some(kw => text.includes(kw))) {
      blockageScore += 10;
    }

    // Doubt indicators (using doubt words from constants)
    const doubtWords = await this.constantsService.getDoubtWords();
    if (doubtWords.some(dw => text.includes(dw))) {
      blockageScore += 5;
    }

    return Math.max(0, Math.min(100, Math.round(blockageScore)));
  }

  /**
   * Astro Support Index: Planetary transits influence based on category
   * Range: 0-100
   */
  private async computeAstroSupportIndex(
    category?: string,
    text?: string,
    user?: User,
  ): Promise<number> {
    // Base score
    let score = 60;

    if (!category) {
      return Math.round(score);
    }

    // Category-specific planetary influence
    const categoryPlanets = await this.getCategoryPlanets();
    const planetMapping = categoryPlanets[category.toLowerCase()];
    if (!planetMapping) {
      return Math.round(score);
    }

    // Simulate planetary positions (in production, use Swiss Ephemeris)
    // For now, use time-based scoring
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // Simulate favorable periods (simplified)
    const favorablePeriod = dayOfYear % 30; // Rough 30-day cycle
    
    if (favorablePeriod < 15) {
      score += 20; // Favorable period
    } else if (favorablePeriod < 25) {
      score += 10; // Moderate period
    } else {
      score -= 10; // Challenging period
    }

    // Category-specific adjustments
    switch (category.toLowerCase()) {
      case 'relationship':
        // Venus influence
        score += 5;
        break;
      case 'career':
        // Mercury influence
        score += 5;
        break;
      case 'money':
        // Jupiter influence
        score += 10;
        break;
      case 'health':
        // Mars/Sun influence
        score += 5;
        break;
      case 'spiritual':
        // Jupiter/Ketu influence
        score += 8;
        break;
    }

    // TODO: Integrate actual Swiss Ephemeris calculations
    // This would require:
    // 1. User's birth chart (if available)
    // 2. Current planetary positions
    // 3. Transit analysis
    // 4. Aspect calculations

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * MFP Score: Manifestation Fulfillment Probability
   * Weighted average of all scores
   */
  private computeMFPScore(scores: {
    resonance_score: number;
    alignment_score: number;
    antrashaakti_score: number;
    mahaadha_score: number;
    astro_support_index: number;
  }): number {
    // Weights
    const weights = {
      resonance: 0.25,
      alignment: 0.20,
      antrashaakti: 0.20,
      mahaadha: 0.15, // Inverted (lower blockage = higher MFP)
      astro: 0.20,
    };

    // Convert mahaadha (blockage) to positive influence (inverted)
    const mahaadhaInfluence = 100 - scores.mahaadha_score;

    const mfp =
      scores.resonance_score * weights.resonance +
      scores.alignment_score * weights.alignment +
      scores.antrashaakti_score * weights.antrashaakti +
      mahaadhaInfluence * weights.mahaadha +
      scores.astro_support_index * weights.astro;

    return Math.max(0, Math.min(100, Math.round(mfp)));
  }

  /**
   * Generate Tips: Rituals, what to manifest, what not to manifest, etc.
   * Dynamic tips based on actual content analysis
   */
  private async generateTips(
    text: string,
    category?: string,
    mfpScore?: number,
    blockageScore?: number,
  ): Promise<ManifestationTips> {
    const tips: ManifestationTips = {
      rituals: [],
      what_to_manifest: [],
      what_not_to_manifest: [],
      thought_alignment: [],
      daily_actions: [],
    };

    // Analyze text for specific keywords to personalize tips
    const hasNumbers = /\d+/.test(text);
    const hasTimeframe = /(by|within|before|in)\s+\d+/.test(text);
    const negativeKeywords = await this.getNegativeKeywords();
    const hasNegativeWords = negativeKeywords.some(kw => text.includes(kw));
    const doubtWords = await this.constantsService.getDoubtWords();
    const hasDoubtWords = doubtWords.some(dw => new RegExp(dw, 'i').test(text));
    const wordCount = text.split(/\s+/).length;

    // Rituals based on category (more specific)
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
    } else {
      // Generic rituals if no category detected
      tips.rituals.push('Create a vision board for your manifestation');
      tips.rituals.push('Practice daily meditation or visualization');
      tips.rituals.push('Keep a gratitude journal');
    }

    // What to manifest (dynamic based on content analysis)
    if (mfpScore && mfpScore > 75) {
      tips.what_to_manifest.push('Focus on the positive aspects of your desire');
      tips.what_to_manifest.push('Visualize the outcome with clarity and emotion');
      tips.what_to_manifest.push('Take aligned action daily toward your goal');
      if (hasTimeframe) {
        tips.what_to_manifest.push('Stay committed to your timeline while remaining flexible');
      }
    } else if (mfpScore && mfpScore > 60) {
      tips.what_to_manifest.push('Clarify your intention with more specific details');
      tips.what_to_manifest.push('Focus on the feeling you want to experience');
      tips.what_to_manifest.push('Take small daily actions aligned with your goal');
      if (wordCount < 30) {
        tips.what_to_manifest.push('Add more detail about why this manifestation matters to you');
      }
    } else {
      tips.what_to_manifest.push('Reframe your intention in positive, present-tense language');
      tips.what_to_manifest.push('Focus on what you want, not what you lack');
      tips.what_to_manifest.push('Release attachment to the outcome and trust the process');
      if (hasNegativeWords) {
        tips.what_to_manifest.push('Replace negative language with positive affirmations');
      }
    }

    // What NOT to manifest (based on actual blockages found)
    if (blockageScore && blockageScore > 60) {
      tips.what_not_to_manifest.push('Avoid focusing on what you lack or don\'t have');
      tips.what_not_to_manifest.push('Release fear-based thoughts and limiting beliefs');
      tips.what_not_to_manifest.push('Stop comparing yourself to others');
      if (hasDoubtWords) {
        tips.what_not_to_manifest.push('Replace "maybe" and "hopefully" with "I am" statements');
      }
    } else if (blockageScore && blockageScore > 30) {
      tips.what_not_to_manifest.push('Avoid negative self-talk and doubt');
      tips.what_not_to_manifest.push('Don\'t force outcomes or become attached');
      tips.what_not_to_manifest.push('Release worry about timing and how it will happen');
    } else {
      tips.what_not_to_manifest.push('Avoid negative self-talk');
      tips.what_not_to_manifest.push('Don\'t force outcomes or become overly attached');
    }

    // Thought alignment tips (personalized)
    if (hasDoubtWords) {
      tips.thought_alignment.push('Replace doubt words ("maybe", "hopefully") with confident statements');
    }
    if (hasNegativeWords) {
      tips.thought_alignment.push('Reframe negative thoughts into positive affirmations');
    }
    tips.thought_alignment.push('Practice daily affirmations aligned with your desire');
    tips.thought_alignment.push('Monitor and reframe limiting beliefs as they arise');
    tips.thought_alignment.push('Cultivate gratitude for what you already have');

    // Daily actions (personalized based on content)
    if (wordCount < 30) {
      tips.daily_actions.push('Expand your manifestation description with more details');
    }
    tips.daily_actions.push('Write in your manifestation journal daily');
    if (hasTimeframe) {
      tips.daily_actions.push('Take one small action toward your goal each day');
    } else {
      tips.daily_actions.push('Take one small action toward your goal');
    }
    tips.daily_actions.push('Visualize your desired outcome for 5-10 minutes daily');
    if (category === 'career') {
      tips.daily_actions.push('Update your resume or LinkedIn profile');
    } else if (category === 'health') {
      tips.daily_actions.push('Do one healthy activity for your body');
    }

    return tips;
  }

  /**
   * Generate Insights: AI narrative, astro insights, energy state
   * Dynamic insights based on actual content analysis
   */
  private async generateInsights(
    text: string,
    category?: string,
    mfpScore?: number,
    resonanceScore?: number,
    alignmentScore?: number,
    blockageScore?: number,
    astroScore?: number,
  ): Promise<ManifestationInsights> {
    // Analyze text for personalized insights
    const wordCount = text.split(/\s+/).length;
    const negativeKeywords = await this.getNegativeKeywords();
    const hasNegativeWords = negativeKeywords.some(kw => text.includes(kw));
    const doubtWords = await this.constantsService.getDoubtWords();
    const hasDoubtWords = doubtWords.some(dw => new RegExp(dw, 'i').test(text));
    const hasTimeframe = /(by|within|before|in)\s+\d+/.test(text);
    const hasNumbers = /\d+/.test(text);
    const hasSpecificDetails = wordCount > 50;
    
    // Extract positive and negative words found
    const positiveWordsFound: string[] = [];
    const negativeWordsFound: string[] = [];
    
    const positiveKeywords = await this.getPositiveKeywords();
    const negativeKeywordsList = await this.getNegativeKeywords();
    for (const kw of positiveKeywords) {
      if (text.includes(kw)) positiveWordsFound.push(kw);
    }
    for (const kw of negativeKeywordsList) {
      if (text.includes(kw)) negativeWordsFound.push(kw);
    }

    // Determine energy state (more nuanced)
    let energy_state: 'aligned' | 'unstable' | 'blocked' = 'aligned';
    if (mfpScore && mfpScore < 45) {
      energy_state = 'blocked';
    } else if (mfpScore && mfpScore < 65) {
      energy_state = 'unstable';
    } else if (mfpScore && mfpScore >= 65) {
      energy_state = 'aligned';
    }

    // AI Narrative (dynamic based on actual analysis)
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
    } else if (mfpScore && mfpScore > 65) {
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
    } else if (mfpScore && mfpScore > 50) {
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
    } else {
      ai_narrative = `Your manifestation needs significant reframing`;
      if (hasNegativeWords) {
        ai_narrative += `. There are many negative patterns that are blocking your energy`;
      }
      if (hasDoubtWords) {
        ai_narrative += `. Doubt and uncertainty are present in your language`;
      }
      ai_narrative += `. Reframe your intention in positive, present-tense language. Focus on what you want to experience, not what you're trying to avoid.`;
    }

    // Astro Insights (dynamic)
    let astro_insights = '';
    if (category) {
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      if (astroScore && astroScore > 80) {
        astro_insights = `The planetary energies are exceptionally supportive for ${categoryName} manifestations right now. This is an excellent time to focus on this area with full commitment.`;
      } else if (astroScore && astroScore > 70) {
        astro_insights = `The planetary energies are highly supportive for ${categoryName} manifestations right now. This is an excellent time to focus on this area.`;
      } else if (astroScore && astroScore > 60) {
        astro_insights = `The planetary energies are moderately supportive for ${categoryName} manifestations. Focus on alignment and positive action.`;
      } else {
        astro_insights = `The planetary energies for ${categoryName} manifestations are currently neutral. Focus on inner alignment and clarity.`;
      }
    } else {
      astro_insights = 'Consider specifying a category to receive more targeted astrological guidance.';
    }

    // Emotional charge
    let emotional_charge = 'neutral';
    if (resonanceScore && resonanceScore > 75) {
      emotional_charge = 'highly positive';
    } else if (resonanceScore && resonanceScore > 60) {
      emotional_charge = 'positive';
    } else if (resonanceScore && resonanceScore < 40) {
      emotional_charge = 'negative';
    }

    // Keyword analysis (use already extracted arrays)
    const keyword_analysis: Record<string, any> = {
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
}
