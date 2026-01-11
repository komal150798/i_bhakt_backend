import { BaseEntity } from '../../common/entities/base.entity';
export declare class KarmaScoreSummary extends BaseEntity {
    user_id: number;
    period_type: 'daily' | 'weekly' | 'monthly';
    period_start: Date;
    period_end: Date;
    karma_score: number;
    total_good_actions: number;
    total_bad_actions: number;
    total_neutral_actions: number;
    total_positive_points: number;
    total_negative_points: number;
    ai_summary: string | null;
    prediction: string | null;
    top_patterns: Record<string, any> | null;
    metadata: Record<string, any> | null;
}
