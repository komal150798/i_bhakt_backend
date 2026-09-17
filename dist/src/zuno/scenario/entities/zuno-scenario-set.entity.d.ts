import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoScenario } from './zuno-scenario.entity';
import { DecisionReadiness, ScenarioSetStatus } from '../enums/scenario.enum';
import { ScenarioComparison, ScenarioPreparation, ScenarioProvenance, ScenarioSetDiffEntry } from './scenario.types';
export declare class ZunoScenarioSet extends ZunoBaseEntity {
    challenge_id: string;
    user_id: string;
    version_number: number;
    status: ScenarioSetStatus;
    generated_reason: string;
    shared_preparation: ScenarioPreparation[];
    watch_signals: string[];
    seeds: string[];
    comparison: ScenarioComparison[];
    diff: ScenarioSetDiffEntry[];
    decision_readiness: DecisionReadiness | null;
    provenance: ScenarioProvenance;
    user_facing_count: number;
    safety_decision_id: string | null;
    ai_generation_run_id: string | null;
    challenge?: ZunoChallenge;
    scenarios?: ZunoScenario[];
}
