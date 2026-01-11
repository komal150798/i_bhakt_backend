import { User } from './user.entity';
export declare class DailyAlignmentTip {
    id: number;
    user_id: number;
    user: User;
    tip_text: string;
    manifestation_summary: string;
    source: string;
    status: string;
    last_added_to_journal_at: Date;
    frequency: string;
    scheduled_day: number;
    start_date: Date;
    last_generated_at: Date;
    auto_archive_after_days: number;
    created_at: Date;
    updated_at: Date;
}
