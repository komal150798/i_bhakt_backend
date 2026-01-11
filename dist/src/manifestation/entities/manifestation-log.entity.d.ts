import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
export declare class ManifestationLog extends BaseEntity {
    user_id: number;
    desire_text: string;
    emotional_coherence: number | null;
    linguistic_clarity: number | null;
    astrological_resonance: number | null;
    manifestation_probability: number | null;
    best_manifestation_date: Date | null;
    analysis_data: Record<string, any> | null;
    metadata: Record<string, any> | null;
    user: User;
}
