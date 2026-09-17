import { KarmaCategory, KarmaClassification, KarmaEffort, KarmaIntent, KarmaRelevance } from '../enums/karma.enum';
export interface KarmaScoringConfiguration {
    version: string;
    maxPointsPerEntry: number;
    minPointsPerEntry: number;
    dailySoftCap: number;
    negativeScoringEnabled: false;
    baseValue: number;
    intentWeight: Readonly<Record<KarmaIntent, number>>;
    effortWeight: Readonly<Record<KarmaEffort, number>>;
    relevanceWeight: Readonly<Record<KarmaRelevance, number>>;
    repetitionCurve: readonly number[];
    repetitionWindowDays: number;
    classificationFactor: Readonly<Record<KarmaClassification, number>>;
    autoConfirmConfidence: number;
    uncertainBelowConfidence: number;
}
export declare const KARMA_SCORING_V1: KarmaScoringConfiguration;
export interface KarmaScoreObservation {
    classification: KarmaClassification;
    category: KarmaCategory;
    intent: KarmaIntent;
    effort: KarmaEffort;
    relevance: KarmaRelevance;
    priorInCategoryInWindow: number;
    pointsRecordedToday: number;
}
export interface KarmaScoreFactor {
    factor: string;
    value: number;
}
export interface KarmaScoreBreakdown {
    points: number;
    scoringModelVersion: string;
    factors: KarmaScoreFactor[];
    softCapApplied: boolean;
    explanation: string;
}
export declare function assertNonPunitive(config: KarmaScoringConfiguration, points: number): void;
export declare function calculateKarmaPoints(observation: KarmaScoreObservation, config?: KarmaScoringConfiguration): KarmaScoreBreakdown;
export declare function requiresUserConfirmation(confidence: number, config?: KarmaScoringConfiguration): boolean;
export declare function withConfidenceFloor(classification: KarmaClassification, confidence: number, config?: KarmaScoringConfiguration): KarmaClassification;
