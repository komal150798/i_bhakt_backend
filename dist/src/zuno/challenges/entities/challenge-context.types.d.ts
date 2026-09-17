import { ContextItemSource, ContextItemType, GoalStatus, ChallengeTimeline, EmotionalSignal } from '../../common/enums';
export interface ContextItem {
    id: string;
    text: string;
    type: ContextItemType;
    source: ContextItemSource;
    confidence: number;
}
export interface DependencyEdge {
    id: string;
    from: string;
    to: string;
    description?: string;
    source: ContextItemSource;
    confidence: number;
}
export interface DesiredOutcome {
    id: string;
    goal: string;
    status: GoalStatus;
    confidence: number;
}
export interface DetectedDecision {
    id: string;
    question: string;
    options: string[];
    confidence: number;
}
export interface FactorSplit {
    controllable: string[];
    external: string[];
}
export interface TemporalAnchor {
    raw: string;
    normalized_date: string | null;
    timeline: ChallengeTimeline;
}
export interface MissingInformation {
    id: string;
    question: string;
    information_gain: number;
    rationale: string;
}
export interface ChallengeContextPayload {
    summary: string;
    items: ContextItem[];
    dependencies: DependencyEdge[];
    desired_outcomes: DesiredOutcome[];
    decisions: DetectedDecision[];
    factors: FactorSplit;
    temporal_anchors: TemporalAnchor[];
    missing_information: MissingInformation[];
    emotional_signals: EmotionalSignal[];
    subthemes: string[];
}
export declare function factsOnly(items: ContextItem[]): ContextItem[];
export declare function fearsAndAssumptions(items: ContextItem[]): ContextItem[];
export declare function emptyContextPayload(): ChallengeContextPayload;
