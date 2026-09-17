import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { KarmaPatternStatus, KarmaPatternType } from '../enums/karma.enum';
export declare class ZunoKarmaPattern extends ZunoBaseEntity {
    user_id: string;
    challenge_id: string | null;
    pattern_type: KarmaPatternType;
    evidence_count: number;
    confidence: string | null;
    status: KarmaPatternStatus;
    first_observed_at: Date;
    last_observed_at: Date;
}
