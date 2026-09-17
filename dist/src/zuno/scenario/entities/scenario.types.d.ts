import { ZunoDomain } from '../../common/enums';
import { PreparationClass, ScenarioEvidenceClass, ScenarioImpact, Reversibility } from '../enums/scenario.enum';
export interface ScenarioBasis {
    type: ScenarioEvidenceClass;
    reference: string;
}
export interface ScenarioDependencyEdge {
    from: string;
    to: string;
    description?: string | null;
}
export interface ScenarioPreparation {
    action: string;
    classification: PreparationClass;
}
export interface ScenarioAstroContext {
    supportive_themes: string[];
    caution_themes: string[];
    timing_windows: string[];
    rule_keys: string[];
    rulebook_version_id: string | null;
}
export interface ScenarioPayload {
    basis: ScenarioBasis[];
    signals_for: string[];
    signals_against: string[];
    dependencies: ScenarioDependencyEdge[];
    risks: string[];
    opportunities: string[];
    controllable_factors: string[];
    impact_areas: ZunoDomain[];
    scenario_specific_preparation: ScenarioPreparation[];
    benefits: string[];
    constraints: string[];
    reversibility: Reversibility | null;
    astro_context: ScenarioAstroContext | null;
}
export declare function emptyScenarioPayload(): ScenarioPayload;
export interface ScenarioProvenance {
    challenge_context_version: number;
    rulebook_version_id: string | null;
    scenario_engine_version: string;
    prompt_version: string;
    astro_available: boolean;
}
export interface ScenarioSetDiffEntry {
    scenario_title: string;
    change: string;
    before?: string | null;
    after?: string | null;
}
export interface ScenarioComparison {
    dimension: string;
    values: Record<string, string>;
}
export interface WhatIfImplication {
    text: string;
    layer: number;
    basis: ScenarioEvidenceClass;
    dependency_reference: string | null;
}
export interface WhatIfResultPayload {
    implications: WhatIfImplication[];
    controllable_actions: string[];
    existing_preparation_that_helps: string[];
    preparation: ScenarioPreparation[];
    impact_areas: ZunoDomain[];
    impact: ScenarioImpact;
    reversibility: Reversibility | null;
    hypothetical_notice: string;
}
