import { BaseEntity } from '../../common/entities/base.entity';
export declare class Challenge extends BaseEntity {
    title: string;
    description: string | null;
    challenge_type: string;
    duration_days: number;
    daily_tasks: Array<{
        day: number;
        task: string;
        description?: string;
    }> | null;
    is_active: boolean;
    metadata: Record<string, any> | null;
}
