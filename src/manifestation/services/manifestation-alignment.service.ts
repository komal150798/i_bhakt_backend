import { Injectable, Logger } from '@nestjs/common';
import { Manifestation } from '../entities/manifestation.entity';
import { Kundli } from '../../kundli/entities/kundli.entity';
import { KundliPlanet } from '../../kundli/entities/kundli-planet.entity';
import { KundliHouse } from '../../kundli/entities/kundli-house.entity';

/**
 * Manifestation Weakness Detection Result
 */
export interface ManifestationWeakness {
  uses_desire_language: boolean;
  authority_missing: boolean;
  time_dependency: boolean;
}

/**
 * Kundli Alignment Profile
 */
export interface KundliAlignmentProfile {
  sun_support: 'strong' | 'medium' | 'weak';
  saturn_support: 'strong' | 'medium' | 'weak';
  moon_stability: 'stable' | 'unstable';
  jupiter_guidance: boolean;
  rahu_support: 'strong' | 'medium' | 'weak';
}

/**
 * Service for aligning manifestations with Kundli data
 * Updates manifestation text and scores without changing API structure
 */
@Injectable()
export class ManifestationAlignmentService {
  private readonly logger = new Logger(ManifestationAlignmentService.name);

  /**
   * Step 1: Detect Weak Manifestation Language
   * Pure function that analyzes text for weak manifestation patterns
   */
  detectManifestationWeakness(text: string): ManifestationWeakness {
    const lowerText = text.toLowerCase().trim();

    // Check for desire language patterns
    const desirePatterns = [
      /\b(i want|i hope|i wish|i desire|i need|i would like)\b/gi,
      /\b(want to|hope to|wish to|desire to)\b/gi,
    ];
    const uses_desire_language = desirePatterns.some((pattern) =>
      pattern.test(lowerText),
    );

    // Check for authority/present-tense identity
    const authorityPatterns = [
      /\b(i am|i'm|i have|i lead|i serve|i create|i build)\b/gi,
      /\b(am becoming|am growing|am developing)\b/gi,
    ];
    const hasAuthority = authorityPatterns.some((pattern) =>
      pattern.test(lowerText),
    );
    const authority_missing = !hasAuthority;

    // Check for heavy future dependency
    const futurePatterns = [
      /\b(in \d{4}|by \d{4}|someday|one day|in the future|eventually)\b/gi,
      /\b(will be|will become|will have)\b/gi,
    ];
    const time_dependency = futurePatterns.some((pattern) =>
      pattern.test(lowerText),
    );

    return {
      uses_desire_language,
      authority_missing,
      time_dependency,
    };
  }

  /**
   * Step 2: Evaluate Kundli Support for Manifestation Goal
   * Analyzes planetary positions to determine support level
   */
  evaluateKundliSupport(
    manifestation: Manifestation,
    kundli: Kundli,
    planets: KundliPlanet[],
    houses: KundliHouse[],
  ): KundliAlignmentProfile {
    // Determine goal type from category or description
    const goalType = this.determineGoalType(manifestation);

    // Initialize profile with defaults
    const profile: KundliAlignmentProfile = {
      sun_support: 'weak',
      saturn_support: 'weak',
      moon_stability: 'unstable',
      jupiter_guidance: false,
      rahu_support: 'weak',
    };

    // Find planets in kundli
    const sunPlanet = planets.find((p) => p.planet_name.toLowerCase() === 'sun');
    const saturnPlanet = planets.find(
      (p) => p.planet_name.toLowerCase() === 'saturn',
    );
    const moonPlanet = planets.find((p) => p.planet_name.toLowerCase() === 'moon');
    const jupiterPlanet = planets.find(
      (p) => p.planet_name.toLowerCase() === 'jupiter',
    );
    const rahuPlanet = planets.find((p) => p.planet_name.toLowerCase() === 'rahu');

    // Evaluate Sun support (Authority/Politics)
    if (sunPlanet) {
      profile.sun_support = this.evaluatePlanetStrength(
        sunPlanet,
        goalType === 'authority' || goalType === 'politics',
      );
    }

    // Evaluate Saturn support (Discipline/Longevity)
    if (saturnPlanet) {
      profile.saturn_support = this.evaluatePlanetStrength(
        saturnPlanet,
        goalType === 'authority' || goalType === 'longevity',
      );
    }

    // Evaluate Moon stability
    if (moonPlanet) {
      // Moon in strong houses (1, 4, 7, 10) = stable
      const strongHouses = [1, 4, 7, 10];
      profile.moon_stability = strongHouses.includes(moonPlanet.house_number)
        ? 'stable'
        : 'unstable';
    }

    // Evaluate Jupiter guidance
    if (jupiterPlanet) {
      // Jupiter in good houses (1, 2, 4, 5, 7, 9, 10, 11) = guidance available
      const goodHouses = [1, 2, 4, 5, 7, 9, 10, 11];
      profile.jupiter_guidance = goodHouses.includes(jupiterPlanet.house_number);
    }

    // Evaluate Rahu support (Public Acceptance)
    if (rahuPlanet) {
      profile.rahu_support = this.evaluatePlanetStrength(
        rahuPlanet,
        goalType === 'leadership' || goalType === 'public',
      );
    }

    return profile;
  }

  /**
   * Determine goal type from manifestation category or description
   */
  private determineGoalType(manifestation: Manifestation): string {
    const category = manifestation.category?.toLowerCase() || '';
    const description = (manifestation.description || '').toLowerCase();
    const title = (manifestation.title || '').toLowerCase();

    const combined = `${category} ${description} ${title}`;

    // Authority/Politics patterns
    if (
      /(pm|cm|minister|president|leader|authority|political|government)/i.test(
        combined,
      )
    ) {
      return 'authority';
    }

    // Leadership patterns
    if (/(lead|leadership|mass|public|people|followers)/i.test(combined)) {
      return 'leadership';
    }

    // Public acceptance patterns
    if (/(famous|popular|recognized|accepted|known)/i.test(combined)) {
      return 'public';
    }

    // Longevity patterns
    if (/(long|sustain|endure|lasting|permanent)/i.test(combined)) {
      return 'longevity';
    }

    // Default based on category
    return category || 'general';
  }

  /**
   * Evaluate planet strength based on house position
   */
  private evaluatePlanetStrength(
    planet: KundliPlanet,
    isRelevant: boolean,
  ): 'strong' | 'medium' | 'weak' {
    if (!isRelevant) {
      return 'weak';
    }

    // Strong houses: 1, 4, 5, 7, 9, 10, 11
    const strongHouses = [1, 4, 5, 7, 9, 10, 11];
    // Medium houses: 2, 3, 6, 8
    const mediumHouses = [2, 3, 6, 8];
    // Weak houses: 12

    if (strongHouses.includes(planet.house_number)) {
      return 'strong';
    } else if (mediumHouses.includes(planet.house_number)) {
      return 'medium';
    } else {
      return 'weak';
    }
  }

  /**
   * Step 3: Rewrite Manifestation Text
   * Transforms weak language into aligned language based on Kundli profile
   */
  rewriteManifestationText(
    originalText: string,
    kundliProfile: KundliAlignmentProfile,
  ): string {
    let rewritten = originalText.trim();

    // Replace desire language with identity language
    rewritten = rewritten.replace(
      /\b(i want to|i hope to|i wish to|i desire to)\b/gi,
      'i am',
    );
    rewritten = rewritten.replace(/\b(i want|i hope|i wish)\b/gi, 'i am');
    rewritten = rewritten.replace(/\b(want to|hope to|wish to)\b/gi, 'am');

    // Add process words if Saturn is strong
    if (kundliProfile.saturn_support === 'strong') {
      if (!/(discipline|patience|responsibility|service|duty)/i.test(rewritten)) {
        rewritten = this.addProcessWords(rewritten, 'saturn');
      }
    }

    // Add service words if Jupiter is present
    if (kundliProfile.jupiter_guidance) {
      if (!/(service|guidance|wisdom|teaching|helping)/i.test(rewritten)) {
        rewritten = this.addProcessWords(rewritten, 'jupiter');
      }
    }

    // Remove emotional dependency if Moon is unstable
    if (kundliProfile.moon_stability === 'unstable') {
      rewritten = rewritten.replace(
        /\b(i feel|i feel like|feeling|emotionally)\b/gi,
        '',
      );
      rewritten = rewritten.replace(/\s+/g, ' ').trim();
    }

    // Add authority language if Sun is strong
    if (kundliProfile.sun_support === 'strong') {
      if (!/(lead|authority|responsibility|command)/i.test(rewritten)) {
        rewritten = this.addProcessWords(rewritten, 'sun');
      }
    }

    // Remove heavy future dependency
    rewritten = rewritten.replace(/\b(in \d{4}|by \d{4})\b/gi, '');
    rewritten = rewritten.replace(/\b(someday|one day|eventually)\b/gi, '');
    rewritten = rewritten.replace(/\s+/g, ' ').trim();

    // Ensure present-tense identity
    if (!/\b(i am|i'm|am becoming|am growing)\b/i.test(rewritten)) {
      rewritten = `I am ${rewritten.toLowerCase()}`;
      // Capitalize first letter
      rewritten = rewritten.charAt(0).toUpperCase() + rewritten.slice(1);
    }

    return rewritten;
  }

  /**
   * Add process words based on planetary influence
   */
  private addProcessWords(text: string, planet: 'saturn' | 'jupiter' | 'sun'): string {
    const words = {
      saturn: ['through discipline', 'with patience', 'through responsibility'],
      jupiter: ['through service', 'with wisdom', 'by helping others'],
      sun: ['with authority', 'through leadership', 'by taking responsibility'],
    };

    const selectedWords = words[planet];
    const randomIndex = Math.floor(text.length % selectedWords.length); // Deterministic
    const phrase = selectedWords[randomIndex];

    // Add phrase before the last sentence or at the end
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
    if (sentences.length > 0) {
      const lastSentence = sentences[sentences.length - 1].trim();
      sentences[sentences.length - 1] = `${lastSentence} ${phrase}.`;
      return sentences.join('. ').trim();
    }

    return `${text} ${phrase}.`;
  }

  /**
   * Step 4: Apply Safe Response Update
   * Updates only allowed fields without changing structure
   */
  applySafeResponseUpdate(
    manifestation: Manifestation,
    rewrittenTitle: string,
    rewrittenDescription: string,
    kundliProfile: KundliAlignmentProfile,
    alignmentImprovement: number,
  ): Partial<Manifestation> {
    const updates: Partial<Manifestation> = {};

    // Update title if rewritten
    if (rewrittenTitle !== manifestation.title) {
      updates.title = rewrittenTitle;
    }

    // Update description if rewritten
    if (rewrittenDescription !== manifestation.description) {
      updates.description = rewrittenDescription;
    }

    // Update alignment_score (increase if alignment improved)
    if (alignmentImprovement > 0) {
      const currentAlignment = manifestation.alignment_score || 0;
      const newAlignment = Math.min(
        100,
        Math.max(0, currentAlignment + alignmentImprovement),
      );
      updates.alignment_score = newAlignment;
    }

    // Update coherence_score (increase if alignment improved)
    if (alignmentImprovement > 0) {
      const currentCoherence = manifestation.coherence_score || 0;
      const coherenceIncrease = Math.floor(alignmentImprovement * 0.5);
      const newCoherence = Math.min(
        100,
        Math.max(0, currentCoherence + coherenceIncrease),
      );
      updates.coherence_score = newCoherence;
    }

    // Update tips.rituals (add Kundli-aligned ritual)
    const currentTips = manifestation.tips || {};
    const newRituals = [...(currentTips.rituals || [])];
    const kundliRitual = this.generateKundliAlignedRitual(kundliProfile);
    if (kundliRitual && !newRituals.includes(kundliRitual)) {
      newRituals.push(kundliRitual);
    }

    // Update tips.thought_alignment (add Kundli-aligned thought)
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

    // Update insights.ai_narrative (enhance with Kundli alignment info)
    const currentInsights = manifestation.insights || {};
    const enhancedNarrative = this.enhanceNarrative(
      currentInsights.ai_narrative || '',
      kundliProfile,
    );
    updates.insights = {
      ...currentInsights,
      ai_narrative: enhancedNarrative,
    };

    // Update summary_for_ui
    const enhancedSummary = this.generateSummaryForUI(
      kundliProfile,
      alignmentImprovement,
    );
    updates.insights = {
      ...(updates.insights || currentInsights),
      summary_for_ui: enhancedSummary,
    };

    return updates;
  }

  /**
   * Generate Kundli-aligned ritual
   */
  private generateKundliAlignedRitual(
    profile: KundliAlignmentProfile,
  ): string | null {
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

  /**
   * Generate Kundli-aligned thought
   */
  private generateKundliAlignedThought(profile: KundliAlignmentProfile): string | null {
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

  /**
   * Enhance narrative with Kundli alignment information
   */
  private enhanceNarrative(
    existingNarrative: string,
    profile: KundliAlignmentProfile,
  ): string {
    if (!existingNarrative) {
      return '';
    }

    const enhancements: string[] = [];

    if (profile.sun_support === 'strong') {
      enhancements.push('Your Kundli shows strong Sun support for authority and leadership.');
    }
    if (profile.saturn_support === 'strong') {
      enhancements.push(
        'Saturn indicates that success will come through discipline and long-term commitment.',
      );
    }
    if (profile.jupiter_guidance) {
      enhancements.push(
        'Jupiter supports your goal through service and ethical action.',
      );
    }
    if (profile.moon_stability === 'unstable') {
      enhancements.push(
        'Focus on consistent action rather than emotional fluctuations.',
      );
    }

    if (enhancements.length > 0) {
      return `${existingNarrative} ${enhancements.join(' ')}`;
    }

    return existingNarrative;
  }

  /**
   * Generate summary for UI
   */
  private generateSummaryForUI(
    profile: KundliAlignmentProfile,
    alignmentImprovement: number,
  ): string {
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

  /**
   * Main Analysis Function
   * Analyzes manifestation text and returns improvement recommendations
   */
  analyzeManifestationText(
    manifestation: Manifestation,
    kundli: Kundli | null,
    planets: KundliPlanet[],
    houses: KundliHouse[],
  ): {
    shouldRewrite: boolean;
    rewrittenTitle?: string;
    rewrittenDescription?: string;
    alignmentImprovement: number;
    kundliProfile?: KundliAlignmentProfile;
  } {
    // If no kundli, return no changes
    if (!kundli || planets.length === 0) {
      return {
        shouldRewrite: false,
        alignmentImprovement: 0,
      };
    }

    // Step 1: Detect weakness
    const weakness = this.detectManifestationWeakness(
      manifestation.description || manifestation.title,
    );

    // If no weakness detected, no rewrite needed
    if (
      !weakness.uses_desire_language &&
      !weakness.authority_missing &&
      !weakness.time_dependency
    ) {
      return {
        shouldRewrite: false,
        alignmentImprovement: 0,
      };
    }

    // Step 2: Evaluate Kundli support
    const kundliProfile = this.evaluateKundliSupport(
      manifestation,
      kundli,
      planets,
      houses,
    );

    // Step 3: Rewrite text
    const rewrittenTitle = this.rewriteManifestationText(
      manifestation.title,
      kundliProfile,
    );
    const rewrittenDescription = this.rewriteManifestationText(
      manifestation.description,
      kundliProfile,
    );

    // Step 4: Calculate alignment improvement
    let alignmentImprovement = 0;

    // Base improvement for removing weakness
    if (weakness.uses_desire_language) alignmentImprovement += 5;
    if (weakness.authority_missing) alignmentImprovement += 5;
    if (weakness.time_dependency) alignmentImprovement += 3;

    // Additional improvement based on Kundli alignment
    if (kundliProfile.sun_support === 'strong') alignmentImprovement += 5;
    if (kundliProfile.saturn_support === 'strong') alignmentImprovement += 5;
    if (kundliProfile.jupiter_guidance) alignmentImprovement += 3;
    if (kundliProfile.moon_stability === 'stable') alignmentImprovement += 2;

    // Cap improvement at 20 points
    alignmentImprovement = Math.min(20, alignmentImprovement);

    return {
      shouldRewrite: true,
      rewrittenTitle,
      rewrittenDescription,
      alignmentImprovement,
      kundliProfile,
    };
  }
}


