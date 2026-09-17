import { SafetyFlag, ZunoDomain, ChallengeMode } from '../../common/enums';
import { DecisionReadiness, PreparationClass, Reversibility, ScenarioEvidenceClass, ScenarioHorizon, ScenarioImpact, ScenarioRelevance, ScenarioType } from '../enums/scenario.enum';
import { ScenarioAstroContext } from '../entities/scenario.types';
export interface ScenarioBasisDraft {
    type: ScenarioEvidenceClass;
    reference: string;
}
export interface ScenarioPreparationDraft {
    action: string;
    classification: PreparationClass;
}
export interface ScenarioCandidate {
    title: string;
    summary: string;
    scenario_type: ScenarioType;
    horizon: ScenarioHorizon;
    impact: ScenarioImpact;
    relevance: ScenarioRelevance;
    confidence: number;
    basis: ScenarioBasisDraft[];
    signals_for: string[];
    signals_against: string[];
    dependencies: {
        from: string;
        to: string;
        description?: string | null;
    }[];
    risks: string[];
    opportunities: string[];
    controllable_factors: string[];
    impact_areas: ZunoDomain[];
    scenario_specific_preparation: ScenarioPreparationDraft[];
    benefits: string[];
    constraints: string[];
    reversibility: Reversibility | null;
    option_ref: string | null;
}
export interface ScenarioComparisonDraft {
    dimension: string;
    values: Record<string, string>;
}
export interface ScenarioGeneration {
    seeds: string[];
    scenarios: ScenarioCandidate[];
    shared_preparation: ScenarioPreparationDraft[];
    watch_signals: string[];
    comparison: ScenarioComparisonDraft[];
    decision_readiness: DecisionReadiness;
    safety_flags: SafetyFlag[];
}
export interface ScenarioGenerationRequest {
    summary: string;
    facts: string[];
    concerns: string[];
    dependencies: {
        from: string;
        to: string;
        description?: string | null;
    }[];
    decisions: {
        question: string;
        options: string[];
    }[];
    controllable: string[];
    external: string[];
    temporal_anchors: {
        raw: string;
        normalized_date: string | null;
    }[];
    domains: ZunoDomain[];
    mode: ChallengeMode | null;
    astro: ScenarioAstroContext | null;
    rejected_paths: string[];
    max_scenarios: number;
}
export interface ScenarioGenerationResult {
    generation: ScenarioGeneration;
    engineVersion: string;
    promptVersion: string;
    aiGenerationRunId: string | null;
}
export interface IScenarioEngine {
    generate(request: ScenarioGenerationRequest): Promise<ScenarioGenerationResult>;
}
export declare const SCENARIO_ENGINE: unique symbol;
