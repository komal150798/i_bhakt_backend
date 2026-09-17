import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoWhatIfAssumption } from './zuno-what-if-assumption.entity';
import { WhatIfSessionStatus } from '../enums/scenario.enum';
import { WhatIfResultPayload } from './scenario.types';
export declare class ZunoWhatIfSession extends ZunoBaseEntity {
    user_id: string;
    challenge_id: string;
    prompt: string;
    status: WhatIfSessionStatus;
    is_hypothetical: boolean;
    result: WhatIfResultPayload | null;
    current_plan_changed: boolean;
    challenge_context_version: number | null;
    engine_version: string;
    safety_decision_id: string | null;
    ai_generation_run_id: string | null;
    expires_at: Date | null;
    user?: ZunoUser;
    challenge?: ZunoChallenge;
    assumptions?: ZunoWhatIfAssumption[];
}
