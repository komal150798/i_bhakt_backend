import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KarmaHabitSuggestion } from '../entities/karma-habit-suggestion.entity';
import { PatternAnalysisResult } from './pattern-analysis.service';

export interface HabitRecommendation {
  habit_id: number;
  habit_title: string;
  habit_description: string;
  priority: number;
  duration_days: number;
  daily_tasks: string[];
  motivational_message: string;
  pattern_key: string;
  pattern_name: string;
}

export interface HabitPlan {
  user_id: number;
  plan_duration_days: number;
  start_date: Date;
  end_date: Date;
  habits: HabitRecommendation[];
  daily_schedule: Array<{
    day: number;
    date: Date;
    tasks: Array<{
      habit_title: string;
      task: string;
    }>;
  }>;
  motivational_quote: string;
}

@Injectable()
export class HabitRecommendationService {
  private readonly logger = new Logger(HabitRecommendationService.name);

  constructor(
    @InjectRepository(KarmaHabitSuggestion)
    private readonly habitRepository: Repository<KarmaHabitSuggestion>,
  ) {}

  /**
   * Generate personalized habit improvement plan based on patterns
   */
  async generateHabitPlan(
    userId: number,
    patternAnalysis: PatternAnalysisResult,
  ): Promise<HabitPlan> {
    const recommendations: HabitRecommendation[] = [];

    // Get habits for weaknesses (bad patterns)
    for (const weakness of patternAnalysis.weaknesses) {
      const habits = await this.getHabitsForPattern(weakness);
      recommendations.push(...habits);
    }

    // If no weaknesses, suggest general improvement habits
    if (recommendations.length === 0) {
      const generalHabits = await this.getHabitsForPattern('general');
      recommendations.push(...generalHabits.slice(0, 3));
    }

    // Sort by priority
    recommendations.sort((a, b) => a.priority - b.priority);

    // Take top 3-5 habits
    const selectedHabits = recommendations.slice(0, 5);

    // Generate 30-day plan
    const planDuration = 30;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + planDuration);

    const dailySchedule = this.generateDailySchedule(selectedHabits, startDate, planDuration);

    return {
      user_id: userId,
      plan_duration_days: planDuration,
      start_date: startDate,
      end_date: endDate,
      habits: selectedHabits,
      daily_schedule: dailySchedule,
      motivational_quote: this.getMotivationalQuote(patternAnalysis),
    };
  }

  /**
   * Get habit suggestions for a specific pattern
   */
  private async getHabitsForPattern(patternKey: string): Promise<HabitRecommendation[]> {
    const habits = await this.habitRepository.find({
      where: {
        pattern_key: patternKey,
        is_active: true,
      },
      order: { priority: 'ASC' },
      take: 3,
    });

    return habits.map((habit) => ({
      habit_id: habit.id,
      habit_title: habit.habit_title,
      habit_description: habit.habit_description,
      priority: habit.priority,
      duration_days: habit.duration_days,
      daily_tasks: habit.daily_tasks || [],
      motivational_message: habit.motivational_message || '',
      pattern_key: habit.pattern_key,
      pattern_name: patternKey,
    }));
  }

  /**
   * Generate daily schedule for habit plan
   */
  private generateDailySchedule(
    habits: HabitRecommendation[],
    startDate: Date,
    durationDays: number,
  ): Array<{
    day: number;
    date: Date;
    tasks: Array<{ habit_title: string; task: string }>;
  }> {
    const schedule: Array<{
      day: number;
      date: Date;
      tasks: Array<{ habit_title: string; task: string }>;
    }> = [];

    for (let day = 1; day <= durationDays; day++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + day - 1);

      const tasks: Array<{ habit_title: string; task: string }> = [];

      for (const habit of habits) {
        // Distribute tasks across the duration
        const taskIndex = (day - 1) % (habit.daily_tasks.length || 1);
        const task = habit.daily_tasks[taskIndex] || 'Continue practicing this habit';

        tasks.push({
          habit_title: habit.habit_title,
          task,
        });
      }

      schedule.push({
        day,
        date,
        tasks,
      });
    }

    return schedule;
  }

  /**
   * Get motivational quote based on pattern analysis
   */
  private getMotivationalQuote(patternAnalysis: PatternAnalysisResult): string {
    if (patternAnalysis.weaknesses.length > 0) {
      return `"Every moment is a fresh beginning. Your awareness of these patterns is the first step toward transformation."`;
    }

    if (patternAnalysis.strengths.length > 0) {
      return `"Your positive patterns are creating a beautiful foundation. Keep nurturing your strengths!"`;
    }

    return `"Consistency is the key to lasting change. Small daily actions create profound transformations."`;
  }

  /**
   * Get all available habit suggestions
   */
  async getAllHabitSuggestions(): Promise<KarmaHabitSuggestion[]> {
    return this.habitRepository.find({
      where: { is_active: true },
      order: { priority: 'ASC' },
    });
  }

  /**
   * Get habits for specific pattern key
   */
  async getHabitsByPattern(patternKey: string): Promise<KarmaHabitSuggestion[]> {
    return this.habitRepository.find({
      where: {
        pattern_key: patternKey,
        is_active: true,
      },
      order: { priority: 'ASC' },
    });
  }
}

