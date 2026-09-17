import { ZunoVersionedEntity } from '../../common/entities/zuno-base.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { KarmaCategory, KarmaClassification, KarmaEntrySource, KarmaEntryStatus, KarmaImpactScope, KarmaIntent, KarmaVisibility } from '../enums/karma.enum';
export declare class ZunoKarmaEntry extends ZunoVersionedEntity {
    user_id: string;
    challenge_id: string | null;
    plan_item_id: string | null;
    mka_item_id: string | null;
    source: KarmaEntrySource;
    source_event_id: string | null;
    raw_text: string | null;
    classification: KarmaClassification;
    category: KarmaCategory;
    intent: KarmaIntent | null;
    impact_scope: KarmaImpactScope | null;
    points: number;
    confidence: string | null;
    user_confirmed: boolean;
    visibility: KarmaVisibility;
    scoring_model_version: string;
    classification_model_version: string;
    score_factors: {
        factor: string;
        value: number;
    }[];
    evidence: string[];
    status: KarmaEntryStatus;
    occurred_at: Date;
    redacted_at: Date | null;
    user?: ZunoUser;
}
