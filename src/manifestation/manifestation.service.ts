import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ManifestationLog } from './entities/manifestation-log.entity';
import { CreateManifestationDto } from './dto/create-manifestation.dto';
import { SwissEphemerisService } from '../astrology/services/swiss-ephemeris.service';
import { User } from '../users/entities/user.entity';
import { ConstantsService } from '../common/constants/constants.service';

@Injectable()
export class ManifestationService {
  constructor(
    @InjectRepository(ManifestationLog)
    private manifestationRepository: Repository<ManifestationLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private swissEphemerisService: SwissEphemerisService,
    private constantsService: ConstantsService,
  ) {}

  /**
   * Create a new manifestation
   * Calculates MFP score, clarity, coherence, and astro index
   */
  async createManifestation(
    userId: number,
    dto: CreateManifestationDto,
  ): Promise<ManifestationLog> {
    if (!dto.title || dto.title.trim().length === 0) {
      throw new BadRequestException('Manifestation title is required');
    }

    // Get user for birth data (if available)
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    // Calculate clarity (linguistic clarity)
    const clarity = await this.calculateClarity(dto.title);

    // Calculate coherence (emotional coherence)
    const coherence = await this.calculateCoherence(dto.title);

    // Calculate MFP score (Manifestation Probability Score)
    const mfpScore = (clarity + coherence) / 2;

    // Calculate astro index (astrological resonance)
    // TODO: Use Swiss Ephemeris to calculate current planetary positions
    // and compare with user's birth chart for resonance
    const astroIndex = await this.calculateAstroIndex(user, dto.title);

    // Calculate best manifestation date (optional)
    const bestManifestationDate = await this.calculateBestManifestationDate(
      user,
      astroIndex,
    );

    // Create manifestation entry
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

  /**
   * Get all manifestations for a user
   */
  async getUserManifestations(userId: number): Promise<ManifestationLog[]> {
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

  /**
   * Get a single manifestation by ID
   */
  async getManifestationById(
    userId: number,
    manifestationId: number,
  ): Promise<ManifestationLog> {
    const manifestation = await this.manifestationRepository.findOne({
      where: {
        id: manifestationId,
        user_id: userId,
        is_deleted: false,
      },
    });

    if (!manifestation) {
      throw new NotFoundException('Manifestation not found');
    }

    return manifestation;
  }

  /**
   * Update a manifestation (e.g., lock it)
   */
  async updateManifestation(
    userId: number,
    manifestationId: number,
    updateData: Partial<{ is_locked: boolean; metadata: Record<string, any> }>,
  ): Promise<ManifestationLog> {
    const manifestation = await this.getManifestationById(userId, manifestationId);

    if (updateData.is_locked !== undefined) {
      // Store in metadata for now (can add column later if needed)
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

  /**
   * Delete a manifestation (soft delete)
   */
  async deleteManifestation(userId: number, manifestationId: number): Promise<void> {
    const manifestation = await this.getManifestationById(userId, manifestationId);
    manifestation.is_deleted = true;
    await this.manifestationRepository.save(manifestation);
  }

  /**
   * Calculate linguistic clarity (0-100)
   */
  private async calculateClarity(text: string): Promise<number> {
    // Simple clarity calculation based on:
    // - Sentence structure
    // - Word choice
    // - Specificity
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);

    // Ideal: 10-20 words per sentence
    let clarity = 70; // Base score

    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
      clarity += 15;
    } else if (avgWordsPerSentence < 5 || avgWordsPerSentence > 30) {
      clarity -= 20;
    }

    // Check for specific words (more specific = higher clarity) - from ConstantsService
    const specificIndicators = await this.constantsService.getSpecificIndicators();
    const hasSpecificLanguage = specificIndicators.some(indicator =>
      text.toLowerCase().includes(indicator.toLowerCase()),
    );

    if (hasSpecificLanguage) {
      clarity += 10;
    }

    // Check for vague words (reduces clarity) - from ConstantsService
    const vagueWords = await this.constantsService.getVagueWords();
    const hasVagueLanguage = vagueWords.some(word =>
      text.toLowerCase().includes(word.toLowerCase()),
    );

    if (hasVagueLanguage) {
      clarity -= 15;
    }

    return Math.max(0, Math.min(100, clarity));
  }

  /**
   * Calculate emotional coherence (0-100)
   */
  private async calculateCoherence(text: string): Promise<number> {
    // Simple coherence calculation based on:
    // - Positive vs negative language
    // - Emotional alignment
    // - Confidence indicators
    const lowerText = text.toLowerCase();

    let coherence = 60; // Base score

    // Positive language increases coherence (from ConstantsService - no hardcoded words)
    const positiveWords = await this.constantsService.getPositiveManifestationWords();
    const negativeWords = await this.constantsService.getNegativeManifestationWords();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    coherence += positiveCount * 5;

    // Negative language decreases coherence
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    coherence -= negativeCount * 10;

    // Confidence indicators
    if (lowerText.includes('i am') || lowerText.includes('i will')) {
      coherence += 10;
    }

    // Doubt indicators
    if (lowerText.includes('i hope') || lowerText.includes('i wish') || lowerText.includes('if only')) {
      coherence -= 10;
    }

    return Math.max(0, Math.min(100, coherence));
  }

  /**
   * Calculate astrological resonance index (0-1)
   */
  private async calculateAstroIndex(
    user: User | null,
    desireText: string,
  ): Promise<number> {
    // TODO: Use Swiss Ephemeris to:
    // 1. Get current planetary positions
    // 2. Get user's birth chart (if available)
    // 3. Calculate transits and aspects
    // 4. Determine astrological support for manifestation

    // For now, return a placeholder value
    // In production, this should use the Swiss Ephemeris service
    if (!user) {
      return 0.5; // Default if no user data
    }

    // Stub: Calculate based on current date and desire keywords
    const currentDate = new Date();
    const dayOfYear = Math.floor(
      (currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Simple calculation based on day of year (placeholder)
    // Real implementation should use Swiss Ephemeris
    const baseIndex = 0.4 + (Math.sin((dayOfYear / 365) * 2 * Math.PI) * 0.2);

    return Math.max(0, Math.min(1, baseIndex));
  }

  /**
   * Calculate best manifestation date
   */
  private async calculateBestManifestationDate(
    user: User | null,
    astroIndex: number,
  ): Promise<Date | null> {
    // TODO: Use Swiss Ephemeris to find optimal dates based on:
    // - Planetary transits
    // - Moon phases
    // - User's birth chart aspects

    // For now, return a date 30 days from now if astro index is high
    if (astroIndex > 0.6) {
      const bestDate = new Date();
      bestDate.setDate(bestDate.getDate() + 30);
      return bestDate;
    }

    return null;
  }

  /**
   * Get clarity breakdown
   */
  private getClarityBreakdown(text: string): any {
    return {
      word_count: text.split(/\s+/).length,
      sentence_count: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
      has_specific_language: true, // TODO: Implement proper detection
    };
  }

  /**
   * Get coherence breakdown
   */
  private getCoherenceBreakdown(text: string): any {
    return {
      positive_language_score: 0.7, // TODO: Calculate properly
      confidence_score: 0.6, // TODO: Calculate properly
    };
  }

  /**
   * Get astrological support description
   */
  private getAstroSupport(astroIndex: number): string {
    if (astroIndex >= 0.7) {
      return 'Strong astrological support for manifestation';
    } else if (astroIndex >= 0.5) {
      return 'Moderate astrological support';
    } else if (astroIndex >= 0.3) {
      return 'Weak astrological support';
    } else {
      return 'Limited astrological support - consider waiting for better timing';
    }
  }
}

