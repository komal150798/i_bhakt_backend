import { ZunoVersionedEntity } from '../../common/entities/zuno-base.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { MkaPeriodType, MkaProgramStatus, MkaRemedyStatus, MkaReviewTrigger } from '../enums/mka.enum';
import { ZunoMkaItem } from './zuno-mka-item.entity';
export declare class ZunoMkaProgram extends ZunoVersionedEntity {
    user_id: string;
    challenge_id: string;
    plan_id: string | null;
    period_type: MkaPeriodType;
    start_date: string;
    end_date: string;
    status: MkaProgramStatus;
    rulebook_version_id: string | null;
    remedy_status: MkaRemedyStatus;
    review_trigger: MkaReviewTrigger;
    review_at: string | null;
    context_version: number;
    source_response_id: string | null;
    safety_decision_id: string | null;
    engine_version: string;
    generated_reason: string;
    superseded_by_id: string | null;
    activated_at: Date | null;
    completed_at: Date | null;
    user?: ZunoUser;
    challenge?: ZunoChallenge;
    items?: ZunoMkaItem[];
}
