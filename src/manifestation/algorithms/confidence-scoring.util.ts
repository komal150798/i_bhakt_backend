/**
 * Confidence Scoring Algorithm
 * Measures how confident we are in category detection
 */

export interface CategoryScore {
  category: string;
  score: number;
}

export class ConfidenceScoring {
  /**
   * Calculate confidence score for category detection
   * 
   * @param categoryScores - Map of category to score
   * @returns Confidence score (0-100)
   */
  static calculateConfidence(categoryScores: Record<string, number>): number {
    const scores = Object.entries(categoryScores)
      .map(([category, score]) => ({ category, score }))
      .sort((a, b) => b.score - a.score);

    if (scores.length === 0) return 0;
    if (scores.length === 1) return 100;

    const maxScore = scores[0].score;
    const secondMaxScore = scores[1]?.score || 0;

    // If max score is 0, no confidence
    if (maxScore === 0) return 0;

    // Calculate confidence based on:
    // 1. Score difference (larger difference = more confident)
    // 2. Score ratio (smaller second/max ratio = more confident)
    // 3. Absolute score (higher = more confident)
    const scoreDifference = maxScore - secondMaxScore;
    const scoreRatio = secondMaxScore / maxScore;
    const normalizedMaxScore = maxScore / 100; // Normalize to 0-1

    const confidence = (
      (scoreDifference / maxScore) * 0.4 +      // 40% weight on difference
      (1 - scoreRatio) * 0.3 +                   // 30% weight on ratio
      normalizedMaxScore * 0.3                    // 30% weight on absolute score
    ) * 100;

    return Math.min(100, Math.max(0, Math.round(confidence)));
  }

  /**
   * Get confidence level label
   */
  static getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence >= 70) return 'high';
    if (confidence >= 40) return 'medium';
    return 'low';
  }

  /**
   * Should we use LLM fallback?
   */
  static shouldUseLLMFallback(confidence: number): boolean {
    return confidence < 50; // Use LLM if confidence is below 50%
  }
}





