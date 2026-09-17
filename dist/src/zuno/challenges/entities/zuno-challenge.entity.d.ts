import { ZunoVersionedEntity } from '../../common/entities/zuno-base.entity';
import { ChallengeMode, ChallengeStatus, EmotionalIntensity, Urgency, ZunoDomain } from '../../common/enums';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoChallengeContext } from './zuno-challenge-context.entity';
import { ZunoChallengeDomain } from './zuno-challenge-domain.entity';
export declare class ZunoChallenge extends ZunoVersionedEntity {
    user_id: string;
    title: string | null;
    raw_user_statement: string;
    primary_domain: ZunoDomain | null;
    theme: string | null;
    status: ChallengeStatus;
    mode: ChallengeMode | null;
    urgency: Urgency | null;
    emotional_intensity: EmotionalIntensity | null;
    priority: number | null;
    context_version: number;
    opened_at: Date;
    resolved_at: Date | null;
    resolution_note: string | null;
    user?: ZunoUser;
    contexts?: ZunoChallengeContext[];
    domains?: ZunoChallengeDomain[];
}
