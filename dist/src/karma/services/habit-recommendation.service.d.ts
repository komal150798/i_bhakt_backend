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
export declare class HabitRecommendationService {
    private readonly habitRepository;
    private readonly logger;
    constructor(habitRepository: Repository<KarmaHabitSuggestion>);
    generateHabitPlan(userId: number, patternAnalysis: PatternAnalysisResult): Promise<HabitPlan>;
    private getHabitsForPattern;
    private generateDailySchedule;
    private getMotivationalQuote;
    getAllHabitSuggestions(): Promise<KarmaHabitSuggestion[]>;
    getHabitsByPattern(patternKey: string): Promise<KarmaHabitSuggestion[]>;
}
