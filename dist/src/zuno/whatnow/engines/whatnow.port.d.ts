import { ChallengeTimeline, ContextItemSource, ContextItemType, EmotionalIntensity, EmotionalSignal, GoalStatus, SafetyFlag, Urgency, ZunoDomain } from '../../common/enums';
export interface WhatNowExtraction {
    summary: string;
    primary_domain: ZunoDomain;
    secondary_domains: {
        domain: ZunoDomain;
        confidence: number;
    }[];
    theme: string | null;
    subthemes: string[];
    items: {
        text: string;
        type: ContextItemType;
        source: ContextItemSource;
        confidence: number;
    }[];
    dependencies: {
        from: string;
        to: string;
        description?: string;
    }[];
    desired_outcomes: {
        goal: string;
        status: GoalStatus;
        confidence: number;
    }[];
    decisions: {
        question: string;
        options: string[];
        confidence: number;
    }[];
    controllable: string[];
    external: string[];
    temporal_anchors: {
        raw: string;
        normalized_date: string | null;
        timeline: ChallengeTimeline;
    }[];
    missing_information: {
        question: string;
        information_gain: number;
        rationale: string;
    }[];
    emotional_signals: EmotionalSignal[];
    emotional_intensity: EmotionalIntensity;
    urgency: Urgency;
    safety_flags: SafetyFlag[];
    confidence: number;
}
export interface WhatNowExtractionRequest {
    statement: string;
    knownContext?: {
        countryCode?: string | null;
        preferredName?: string | null;
        previousSummary?: string | null;
    };
}
export interface WhatNowExtractionResult {
    extraction: WhatNowExtraction;
    extractorVersion: string;
    aiGenerationRunId: string | null;
}
export interface IWhatNowEngine {
    extract(request: WhatNowExtractionRequest): Promise<WhatNowExtractionResult>;
}
export declare const WHATNOW_ENGINE: unique symbol;
