export interface CategoryScore {
    category: string;
    score: number;
}
export declare class ConfidenceScoring {
    static calculateConfidence(categoryScores: Record<string, number>): number;
    static getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low';
    static shouldUseLLMFallback(confidence: number): boolean;
}
