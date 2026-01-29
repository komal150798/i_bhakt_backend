export declare class TextNormalizer {
    private static readonly spellingVariations;
    private static readonly hindiTransliteration;
    private static readonly indianEnglishVariations;
    static normalizeText(text: string): string;
    static fuzzyMatch(text: string, keyword: string, maxDistance?: number): boolean;
    private static levenshteinDistance;
    private static escapeRegex;
    static extractHindiWords(text: string): string[];
    static hasHindiScript(text: string): boolean;
}
