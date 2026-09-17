import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { FutureSelfMode } from '../enums/future-self.enum';
import { ZunoFutureSelfSource } from './zuno-future-self-source.entity';
export declare class ZunoFutureSelfNarrative extends ZunoBaseEntity {
    user_id: string;
    challenge_id: string | null;
    mode: FutureSelfMode;
    period_start: string | null;
    period_end: string | null;
    summary: string;
    progress_themes: string[];
    open_loops: string[];
    strengths_observed: string[];
    next_focus: string[];
    generation_model_version: string | null;
    engine_version: string;
    prompt_template_version: string | null;
    ai_generation_run_id: string | null;
    safety_decision_id: string | null;
    boundary_version: string;
    version: number;
    redacted_at: Date | null;
    user?: ZunoUser;
    challenge?: ZunoChallenge | null;
    sources?: ZunoFutureSelfSource[];
}
