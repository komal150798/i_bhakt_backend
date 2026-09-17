import { SafetyFlag, ZunoDomain } from '../../common/enums';
import { Reversibility, ScenarioEvidenceClass, ScenarioImpact, WhatIfAssumptionType } from '../enums/scenario.enum';
import { ScenarioAstroContext } from '../entities/scenario.types';
import { ScenarioPreparationDraft } from './scenario.port';
export interface WhatIfAssumptionDraft {
    text: string;
    type: WhatIfAssumptionType;
    dependency_reference?: string | null;
}
export interface WhatIfImplicationDraft {
    text: string;
    layer: number;
    basis: ScenarioEvidenceClass;
    dependency_reference: string | null;
}
export interface WhatIfExploration {
    assumption: string;
    assumptions: WhatIfAssumptionDraft[];
    implications: WhatIfImplicationDraft[];
    controllable_actions: string[];
    existing_preparation_that_helps: string[];
    preparation: ScenarioPreparationDraft[];
    impact_areas: ZunoDomain[];
    impact: ScenarioImpact;
    reversibility: Reversibility | null;
    safety_flags: SafetyFlag[];
    confidence: number;
}
export interface WhatIfExplorationRequest {
    question: string;
    summary: string;
    facts: string[];
    dependencies: {
        from: string;
        to: string;
        description?: string | null;
    }[];
    controllable: string[];
    external: string[];
    existing_preparation: string[];
    domains: ZunoDomain[];
    astro: ScenarioAstroContext | null;
    max_cascade_depth: number;
}
export interface WhatIfExplorationResult {
    exploration: WhatIfExploration;
    engineVersion: string;
    promptVersion: string;
    aiGenerationRunId: string | null;
}
export interface IWhatIfEngine {
    explore(request: WhatIfExplorationRequest): Promise<WhatIfExplorationResult>;
}
export declare const WHAT_IF_ENGINE: unique symbol;
