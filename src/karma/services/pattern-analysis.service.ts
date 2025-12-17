import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KarmaEntry } from '../entities/karma-entry.entity';
import { KarmaPattern } from '../entities/karma-pattern.entity';
import { IKarmaRepository } from '../../core/interfaces/repositories/karma-repository.interface';

export interface PatternAnalysisResult {
  detected_patterns: Array<{
    pattern_key: string;
    pattern_name: string;
    pattern_type: 'good' | 'bad' | 'neutral';
    frequency: number;
    total_impact: number;
    first_detected: Date;
    last_detected: Date;
    sample_actions: string[];
  }>;
  strengths: string[]; // Good patterns
  weaknesses: string[]; // Bad patterns
  dominant_emotion: string;
  behavioral_insights: string;
}

@Injectable()
export class PatternAnalysisService {
  private readonly logger = new Logger(PatternAnalysisService.name);

  constructor(
    @Inject('IKarmaRepository')
    private readonly karmaRepository: IKarmaRepository,
    @InjectRepository(KarmaPattern)
    private readonly patternRepository: Repository<KarmaPattern>,
  ) {}

  /**
   * Analyze user's karma patterns
   */
  async analyzeUserPatterns(userId: number): Promise<PatternAnalysisResult> {
    const entries = await this.karmaRepository.findByUserId(userId);

    // Group entries by pattern
    const patternMap = new Map<string, {
      pattern_key: string;
      pattern_name: string;
      pattern_type: 'good' | 'bad' | 'neutral';
      frequency: number;
      total_impact: number;
      first_detected: Date;
      last_detected: Date;
      sample_actions: string[];
    }>();

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

      const pattern = patternMap.get(patternKey)!;
      pattern.frequency++;
      pattern.total_impact += score;

      const entryDate = new Date(entry.entry_date);
      if (entryDate < pattern.first_detected) {
        pattern.first_detected = entryDate;
      }
      if (entryDate > pattern.last_detected) {
        pattern.last_detected = entryDate;
      }

      // Store sample actions (max 5)
      if (pattern.sample_actions.length < 5) {
        pattern.sample_actions.push(entry.text.substring(0, 100));
      }
    }

    const detectedPatterns = Array.from(patternMap.values())
      .sort((a, b) => b.frequency - a.frequency);

    // Identify strengths and weaknesses
    const strengths = detectedPatterns
      .filter((p) => p.pattern_type === 'good' && p.frequency >= 3)
      .map((p) => p.pattern_name);

    const weaknesses = detectedPatterns
      .filter((p) => p.pattern_type === 'bad' && p.frequency >= 2)
      .map((p) => p.pattern_name);

    // Find dominant emotion
    const dominantPattern = detectedPatterns[0];
    const dominantEmotion = dominantPattern ? dominantPattern.pattern_key : 'neutral';

    // Generate behavioral insights
    const behavioralInsights = this.generateBehavioralInsights(detectedPatterns, strengths, weaknesses);

    // Save patterns to database
    await this.savePatternsToDatabase(userId, detectedPatterns);

    return {
      detected_patterns: detectedPatterns,
      strengths,
      weaknesses,
      dominant_emotion: dominantEmotion,
      behavioral_insights: behavioralInsights,
    };
  }

  /**
   * Generate behavioral insights text
   */
  private generateBehavioralInsights(
    patterns: Array<{
      pattern_key: string;
      pattern_name: string;
      pattern_type: 'good' | 'bad' | 'neutral';
      frequency: number;
    }>,
    strengths: string[],
    weaknesses: string[],
  ): string {
    const insights: string[] = [];

    if (strengths.length > 0) {
      insights.push(
        `You show strong patterns of ${strengths.join(', ')}. These are your key strengths that contribute positively to your karma.`,
      );
    }

    if (weaknesses.length > 0) {
      insights.push(
        `Areas for improvement include ${weaknesses.join(', ')}. These patterns appear frequently and may be impacting your overall karma score.`,
      );
    }

    const topPattern = patterns[0];
    if (topPattern) {
      if (topPattern.pattern_type === 'good') {
        insights.push(
          `Your most common behavior is "${topPattern.pattern_name}" (appeared ${topPattern.frequency} times), which is excellent for your spiritual growth.`,
        );
      } else {
        insights.push(
          `Your most common behavior is "${topPattern.pattern_name}" (appeared ${topPattern.frequency} times). Consider focusing on transforming this pattern.`,
        );
      }
    }

    if (insights.length === 0) {
      insights.push(
        'You have a balanced karma profile. Continue maintaining awareness of your actions and their impact.',
      );
    }

    return insights.join(' ');
  }

  /**
   * Save detected patterns to database
   */
  private async savePatternsToDatabase(
    userId: number,
    patterns: Array<{
      pattern_key: string;
      pattern_name: string;
      pattern_type: 'good' | 'bad' | 'neutral';
      frequency: number;
      total_impact: number;
      first_detected: Date;
      last_detected: Date;
      sample_actions: string[];
    }>,
  ): Promise<void> {
    for (const pattern of patterns) {
      // Check if pattern already exists
      const existing = await this.patternRepository.findOne({
        where: {
          user_id: userId,
          pattern_key: pattern.pattern_key,
        },
        order: { detected_date: 'DESC' },
      });

      if (existing) {
        // Update existing pattern
        existing.frequency_count = pattern.frequency;
        existing.total_score_impact = pattern.total_impact;
        existing.last_detected_date = pattern.last_detected;
        existing.sample_actions = pattern.sample_actions;
        await this.patternRepository.save(existing);
      } else {
        // Create new pattern
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

  /**
   * Get user's pattern history
   */
  async getUserPatterns(userId: number): Promise<KarmaPattern[]> {
    return this.patternRepository.find({
      where: { user_id: userId },
      order: { frequency_count: 'DESC' },
    });
  }
}

