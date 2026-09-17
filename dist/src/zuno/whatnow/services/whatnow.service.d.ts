import { IWhatNowEngine, WhatNowExtraction } from '../engines/whatnow.port';
import { ChallengeContextPayload } from '../../challenges/entities/challenge-context.types';
import { ChallengeMode, EngineRouting, ResponseDepth, Urgency, ZunoDomain, ZunoRiskClass } from '../../common/enums';
export interface WhatNowAnalysis {
    payload: ChallengeContextPayload;
    primaryDomain: ZunoDomain;
    secondaryDomains: {
        domain: ZunoDomain;
        confidence: number;
    }[];
    theme: string | null;
    urgency: Urgency;
    emotionalIntensity: WhatNowExtraction['emotional_intensity'];
    confidence: number;
    clarificationRequired: boolean;
    routing: EngineRouting;
    mode: ChallengeMode;
    responseDepth: ResponseDepth;
    title: string;
    safetyFlags: WhatNowExtraction['safety_flags'];
    extractorVersion: string;
    aiGenerationRunId: string | null;
    domainRisk: Map<ZunoDomain, ZunoRiskClass>;
}
export declare class WhatNowService {
    private readonly engine;
    private readonly logger;
    constructor(engine: IWhatNowEngine);
    private get clarificationThreshold();
    analyze(params: {
        statement: string;
        countryCode?: string | null;
        preferredName?: string | null;
        previousSummary?: string | null;
    }): Promise<WhatNowAnalysis>;
    private enforceInvariants;
    private collectDomains;
    private deriveRouting;
    private deriveMode;
    private deriveResponseDepth;
    private deriveTitle;
}
