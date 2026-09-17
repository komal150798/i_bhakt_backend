import { ZunoScenario } from '../entities/zuno-scenario.entity';
import { ZunoScenarioSet } from '../entities/zuno-scenario-set.entity';
import { ZunoWhatIfSession } from '../entities/zuno-what-if-session.entity';
import { ZunoWhatIfAssumption } from '../entities/zuno-what-if-assumption.entity';
import { ScenarioCaseClass, ScenarioHorizon, ScenarioImpact, ScenarioStatus, ScenarioType } from '../enums/scenario.enum';
export declare class GenerateScenariosDto {
    challengeId: string;
    reason?: string;
}
export declare class ListScenariosQueryDto {
    challengeId: string;
    includeAll?: boolean;
}
export declare class ScenarioDecisionDto {
    decision: ScenarioStatus.USER_ADOPTED | ScenarioStatus.USER_REJECTED | ScenarioStatus.DISMISSED;
    note?: string;
    version?: number;
}
export declare class ScenarioTriggeredDto {
    note?: string;
    version?: number;
}
export declare class WhatIfRequestDto {
    challengeId: string;
    question: string;
}
export declare class ScenarioView {
    id: string;
    name: string;
    type: ScenarioCaseClass;
    scenarioType: ScenarioType;
    description: string;
    confidence: string;
    impact: ScenarioImpact;
    horizon: ScenarioHorizon;
    status: ScenarioStatus;
    hypothetical: boolean;
    version: number;
    preparation: string[];
    static from(scenario: ZunoScenario): ScenarioView;
}
export declare class ScenarioSetView {
    scenarioSetId: string;
    challengeId: string;
    version: number;
    scenarios: ScenarioView[];
    sharedPreparation: string[];
    watchSignals: string[];
    decisionReadiness: string | null;
    generatedAt: string;
    astrologyAvailable: boolean;
    static from(set: ZunoScenarioSet, scenarios: ZunoScenario[]): ScenarioSetView;
}
export declare class WhatIfView {
    sessionId: string;
    mode: string;
    hypothetical: boolean;
    assumptions: string[];
    implications: string[];
    controllableFactors: string[];
    existingPreparationThatHelps: string[];
    recommendedPreparation: string[];
    impact: string;
    currentPlanChanged: boolean;
    notice: string;
    createdAt: string;
    static from(session: ZunoWhatIfSession, assumptions: ZunoWhatIfAssumption[]): WhatIfView;
}
