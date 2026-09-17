export declare enum DeterministicClaimKind {
    GUARANTEED_OUTCOME = "GUARANTEED_OUTCOME",
    NUMERIC_PROBABILITY = "NUMERIC_PROBABILITY",
    PREDICTION = "PREDICTION",
    FATALISM = "FATALISM",
    CERTAIN_TIMING = "CERTAIN_TIMING"
}
export interface DeterministicClaim {
    kind: DeterministicClaimKind;
    excerpt: string;
    field: string;
}
export declare function findDeterministicClaims(text: string | null | undefined, field?: string): DeterministicClaim[];
export declare function hasDeterministicClaim(text: string | null | undefined): boolean;
export declare function scanForDeterministicClaims(value: unknown, path?: string): DeterministicClaim[];
export declare function claimsToValidationErrors(claims: DeterministicClaim[]): string[];
export declare const QUALITATIVE_RELEVANCE_LABELS: readonly string[];
export declare function isQualitativeProbabilityLabel(label: string | null | undefined): boolean;
