import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoWhatIfSession } from './zuno-what-if-session.entity';
import { WhatIfAssumptionType } from '../enums/scenario.enum';
export declare class ZunoWhatIfAssumption extends ZunoBaseEntity {
    what_if_session_id: string;
    user_id: string;
    assumption_text: string;
    assumption_type: WhatIfAssumptionType;
    value: Record<string, unknown> | null;
    session?: ZunoWhatIfSession;
}
