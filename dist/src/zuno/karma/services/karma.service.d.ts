import { DataSource, Repository } from 'typeorm';
import { ZunoKarmaEntry } from '../entities/zuno-karma-entry.entity';
import { ZunoKarmaPattern } from '../entities/zuno-karma-pattern.entity';
import { KarmaCategory, KarmaClassification, KarmaEntrySource, KarmaIngestResult, KarmaIntent, KarmaPatternType } from '../enums/karma.enum';
import { KarmaClassifierPort } from '../ports/karma-classifier.port';
import { KarmaSourcePort } from '../ports/karma-source.port';
import { SafetyService } from '../../safety/services/safety.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
export declare const KARMA_EMITTED_EVENTS: {
    readonly ENTRY_CREATED: "zuno.karma.entry_created";
    readonly ENTRY_CLASSIFIED: "zuno.karma.entry_classified";
    readonly ENTRY_CORRECTED: "zuno.karma.entry_corrected";
    readonly ENTRY_DELETED: "zuno.karma.entry_deleted";
    readonly PATTERN_DETECTED: "zuno.karma.pattern_detected";
};
export declare const KARMA_MIN_PATTERN_EVIDENCE = 3;
export interface CreateKarmaEntryParams {
    userId: string;
    text: string;
    occurredAt?: Date | null;
    challengeId?: string | null;
}
export interface ListKarmaParams {
    userId: string;
    category?: KarmaCategory;
    classification?: KarmaClassification;
    source?: KarmaEntrySource;
    challengeId?: string;
    from?: Date;
    to?: Date;
    limit: number;
    cursor?: string;
}
export interface CorrectKarmaEntryParams {
    classification?: KarmaClassification;
    category?: KarmaCategory;
    intent?: KarmaIntent;
    text?: string;
    accepted?: boolean;
    comment?: string;
    version?: number;
}
export interface KarmaIngestOutcome {
    result: KarmaIngestResult;
    entryId?: string;
    message: string;
}
export interface KarmaSummary {
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
        topCategory: KarmaCategory | null;
        repairActions: number;
    };
    patterns: {
        patternType: KarmaPatternType;
        evidenceCount: number;
        lastObservedAt: string;
    }[];
}
export declare class KarmaService {
    private readonly entries;
    private readonly patterns;
    private readonly classifier;
    private readonly source;
    private readonly safety;
    private readonly outbox;
    private readonly audit;
    private readonly ownership;
    private readonly rulebook;
    private readonly clock;
    private readonly dataSource;
    private readonly logger;
    constructor(entries: Repository<ZunoKarmaEntry>, patterns: Repository<ZunoKarmaPattern>, classifier: KarmaClassifierPort, source: KarmaSourcePort, safety: SafetyService, outbox: OutboxService, audit: ZunoAuditService, ownership: ZunoOwnershipService, rulebook: RulebookRepositoryService, clock: ClockService, dataSource: DataSource);
    createUserEntry(params: CreateKarmaEntryParams): Promise<{
        entry: ZunoKarmaEntry;
        confirmationRequired: boolean;
        explanation: string;
    }>;
    handleActionCompleted(payload: unknown): Promise<KarmaIngestOutcome>;
    private record;
    private score;
    list(params: ListKarmaParams): Promise<{
        items: ZunoKarmaEntry[];
        nextCursor: string | null;
    }>;
    findOwned(userId: string, entryId: string): Promise<ZunoKarmaEntry>;
    summary(userId: string): Promise<KarmaSummary>;
    correct(userId: string, entryId: string, params: CorrectKarmaEntryParams): Promise<ZunoKarmaEntry>;
    remove(userId: string, entryId: string): Promise<void>;
    private refreshPatterns;
    private isInterpretationAvailable;
    private routeToSafety;
    private findIngestDuplicate;
    private findUserTextDuplicate;
    private recentEntriesFor;
    private explanationFor;
    private nonPenalisingMessage;
    private truncateLabel;
}
