import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ZunoChallenge } from './zuno-challenge.entity';
import { ChallengeContextPayload } from './challenge-context.types';
import { EngineRouting } from '../../common/enums';
export declare class ZunoChallengeContext extends ZunoImmutableEntity {
    challenge_id: string;
    user_id: string;
    version_number: number;
    summary: string;
    payload: ChallengeContextPayload;
    routing: EngineRouting;
    confidence: string;
    clarification_required: boolean;
    extractor_version: string;
    ai_generation_run_id: string | null;
    created_reason: string;
    challenge?: ZunoChallenge;
}
