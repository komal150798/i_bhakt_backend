import { DailyGuidanceLog } from './daily-guidance-log.entity';
export declare class GuidanceTemplate {
    id: number;
    title: string;
    body: string;
    min_score: number;
    max_score: number;
    tier: string;
    tags: string;
    score_value: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    guidance_logs: DailyGuidanceLog[];
}
