import { KarmaCategory, KarmaClassification, KarmaEffort, KarmaImpactScope, KarmaIntent, KarmaRelevance } from '../enums/karma.enum';
export interface KarmaClassificationRequest {
    text: string;
    source: string;
    suggestedCategory?: KarmaCategory;
    effortHint?: KarmaEffort;
    relevanceHint?: KarmaRelevance;
}
export interface KarmaClassificationResult {
    classification: KarmaClassification;
    category: KarmaCategory;
    intent: KarmaIntent;
    impactScope: KarmaImpactScope;
    effort: KarmaEffort;
    relevance: KarmaRelevance;
    confidence: number;
    evidence: string[];
    modelVersion: string;
}
export interface KarmaClassifierPort {
    classify(request: KarmaClassificationRequest): Promise<KarmaClassificationResult>;
}
export declare const KARMA_CLASSIFIER: unique symbol;
