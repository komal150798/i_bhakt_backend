import { ZunoKarmaEntry } from '../entities/zuno-karma-entry.entity';
import { KarmaCategory, KarmaClassification, KarmaEntrySource, KarmaEntryStatus, KarmaIntent } from '../enums/karma.enum';
import { KarmaSummary } from '../services/karma.service';
export declare class CreateKarmaEntryDto {
    text: string;
    occurredAt?: string;
    challengeId?: string;
}
export declare class KarmaClassificationFeedbackDto {
    accepted: boolean;
    comment?: string;
}
export declare class CorrectKarmaEntryDto {
    classification?: KarmaClassification;
    category?: KarmaCategory;
    intent?: KarmaIntent;
    text?: string;
    classificationFeedback?: KarmaClassificationFeedbackDto;
    version?: number;
}
export declare class ListKarmaQueryDto {
    category?: KarmaCategory;
    classification?: KarmaClassification;
    source?: KarmaEntrySource;
    challengeId?: string;
    from?: string;
    to?: string;
    limit?: number;
    cursor?: string;
}
export declare class KarmaEntryView {
    id: string;
    classification: KarmaClassification;
    category: KarmaCategory;
    intent: KarmaIntent | null;
    points: number;
    confidence: number | null;
    userConfirmed: boolean;
    status: KarmaEntryStatus;
    source: KarmaEntrySource;
    challengeId: string | null;
    visibility: string;
    occurredAt: string;
    createdAt: string;
    version: number;
    scoringModelVersion: string;
    static from(entry: ZunoKarmaEntry): KarmaEntryView;
}
export declare class KarmaEntryDetailView extends KarmaEntryView {
    rawText: string | null;
    evidence: string[];
    scoreFactors: {
        factor: string;
        value: number;
    }[];
    planItemId: string | null;
    mkaItemId: string | null;
    redactedAt: string | null;
    static fromDetail(entry: ZunoKarmaEntry): KarmaEntryDetailView;
}
export declare class KarmaEntryCreatedView {
    id: string;
    classification: KarmaClassification;
    category: KarmaCategory;
    points: number;
    confidence: number | null;
    userConfirmed: boolean;
    confirmationRequired: boolean;
    explanation: string;
    static from(entry: ZunoKarmaEntry, confirmationRequired: boolean, explanation: string): KarmaEntryCreatedView;
}
export declare class KarmaSummaryView {
    pointsLabel: string;
    framing: string;
    today: {
        entriesRecorded: number;
        points: number;
    };
    thisWeek: {
        entriesRecorded: number;
        points: number;
        daysActive: number;
        topCategory: string | null;
        repairActions: number;
    };
    patterns: {
        patternType: string;
        evidenceCount: number;
        lastObservedAt: string;
    }[];
    static from(summary: KarmaSummary): KarmaSummaryView;
}
