import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Customer } from '../../users/entities/customer.entity';
import { IKarmaRepository } from '../../core/interfaces/repositories/karma-repository.interface';
import { KarmaScoreService } from '../../karma/services/karma-score.service';
import { ManifestationLog } from '../../manifestation/entities/manifestation-log.entity';

export interface TwinState {
  energy: number; // 0-100
  mood: string; // 'positive', 'neutral', 'negative'
  alignment: number; // 0-100 (karma-manifestation alignment)
  aura: {
    color: string; // 'gold', 'blue', 'green', 'red', etc.
    intensity: number; // 0-100
    evolution_level: string; // 'awaken', 'builder', 'pro', 'master'
  };
  karma_score: number; // Current karma score
  mfp_score: number | null; // Average MFP from recent manifestations
  highlights: {
    recent_achievement?: string;
    karma_trend?: 'improving' | 'declining' | 'stable';
    manifestation_progress?: number; // % of manifestations locked/fulfilled
  };
  last_updated: Date;
}

@Injectable()
export class TwinStateService {
  private readonly logger = new Logger(TwinStateService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @Inject('IKarmaRepository')
    private readonly karmaRepository: IKarmaRepository,
    @InjectRepository(ManifestationLog)
    private readonly manifestationRepository: Repository<ManifestationLog>,
    private readonly karmaScoreService: KarmaScoreService,
  ) {}

  /**
   * Get comprehensive twin state for a user
   * Calculates energy, mood, alignment, aura based on karma and manifestations
   */
  async getTwinState(userId: number): Promise<TwinState> {
    // Get karma score
    const karmaScore = await this.karmaScoreService.calculateUserKarmaScore(userId);

    // Get recent manifestations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentManifestations = await this.manifestationRepository.find({
      where: {
        user_id: userId,
        is_deleted: false,
        added_date: MoreThanOrEqual(thirtyDaysAgo),
      },
      order: { added_date: 'DESC' },
      take: 10,
    });

    // Calculate average MFP
    const avgMfp = recentManifestations.length > 0
      ? recentManifestations.reduce((sum, m) => sum + (Number(m.manifestation_probability) || 0), 0) / recentManifestations.length
      : null;

    // Calculate energy (based on karma score and recent activity)
    const energy = this.calculateEnergy(karmaScore.karma_score, karmaScore.trend_percentage);

    // Determine mood (based on karma trend and recent actions)
    const mood = this.determineMood(karmaScore.trend, karmaScore.good_actions_count, karmaScore.bad_actions_count);

    // Calculate alignment (karma-manifestation alignment)
    const alignment = this.calculateAlignment(karmaScore.karma_score, avgMfp);

    // Determine aura
    const aura = this.determineAura(karmaScore.karma_score, karmaScore.trend, avgMfp);

    // Get highlights
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

  /**
   * Calculate energy level (0-100)
   */
  private calculateEnergy(karmaScore: number, trendPercentage: number): number {
    // Base energy from karma score
    let energy = karmaScore;
    
    // Adjust based on trend
    if (trendPercentage > 0) {
      energy += Math.min(10, trendPercentage * 0.1); // Boost for positive trend
    } else if (trendPercentage < 0) {
      energy += Math.max(-10, trendPercentage * 0.1); // Reduce for negative trend
    }

    return Math.max(0, Math.min(100, energy));
  }

  /**
   * Determine mood based on karma trends
   */
  private determineMood(
    trend: 'improving' | 'declining' | 'stable',
    goodCount: number,
    badCount: number,
  ): 'positive' | 'neutral' | 'negative' {
    if (trend === 'improving' && goodCount > badCount) {
      return 'positive';
    } else if (trend === 'declining' && badCount > goodCount) {
      return 'negative';
    }
    return 'neutral';
  }

  /**
   * Calculate alignment between karma and manifestations (0-100)
   */
  private calculateAlignment(karmaScore: number, avgMfp: number | null): number {
    if (avgMfp === null) {
      return 50; // Neutral if no manifestations
    }

    // Alignment is higher when karma score and MFP are both high
    // Formula: weighted average
    const karmaWeight = 0.6;
    const mfpWeight = 0.4;
    
    return (karmaScore * karmaWeight) + (avgMfp * 100 * mfpWeight);
  }

  /**
   * Determine aura color and evolution level
   */
  private determineAura(
    karmaScore: number,
    trend: 'improving' | 'declining' | 'stable',
    avgMfp: number | null,
  ): { color: string; intensity: number; evolution_level: string } {
    let color = 'blue'; // Default
    let intensity = 50;
    let evolution_level = 'awaken';

    // Determine color based on karma score
    if (karmaScore >= 80) {
      color = 'gold';
      evolution_level = 'master';
      intensity = 90;
    } else if (karmaScore >= 65) {
      color = 'green';
      evolution_level = 'pro';
      intensity = 75;
    } else if (karmaScore >= 50) {
      color = 'blue';
      evolution_level = 'builder';
      intensity = 60;
    } else {
      color = 'gray';
      evolution_level = 'awaken';
      intensity = 40;
    }

    // Adjust intensity based on trend
    if (trend === 'improving') {
      intensity = Math.min(100, intensity + 10);
    } else if (trend === 'declining') {
      intensity = Math.max(20, intensity - 10);
    }

    // Boost if high MFP
    if (avgMfp && avgMfp > 0.7) {
      intensity = Math.min(100, intensity + 5);
      if (color === 'blue') color = 'green';
    }

    return { color, intensity, evolution_level };
  }

  /**
   * Get highlights for twin state
   */
  private async getHighlights(
    userId: number,
    karmaScore: any,
    manifestations: ManifestationLog[],
  ): Promise<TwinState['highlights']> {
    const highlights: TwinState['highlights'] = {};

    // Karma trend
    highlights.karma_trend = karmaScore.trend;

    // Manifestation progress
    if (manifestations.length > 0) {
      const lockedCount = manifestations.filter(m => m.metadata?.locked === true).length;
      highlights.manifestation_progress = Math.round((lockedCount / manifestations.length) * 100);
    }

    // Recent achievement (if karma score improved significantly)
    if (karmaScore.trend === 'improving' && karmaScore.trend_percentage > 5) {
      highlights.recent_achievement = 'Your karma is improving! Keep up the positive actions.';
    }

    return highlights;
  }
}

