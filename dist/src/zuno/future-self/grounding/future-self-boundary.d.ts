import { FutureSelfMode, FutureSelfViolation } from '../enums/future-self.enum';
export interface GroundingSet {
    terms: ReadonlySet<string>;
    figures: ReadonlySet<string>;
    sourceRefs: ReadonlySet<string>;
}
export interface GroundingSource {
    entityType: string;
    entityId: string;
    text: string;
}
export declare function buildGroundingSet(sources: GroundingSource[]): GroundingSet;
export interface BoundaryCheckInput {
    mode: FutureSelfMode;
    candidateText: string;
    summary: string;
    grounding: GroundingSet;
    claimedSourceRefs?: readonly string[];
}
export interface BoundaryCheckResult {
    allowed: boolean;
    violations: FutureSelfViolation[];
    offending: string[];
}
export declare function checkFutureSelfBoundary(input: BoundaryCheckInput): BoundaryCheckResult;
interface ProperNounCandidate {
    phrase: string;
    index: number;
}
export declare function extractProperNouns(text: string): ProperNounCandidate[];
export declare function extractFigures(text: string): string[];
export {};
