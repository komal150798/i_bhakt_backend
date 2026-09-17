import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ChallengeLinkType } from '../../common/enums';
export declare class ZunoChallengeLink extends ZunoBaseEntity {
    source_challenge_id: string;
    target_challenge_id: string;
    user_id: string;
    relationship_type: ChallengeLinkType;
    reason: string | null;
}
