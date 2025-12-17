import { Injectable, Logger, Inject } from '@nestjs/common';
import { IKarmaRepository } from '../../core/interfaces/repositories/karma-repository.interface';

export interface KarmaStreak {
  current_streak_days: number;
  longest_streak_days: number;
  level: 'awaken' | 'builder' | 'pro' | 'master';
  level_name: string; // 'Sattvik', 'Disciplined Bhakt', etc.
  next_level_threshold: number;
  progress_to_next_level: number; // 0-100
}

/**
 * Service for calculating karma streaks and levels
 */
@Injectable()
export class KarmaStreakService {
  private readonly logger = new Logger(KarmaStreakService.name);

  constructor(
    @Inject('IKarmaRepository')
    private readonly karmaRepository: IKarmaRepository,
  ) {}

  /**
   * Calculate streak for a user
   */
  async calculateStreak(userId: number): Promise<KarmaStreak> {
    const allEntries = await this.karmaRepository.findByUserId(userId);
    
    // Sort by date descending
    const sortedEntries = allEntries
      .filter(e => !e.is_deleted)
      .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

    // Calculate current streak (consecutive days with at least one entry)
    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.entry_date);
      entryDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((checkDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === currentStreak) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (daysDiff > currentStreak) {
        break; // Streak broken
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.entry_date);
      entryDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        tempStreak = 1;
        lastDate = entryDate;
      } else {
        const daysDiff = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          tempStreak++;
        } else if (daysDiff > 1) {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
        lastDate = entryDate;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Determine level based on streak and karma score
    const level = this.determineLevel(currentStreak, longestStreak);
    const levelInfo = this.getLevelInfo(level);

    return {
      current_streak_days: currentStreak,
      longest_streak_days: longestStreak,
      level: level.level,
      level_name: levelInfo.name,
      next_level_threshold: levelInfo.nextThreshold,
      progress_to_next_level: levelInfo.progress,
    };
  }

  /**
   * Determine karma level based on streaks
   */
  private determineLevel(
    currentStreak: number,
    longestStreak: number,
  ): { level: 'awaken' | 'builder' | 'pro' | 'master'; score: number } {
    // Level determination based on streaks
    // Awaken: 0-6 days
    // Builder: 7-29 days
    // Pro: 30-89 days
    // Master: 90+ days

    const maxStreak = Math.max(currentStreak, longestStreak);

    if (maxStreak >= 90) {
      return { level: 'master', score: 100 };
    } else if (maxStreak >= 30) {
      return { level: 'pro', score: 75 };
    } else if (maxStreak >= 7) {
      return { level: 'builder', score: 50 };
    } else {
      return { level: 'awaken', score: 25 };
    }
  }

  /**
   * Get level information (name, thresholds, progress)
   */
  private getLevelInfo(level: { level: string; score: number }): {
    name: string;
    nextThreshold: number;
    progress: number;
  } {
    const levels = {
      awaken: { name: 'Awaken', next: 7, current: 0 },
      builder: { name: 'Disciplined Bhakt', next: 30, current: 7 },
      pro: { name: 'Karma Yogi', next: 90, current: 30 },
      master: { name: 'Sattvik', next: 999, current: 90 },
    };

    const levelData = levels[level.level as keyof typeof levels] || levels.awaken;
    const progress = level.level === 'master' 
      ? 100 
      : Math.min(100, Math.round((level.score / levelData.next) * 100));

    return {
      name: levelData.name,
      nextThreshold: levelData.next,
      progress,
    };
  }
}

