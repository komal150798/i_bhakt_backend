import { BaseEntity } from '../../common/entities/base.entity';
export declare class KarmaPattern extends BaseEntity {
    user_id: number;
    pattern_key: string;
    pattern_name: string;
    pattern_type: 'good' | 'bad' | 'neutral';
    frequency_count: number;
    total_score_impact: number;
    detected_date: Date;
    first_detected_date: Date;
    last_detected_date: Date;
    sample_actions: string[] | null;
    metadata: Record<string, any> | null;
}
