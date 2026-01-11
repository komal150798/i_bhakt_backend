import { BaseEntity } from '../../common/entities/base.entity';
export declare class KarmaHabitSuggestion extends BaseEntity {
    pattern_key: string;
    habit_title: string;
    habit_description: string;
    priority: number;
    duration_days: number;
    daily_tasks: string[] | null;
    motivational_message: string | null;
    is_active: boolean;
    metadata: Record<string, any> | null;
}
