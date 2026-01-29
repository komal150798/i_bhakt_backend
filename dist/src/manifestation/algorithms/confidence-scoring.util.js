"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfidenceScoring = void 0;
class ConfidenceScoring {
    static calculateConfidence(categoryScores) {
        const scores = Object.entries(categoryScores)
            .map(([category, score]) => ({ category, score }))
            .sort((a, b) => b.score - a.score);
        if (scores.length === 0)
            return 0;
        if (scores.length === 1)
            return 100;
        const maxScore = scores[0].score;
        const secondMaxScore = scores[1]?.score || 0;
        if (maxScore === 0)
            return 0;
        const scoreDifference = maxScore - secondMaxScore;
        const scoreRatio = secondMaxScore / maxScore;
        const normalizedMaxScore = maxScore / 100;
        const confidence = ((scoreDifference / maxScore) * 0.4 +
            (1 - scoreRatio) * 0.3 +
            normalizedMaxScore * 0.3) * 100;
        return Math.min(100, Math.max(0, Math.round(confidence)));
    }
    static getConfidenceLevel(confidence) {
        if (confidence >= 70)
            return 'high';
        if (confidence >= 40)
            return 'medium';
        return 'low';
    }
    static shouldUseLLMFallback(confidence) {
        return confidence < 50;
    }
}
exports.ConfidenceScoring = ConfidenceScoring;
//# sourceMappingURL=confidence-scoring.util.js.map