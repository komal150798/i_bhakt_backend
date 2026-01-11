import { User } from './user.entity';
export declare class QuestionnaireSession {
    id: number;
    user_id: number;
    user: User;
    version: number;
    age_at_assessment: number;
    responses: string;
    aggregate_score: number;
    baseline_score: number;
    source: string;
    created_at: Date;
    completed_at: Date;
}
