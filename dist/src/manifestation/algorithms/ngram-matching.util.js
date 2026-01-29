"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NGramMatching = void 0;
class NGramMatching {
    static generateNGrams(text, n = 2) {
        const words = text.toLowerCase().trim().split(/\s+/);
        if (words.length < n)
            return [text.toLowerCase()];
        const ngrams = [];
        for (let i = 0; i <= words.length - n; i++) {
            ngrams.push(words.slice(i, i + n).join(' '));
        }
        return ngrams;
    }
    static ngramSimilarity(text1, text2, n = 2) {
        const ngrams1 = this.generateNGrams(text1, n);
        const ngrams2 = this.generateNGrams(text2, n);
        if (ngrams1.length === 0 && ngrams2.length === 0)
            return 1.0;
        if (ngrams1.length === 0 || ngrams2.length === 0)
            return 0.0;
        const set1 = new Set(ngrams1);
        const set2 = new Set(ngrams2);
        const intersection = ngrams1.filter(ng => set2.has(ng));
        const union = new Set([...ngrams1, ...ngrams2]);
        return intersection.length / union.size;
    }
    static matches(text, keyword, threshold = 0.6) {
        const similarity = this.ngramSimilarity(text, keyword);
        return similarity >= threshold;
    }
    static findBestMatch(text, keywords, threshold = 0.6) {
        let bestMatch = null;
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
exports.NGramMatching = NGramMatching;
//# sourceMappingURL=ngram-matching.util.js.map