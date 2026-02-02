/**
 * N-gram Matching Algorithm
 * Better matching for Hindi, transliteration, and word order variations
 */

export class NGramMatching {
  /**
   * Generate n-grams from text
   * 
   * @param text - Input text
   * @param n - N-gram size (default: 2 for bigrams)
   * @returns Array of n-grams
   */
  static generateNGrams(text: string, n: number = 2): string[] {
    const words = text.toLowerCase().trim().split(/\s+/);
    if (words.length < n) return [text.toLowerCase()];
    
    const ngrams: string[] = [];
    
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(' '));
    }
    
    return ngrams;
  }

  /**
   * Calculate n-gram similarity between two texts
   * 
   * @param text1 - First text
   * @param text2 - Second text
   * @param n - N-gram size
   * @returns Similarity score (0-1)
   */
  static ngramSimilarity(text1: string, text2: string, n: number = 2): number {
    const ngrams1 = this.generateNGrams(text1, n);
    const ngrams2 = this.generateNGrams(text2, n);
    
    if (ngrams1.length === 0 && ngrams2.length === 0) return 1.0;
    if (ngrams1.length === 0 || ngrams2.length === 0) return 0.0;
    
    // Count intersection
    const set1 = new Set(ngrams1);
    const set2 = new Set(ngrams2);
    const intersection = ngrams1.filter(ng => set2.has(ng));
    
    // Jaccard similarity
    const union = new Set([...ngrams1, ...ngrams2]);
    return intersection.length / union.size;
  }

  /**
   * Check if text matches keyword using n-grams
   * 
   * @param text - Input text
   * @param keyword - Keyword to match
   * @param threshold - Similarity threshold (default: 0.6)
   * @returns True if similarity >= threshold
   */
  static matches(text: string, keyword: string, threshold: number = 0.6): boolean {
    const similarity = this.ngramSimilarity(text, keyword);
    return similarity >= threshold;
  }

  /**
   * Find best matching keyword from list
   * 
   * @param text - Input text
   * @param keywords - List of keywords
   * @param threshold - Minimum similarity threshold
   * @returns Best matching keyword and similarity score
   */
  static findBestMatch(
    text: string,
    keywords: string[],
    threshold: number = 0.6
  ): { keyword: string; similarity: number } | null {
    let bestMatch: { keyword: string; similarity: number } | null = null;
    let bestSimilarity = 0;

    for (const keyword of keywords) {
      const similarity = this.ngramSimilarity(text, keyword);
      if (similarity > bestSimilarity && similarity >= threshold) {
        bestSimilarity = similarity;
        bestMatch = { keyword, similarity };
      }
    }

    return bestMatch;
  }
}




