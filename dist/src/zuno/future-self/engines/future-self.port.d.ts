import { FutureSelfMode } from '../enums/future-self.enum';
export interface FutureSelfNarrative {
    summary: string;
    progress_themes: string[];
    open_loops: string[];
    strengths_observed: string[];
    next_focus: string[];
    source_refs: string[];
}
export interface FutureSelfGenerationRequest {
    mode: FutureSelfMode;
    context: {
        challengeTitle: string | null;
        challengeSummary: string | null;
        relevantMemory: string[];
        planTitle: string | null;
        openPlanItems: string[];
        completedActions: string[];
        openLoops: string[];
        observedPatterns: string[];
        timingContext: string | null;
        periodStart: string | null;
        periodEnd: string | null;
    };
}
export interface FutureSelfGenerationResult {
    narrative: FutureSelfNarrative;
    engineVersion: string;
    modelVersion: string | null;
    aiGenerationRunId: string | null;
}
export interface IFutureSelfEngine {
    generate(request: FutureSelfGenerationRequest): Promise<FutureSelfGenerationResult>;
}
export declare const FUTURE_SELF_ENGINE: unique symbol;
