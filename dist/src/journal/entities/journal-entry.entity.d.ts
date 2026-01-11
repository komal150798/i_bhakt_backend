import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
export declare class JournalEntry extends BaseEntity {
    user_id: number;
    content: string;
    entry_date: Date;
    entry_type: string | null;
    sentiment_analysis: {
        sentiment: string;
        score: number;
        emotions?: string[];
    } | null;
    nlp_analysis: {
        keywords?: string[];
        topics?: string[];
        summary?: string;
    } | null;
    karma_entry_id: number | null;
    metadata: Record<string, any> | null;
    user: User;
}
