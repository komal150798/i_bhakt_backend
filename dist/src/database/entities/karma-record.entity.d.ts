import { User } from './user.entity';
import { KarmaCategory } from './karma-category.entity';
export declare class KarmaRecord {
    id: number;
    user_id: number;
    user: User;
    category_id: number;
    category: KarmaCategory;
    source: string;
    input_text: string;
    media_path: string;
    sentiment: string;
    confidence: number;
    score_delta: number;
    status: string;
    recorded_at: Date;
    extra_metadata: string;
}
