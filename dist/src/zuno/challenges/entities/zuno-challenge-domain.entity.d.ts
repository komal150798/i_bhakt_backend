import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoDomain, ZunoRiskClass } from '../../common/enums';
import { ZunoChallenge } from './zuno-challenge.entity';
export declare class ZunoChallengeDomain extends ZunoBaseEntity {
    challenge_id: string;
    user_id: string;
    domain: ZunoDomain;
    risk_class: ZunoRiskClass;
    is_primary: boolean;
    confidence: string | null;
    challenge?: ZunoChallenge;
}
