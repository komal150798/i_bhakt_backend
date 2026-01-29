export declare class NGramMatching {
    static generateNGrams(text: string, n?: number): string[];
    static ngramSimilarity(text1: string, text2: string, n?: number): number;
    static matches(text: string, keyword: string, threshold?: number): boolean;
    static findBestMatch(text: string, keywords: string[], threshold?: number): {
        keyword: string;
        similarity: number;
    } | null;
}
