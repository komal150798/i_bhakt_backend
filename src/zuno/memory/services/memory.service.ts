import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { ZunoMemory } from '../entities/zuno-memory.entity';
import { ZunoMemoryCandidate } from '../entities/zuno-memory-candidate.entity';
import { ZunoMemoryEvidence } from '../entities/zuno-memory-evidence.entity';
import { ZunoMemoryConflict } from '../entities/zuno-memory-conflict.entity';
import { MemorySummaryGroup, MemoryValue } from '../entities/memory.types';
import {
  MEMORY_SOURCE_AUTHORITY,
  MemoryCandidateStatus,
  MemoryConflictResolution,
  MemoryEvidenceRole,
  MemoryEvidenceType,
  MemoryFactuality,
  MemoryRejectionReason,
  MemoryRequestContext,
  MemoryRetentionClass,
  MemoryScope,
  MemorySensitivity,
  MemorySource,
  MemoryStatus,
  MemoryType,
} from '../enums/memory.enum';
import {
  MemoryRetrievalQuery,
  MemoryRetrievalResult,
  selectRelevantMemories,
} from '../retrieval/memory-relevance';
import {
  assessWorthiness,
  classifySensitivity,
  confirmationRequirement,
  ConfirmationReason,
  contradicts,
  defaultExpiryDays,
  defaultRetention,
  isUnworthy,
} from './memory-policy';
import {
  asAggregateType,
  asEventType,
  MemoryAggregateType,
  MemoryEventType,
} from '../events/memory-events';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { SafetyService } from '../../safety/services/safety.service';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';

/**
 * Upper bound on rows pulled from the database before relevance filtering.
 *
 * Retrieval is already narrowed in SQL by (user_id, status) - the index
 * `idx_zuno_memories_user_type_status` covers it - but a user with years of
 * history could still have more ACTIVE rows than is sensible to load. The cap
 * is ordered by last confirmation so the slice that is loaded is the live end
 * of the store, not an arbitrary page.
 */
const RETRIEVAL_FETCH_CAP = 400;

export interface ProposeCandidateParams {
  userId: string;
  challengeId?: string | null;
  type: MemoryType;
  key: string;
  value: MemoryValue;
  source: MemorySource;
  evidenceType: MemoryEvidenceType;
  confidence: number;
  /** Step 18 section 46. Defaults to FACT only when the caller means it. */
  factuality?: MemoryFactuality;
  sourceEventId?: string | null;
  retentionClass?: MemoryRetentionClass;
  /** Structured provenance, written to zuno_memory_evidence. */
  evidence?: {
    sourceEntityType: string;
    sourceEntityId: string;
    role?: MemoryEvidenceRole;
    observedAt?: Date;
  }[];
  /** Pre-counted distinct evidence for a PATTERN candidate (section 18). */
  evidenceCount?: number;
}

export interface ProposeCandidateResult {
  candidate: ZunoMemoryCandidate | null;
  memory: ZunoMemory | null;
  /** Populated when nothing was stored, so callers can log a reason label. */
  rejectedReason: MemoryRejectionReason | null;
  /** Populated when the candidate is waiting on the user. */
  confirmationReason: ConfirmationReason | null;
  /** True when an existing memory absorbed this observation (section 59). */
  merged: boolean;
}

export interface RetrieveParams
  extends Omit<MemoryRetrievalQuery, 'now'> {
  now?: Date;
}

export interface CorrectMemoryParams {
  userId: string;
  memoryId: string;
  /** The user's own words for what is actually true. */
  statement: string;
  label?: string;
  expectedVersion?: number;
}

/**
 * The memory lifecycle. Roadmap section 68, Step 18, Build Rule 37.
 *
 * Implements, in order:
 *   candidate -> confirmation (where the specification requires it) ->
 *   retrieval -> correction -> supersession -> expiry -> deletion
 *
 * The organising principle is Step 18 section 85. Everything a model might be
 * good at - noticing that something matters, phrasing it - happens upstream and
 * arrives here as a *proposal*. Everything that decides what ZUNO actually
 * believes about a person - worthiness, sensitivity, retention, provenance,
 * supersession, expiry, deletion, and which memories may influence a prompt -
 * is decided here, deterministically.
 *
 * Safety runs before anything is written. A memory is durable state that will
 * be fed back into future prompts, so admitting unsafe content here would carry
 * it forward indefinitely; the pre-check at the write boundary is the cheapest
 * place to stop that.
 */
@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(
    @InjectRepository(ZunoMemory)
    private readonly memories: Repository<ZunoMemory>,
    @InjectRepository(ZunoMemoryCandidate)
    private readonly candidates: Repository<ZunoMemoryCandidate>,
    @InjectRepository(ZunoMemoryEvidence)
    private readonly evidence: Repository<ZunoMemoryEvidence>,
    @InjectRepository(ZunoMemoryConflict)
    private readonly conflicts: Repository<ZunoMemoryConflict>,
    private readonly safety: SafetyService,
    private readonly outbox: OutboxService,
    private readonly audit: ZunoAuditService,
    private readonly ownership: ZunoOwnershipService,
    private readonly clock: ClockService,
    private readonly dataSource: DataSource,
  ) {}

  // =========================================================================
  // 1. CANDIDATE
  // =========================================================================

  /**
   * Evaluates a proposed memory and either stores it, queues it for the user's
   * confirmation, merges it into an existing memory, or refuses it.
   *
   * Step 18 section 56 is the pipeline, and the order matters:
   *   safety/privacy -> worthiness -> classification -> duplicate/conflict ->
   *   retention -> write/supersede/merge -> audit
   *
   * Never throws on refusal. Step 18 section 96: a failed or refused memory
   * write must not fail the user's actual action.
   */
  async proposeCandidate(
    params: ProposeCandidateParams,
  ): Promise<ProposeCandidateResult> {
    const statement = (params.value?.statement ?? '').trim();
    const factuality = params.factuality ?? MemoryFactuality.FACT;
    const scope =
      params.challengeId != null ? MemoryScope.CHALLENGE : MemoryScope.GLOBAL;

    // ---- Safety and privacy filter, before anything is persisted ----------
    // Step 18 section 6 places this immediately after candidate extraction. A
    // memory outlives the conversation that produced it, so content blocked at
    // the response boundary must not be admitted here and replayed later.
    const assessment = this.safety.preCheck({
      operation: 'MEMORY_CANDIDATE',
      userId: params.userId,
      challengeId: params.challengeId ?? null,
      text: statement,
      domains: [],
    });
    if (assessment.blocked) {
      this.logger.warn(
        `Memory candidate refused by safety pre-check (risk=${assessment.riskLevel})`,
      );
      return refusal(MemoryRejectionReason.SAFETY_BLOCKED);
    }

    // ---- Worthiness -------------------------------------------------------
    const verdict = assessWorthiness({
      type: params.type,
      statement,
      evidenceType: params.evidenceType,
      confidence: params.confidence,
      factuality,
      evidenceCount: params.evidenceCount ?? params.evidence?.length ?? 0,
    });
    if (isUnworthy(verdict)) {
      this.logger.debug(`Memory candidate refused: ${verdict.reason}`);
      return refusal(verdict.reason);
    }

    // ---- Idempotency (section 95) ----------------------------------------
    // The triple is (source_event_id, memory key, scope). Reprocessing the same
    // event must not create a second memory.
    if (params.sourceEventId) {
      const existing = await this.memories.findOne({
        where: {
          user_id: params.userId,
          memory_key: params.key,
          source_event_id: params.sourceEventId,
          status: MemoryStatus.ACTIVE,
        },
      });
      if (existing) {
        return {
          candidate: null,
          memory: existing,
          rejectedReason: null,
          confirmationReason: null,
          merged: true,
        };
      }
    }

    // ---- Classification ---------------------------------------------------
    const sensitivity = classifySensitivity(params.type, statement);
    const retention =
      params.retentionClass ?? defaultRetention(params.type, factuality);

    // ---- Duplicate / conflict check --------------------------------------
    const incumbent = await this.findActiveByKey(
      params.userId,
      params.key,
      params.challengeId ?? null,
    );

    // Step 18 section 59: "prefers concise answers" must not become seventeen
    // memories. An identical statement updates confirmation metadata instead.
    if (
      incumbent &&
      incumbent.memory_value?.statement?.trim().toLowerCase() ===
        statement.toLowerCase()
    ) {
      const merged = await this.recordConfirmation(
        incumbent,
        params.confidence,
        params.evidence,
      );
      return {
        candidate: null,
        memory: merged,
        rejectedReason: null,
        confirmationReason: null,
        merged: true,
      };
    }

    const conflictsWithActive =
      incumbent != null &&
      contradicts(
        { memory_key: incumbent.memory_key, factuality: incumbent.factuality },
        { memory_key: params.key, factuality },
      );

    // ---- Confirmation requirement ----------------------------------------
    const confirmation = confirmationRequirement({
      evidenceType: params.evidenceType,
      confidence: params.confidence,
      sensitivity,
      type: params.type,
      conflictsWithActive,
      source: params.source,
    });

    return this.dataSource.transaction(async (manager) => {
      const now = this.clock.now();

      const candidate = manager.create(ZunoMemoryCandidate, {
        user_id: params.userId,
        challenge_id: params.challengeId ?? null,
        scope,
        memory_type: params.type,
        memory_key: params.key,
        proposed_value: { ...params.value, statement },
        factuality,
        source: params.source,
        source_event_id: params.sourceEventId ?? null,
        evidence_type: params.evidenceType,
        confidence: clampConfidence(params.confidence),
        suggested_retention: retention,
        sensitivity_class: sensitivity,
        status: confirmation
          ? MemoryCandidateStatus.AWAITING_CONFIRMATION
          : MemoryCandidateStatus.ACCEPTED,
        confirmation_required: confirmation !== null,
        confirmation_reason: confirmation,
        rejection_reason: null,
        resulting_memory_id: null,
        decided_at: confirmation ? null : now,
      });
      const savedCandidate = await manager.save(ZunoMemoryCandidate, candidate);

      await this.outbox.enqueue(manager, {
        aggregateType: asAggregateType(MemoryAggregateType.MEMORY_CANDIDATE),
        aggregateId: savedCandidate.id,
        eventType: asEventType(MemoryEventType.CANDIDATE_CREATED),
        payload: {
          candidate_id: savedCandidate.id,
          user_id: params.userId,
          memory_type: params.type,
          confirmation_required: confirmation !== null,
        },
      });

      // Step 18 section 30: a contradiction is recorded, never silently merged.
      if (conflictsWithActive && incumbent) {
        await this.recordConflict(manager, {
          userId: params.userId,
          incumbent,
          incomingSource: params.source,
        });
      }

      if (confirmation) {
        // Nothing durable is written. ZUNO will ask.
        this.logger.debug(
          `Memory candidate ${savedCandidate.id} awaiting confirmation: ${confirmation}`,
        );
        return {
          candidate: savedCandidate,
          memory: null,
          rejectedReason: null,
          confirmationReason: confirmation,
          merged: false,
        };
      }

      const memory = await this.writeMemory(manager, {
        candidate: savedCandidate,
        retention,
        incumbent,
        now,
      });

      savedCandidate.resulting_memory_id = memory.id;
      savedCandidate.proposed_value = null; // content now lives on the memory
      await manager.save(ZunoMemoryCandidate, savedCandidate);

      return {
        candidate: savedCandidate,
        memory,
        rejectedReason: null,
        confirmationReason: null,
        merged: false,
      };
    });
  }

  // =========================================================================
  // 2. CONFIRMATION
  // =========================================================================

  /**
   * The user says yes to a candidate ZUNO would not store on its own.
   *
   * Step 18 section 24 and section 30: an inference below the auto-accept
   * threshold, a sensitive classification, a derived pattern or a contradiction
   * with active memory all wait here. Confirming turns the evidence type into
   * an explicit user act, which is why the stored memory carries
   * USER_EXPLICIT source authority rather than the proposing engine's.
   */
  async confirmCandidate(
    userId: string,
    candidateId: string,
  ): Promise<ZunoMemory> {
    const candidate = await this.candidates.findOne({
      where: { id: candidateId, deleted_at: IsNull() },
    });
    const owned = this.ownership.require(candidate, userId, 'memory candidate');

    if (owned.status !== MemoryCandidateStatus.AWAITING_CONFIRMATION) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `candidate ${candidateId} is ${owned.status}, not awaiting confirmation`,
      });
    }
    if (!owned.proposed_value) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `candidate ${candidateId} has no proposed value to confirm`,
      });
    }

    const incumbent = await this.findActiveByKey(
      userId,
      owned.memory_key,
      owned.challenge_id,
    );

    return this.dataSource.transaction(async (manager) => {
      const now = this.clock.now();

      // The user confirming is itself an explicit statement (section 31).
      owned.evidence_type = MemoryEvidenceType.EXPLICIT;
      owned.source = MemorySource.USER_EXPLICIT;
      owned.status = MemoryCandidateStatus.ACCEPTED;
      owned.decided_at = now;

      const memory = await this.writeMemory(manager, {
        candidate: owned,
        retention: owned.suggested_retention,
        incumbent,
        now,
      });

      owned.resulting_memory_id = memory.id;
      owned.proposed_value = null;
      await manager.save(ZunoMemoryCandidate, owned);

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: userId,
        userId,
        action: 'MEMORY_CANDIDATE_CONFIRMED',
        entityType: 'ZunoMemoryCandidate',
        entityId: owned.id,
        after: { memory_id: memory.id },
      });

      return memory;
    });
  }

  /** The user says no. Step 18 section 52: users can decline what ZUNO keeps. */
  async rejectCandidate(
    userId: string,
    candidateId: string,
    reason: MemoryRejectionReason = MemoryRejectionReason.USER_REJECTED,
  ): Promise<ZunoMemoryCandidate> {
    const candidate = await this.candidates.findOne({
      where: { id: candidateId, deleted_at: IsNull() },
    });
    const owned = this.ownership.require(candidate, userId, 'memory candidate');

    return this.dataSource.transaction(async (manager) => {
      owned.status = MemoryCandidateStatus.REJECTED;
      owned.rejection_reason = reason;
      owned.decided_at = this.clock.now();
      // Step 18 section 116: keep the audit label, drop the content.
      owned.proposed_value = null;
      const saved = await manager.save(ZunoMemoryCandidate, owned);

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: userId,
        userId,
        action: 'MEMORY_CANDIDATE_REJECTED',
        entityType: 'ZunoMemoryCandidate',
        entityId: owned.id,
        metadata: { reason },
      });
      return saved;
    });
  }

  // =========================================================================
  // 3. RETRIEVAL
  // =========================================================================

  /**
   * Returns only the memories relevant to the stated purpose.
   *
   * Roadmap section 69 and Step 18 Rule 6. The ranking and the three bounds are
   * documented at length in `retrieval/memory-relevance.ts`; this method's job
   * is to narrow in SQL first and then hand a bounded array to that pure
   * function.
   *
   * The SQL predicate below is an optimisation, not the control. Admissibility
   * is re-checked in memory for every row, so a memory cannot become visible by
   * way of a query that forgot a predicate - which is the failure mode Step 24
   * section 165 cares about.
   */
  async retrieve(params: RetrieveParams): Promise<MemoryRetrievalResult> {
    const rows = await this.memories.find({
      where: {
        user_id: params.userId,
        status: MemoryStatus.ACTIVE,
        deleted_at: IsNull(),
        redacted_at: IsNull(),
      },
      order: { last_confirmed_at: 'DESC' },
      take: RETRIEVAL_FETCH_CAP,
    });

    return selectRelevantMemories(rows, {
      ...params,
      now: params.now ?? this.clock.now(),
    });
  }

  /**
   * "What do you remember about me?" Step 18 section 53, Step 21 section 59.
   *
   * Grouped, user-readable, and deliberately not the retrieval path: this is a
   * transparency surface, so it shows everything currently ACTIVE rather than
   * only what would be relevant to a question. It still excludes deleted,
   * superseded and expired rows, and it never exposes embeddings, prompts or
   * internal reasoning.
   */
  async summaryForUser(userId: string): Promise<MemorySummaryGroup[]> {
    const rows = await this.memories.find({
      where: {
        user_id: userId,
        status: MemoryStatus.ACTIVE,
        deleted_at: IsNull(),
        redacted_at: IsNull(),
      },
      order: { memory_type: 'ASC', last_confirmed_at: 'DESC' },
    });

    const groups = new Map<MemoryType, MemorySummaryGroup>();
    for (const row of rows) {
      if (!groups.has(row.memory_type)) {
        groups.set(row.memory_type, {
          type: row.memory_type,
          label: humanTypeLabel(row.memory_type),
          items: [],
        });
      }
      groups.get(row.memory_type).items.push({
        id: row.id,
        statement: row.memory_value?.statement ?? '',
        scope: row.scope,
        challengeId: row.challenge_id,
        why: whyItMatters(row),
        lastConfirmedAt: row.last_confirmed_at
          ? row.last_confirmed_at.toISOString()
          : null,
        expiresAt: row.expires_at ? row.expires_at.toISOString() : null,
      });
    }
    return Array.from(groups.values());
  }

  /**
   * The flat list behind `GET /api/v1/memory`. Step 21 sections 58-59.
   *
   * Like `summaryForUser`, this is a transparency surface rather than the
   * retrieval path, so it is not relevance-filtered - the user asked to see
   * what ZUNO keeps, and answering "only the relevant bits" would be evasive.
   * Deleted, superseded and expired rows are still excluded, because those are
   * not things ZUNO keeps.
   */
  async listForUser(
    userId: string,
    filters: {
      type?: MemoryType;
      challengeId?: string;
      scope?: MemoryScope;
    } = {},
  ): Promise<ZunoMemory[]> {
    return this.memories.find({
      where: {
        user_id: userId,
        status: MemoryStatus.ACTIVE,
        deleted_at: IsNull(),
        redacted_at: IsNull(),
        ...(filters.type ? { memory_type: filters.type } : {}),
        ...(filters.challengeId ? { challenge_id: filters.challengeId } : {}),
        ...(filters.scope ? { scope: filters.scope } : {}),
      },
      order: { last_confirmed_at: 'DESC' },
    });
  }

  /**
   * Candidates ZUNO is holding back until the user decides.
   * Step 18 sections 24 and 51.
   */
  async pendingCandidates(userId: string): Promise<ZunoMemoryCandidate[]> {
    return this.candidates.find({
      where: {
        user_id: userId,
        status: MemoryCandidateStatus.AWAITING_CONFIRMATION,
        deleted_at: IsNull(),
      },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  /** Ownership-checked single read. */
  async findOwned(userId: string, memoryId: string): Promise<ZunoMemory> {
    const memory = await this.memories.findOne({
      where: { id: memoryId, deleted_at: IsNull() },
    });
    return this.ownership.require(memory, userId, 'memory');
  }

  // =========================================================================
  // 4. CORRECTION
  // =========================================================================

  /**
   * The user tells ZUNO it got something wrong.
   *
   * Step 18 sections 19, 55 and Golden Test 104. The correction does not edit
   * the old row: it writes a new memory with USER_CORRECTION authority that
   * supersedes it. Step 18 section 29 - historical context remains auditable -
   * and Rule 3 - an explicit current correction outranks an older inference.
   *
   * Editing in place would be simpler and wrong. It would erase the fact that
   * ZUNO believed something else, which is precisely the information a later
   * Realignment needs (Rule 14).
   */
  async correct(params: CorrectMemoryParams): Promise<ZunoMemory> {
    const existing = await this.findOwned(params.userId, params.memoryId);
    this.ownership.assertVersion(existing, params.expectedVersion);

    if (existing.status !== MemoryStatus.ACTIVE) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        internalDetail: `cannot correct a ${existing.status} memory`,
      });
    }

    const statement = (params.statement ?? '').trim();
    if (statement.length === 0) {
      throw ZunoException.validation([{ field: 'statement', code: 'REQUIRED' }]);
    }

    const assessment = this.safety.preCheck({
      operation: 'MEMORY_CORRECT',
      userId: params.userId,
      challengeId: existing.challenge_id,
      text: statement,
      domains: [],
    });
    if (assessment.blocked) {
      throw new ZunoException(ZunoErrorCode.SAFETY_RESTRICTED, {
        message:
          assessment.boundaryMessage ??
          'I am not able to store that here, and I would rather say so plainly.',
        safety: { disposition: assessment.disposition },
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const now = this.clock.now();
      const value: MemoryValue = {
        ...existing.memory_value,
        statement,
        label: params.label ?? existing.memory_value?.label,
      };

      const corrected = manager.create(ZunoMemory, {
        user_id: existing.user_id,
        challenge_id: existing.challenge_id,
        scope: existing.scope,
        memory_type: existing.memory_type,
        memory_key: existing.memory_key,
        memory_value: value,
        factuality: existing.factuality,
        // Step 18 section 31: the top of the authority ladder.
        source: MemorySource.USER_CORRECTION,
        source_event_id: null,
        evidence_type: MemoryEvidenceType.EXPLICIT,
        confidence: '1.000',
        retention_class: existing.retention_class,
        sensitivity_class: classifySensitivity(existing.memory_type, statement),
        status: MemoryStatus.ACTIVE,
        last_confirmed_at: now,
        confirmation_count: 1,
        expires_at: null,
        supersedes_memory_id: existing.id,
        superseded_by_memory_id: null,
        superseded_at: null,
        redacted_at: null,
        deletion_reason: null,
      });
      const saved = await manager.save(ZunoMemory, corrected);

      await this.markSuperseded(manager, existing, saved, now);

      await this.evidenceRow(manager, {
        memoryId: saved.id,
        sourceEntityType: 'ZunoMemory',
        sourceEntityId: existing.id,
        role: MemoryEvidenceRole.ORIGIN,
        observedAt: now,
      });

      // The conflict is opened and closed in the same breath, because authority
      // settles it: a current explicit correction outranks whatever was there.
      // Recording it anyway keeps the resolution auditable (section 30).
      const conflict = manager.create(ZunoMemoryConflict, {
        user_id: existing.user_id,
        memory_a_id: existing.id,
        memory_b_id: saved.id,
        resolution_status: MemoryConflictResolution.RESOLVED_BY_USER,
        resolved_memory_id: saved.id,
        authority_a: MEMORY_SOURCE_AUTHORITY[existing.source] ?? 40,
        authority_b: MEMORY_SOURCE_AUTHORITY[MemorySource.USER_CORRECTION],
        resolved_at: now,
      });
      await manager.save(ZunoMemoryConflict, conflict);

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: params.userId,
        userId: params.userId,
        action: 'MEMORY_CORRECTED',
        entityType: 'ZunoMemory',
        entityId: saved.id,
        before: { memory_id: existing.id, status: MemoryStatus.ACTIVE },
        after: { memory_id: saved.id, supersedes: existing.id },
      });

      await this.outbox.enqueueMany(manager, [
        {
          aggregateType: asAggregateType(MemoryAggregateType.MEMORY),
          aggregateId: saved.id,
          eventType: asEventType(MemoryEventType.CORRECTED),
          payload: {
            memory_id: saved.id,
            superseded_memory_id: existing.id,
            user_id: params.userId,
            memory_type: saved.memory_type,
          },
        },
        {
          aggregateType: asAggregateType(MemoryAggregateType.MEMORY),
          aggregateId: existing.id,
          eventType: asEventType(MemoryEventType.SUPERSEDED),
          payload: {
            memory_id: existing.id,
            superseded_by_memory_id: saved.id,
            user_id: params.userId,
          },
        },
      ]);

      return saved;
    });
  }

  // =========================================================================
  // 5. SUPERSESSION
  // =========================================================================

  /**
   * Replaces an active memory with a newer one under the same key.
   *
   * Step 18 section 29. The example in the specification is the shape: MEM-101
   * "current role at Company A", MEM-205 "employment ended", the second
   * superseding the first while the first remains readable.
   *
   * Authority decides whether supersession is allowed at all (section 31): a
   * SYSTEM_DERIVED inference may not quietly overwrite something the user said
   * explicitly. When the incoming source is weaker, the incumbent stands and a
   * conflict row is left for resolution rather than the two being blended
   * together (section 30).
   */
  async supersede(
    manager: EntityManager,
    incumbent: ZunoMemory,
    replacement: ZunoMemory,
    now: Date,
  ): Promise<{ superseded: boolean }> {
    const incumbentAuthority = MEMORY_SOURCE_AUTHORITY[incumbent.source] ?? 40;
    const incomingAuthority = MEMORY_SOURCE_AUTHORITY[replacement.source] ?? 40;

    if (incomingAuthority < incumbentAuthority) {
      await this.recordConflict(manager, {
        userId: incumbent.user_id,
        incumbent,
        incomingSource: replacement.source,
        challengerId: replacement.id,
      });
      return { superseded: false };
    }

    await this.markSuperseded(manager, incumbent, replacement, now);
    await this.outbox.enqueue(manager, {
      aggregateType: asAggregateType(MemoryAggregateType.MEMORY),
      aggregateId: incumbent.id,
      eventType: asEventType(MemoryEventType.SUPERSEDED),
      payload: {
        memory_id: incumbent.id,
        superseded_by_memory_id: replacement.id,
        user_id: incumbent.user_id,
      },
    });
    return { superseded: true };
  }

  /**
   * Walks the supersession chain backwards from a memory.
   * Step 18 section 29: historical context remains auditable.
   */
  async supersessionChain(
    userId: string,
    memoryId: string,
  ): Promise<ZunoMemory[]> {
    const chain: ZunoMemory[] = [];
    let current = await this.findOwned(userId, memoryId);
    const seen = new Set<string>();

    while (current) {
      if (seen.has(current.id)) break; // defensive: never loop on bad data
      seen.add(current.id);
      chain.push(current);
      if (!current.supersedes_memory_id) break;
      current = await this.memories.findOne({
        where: { id: current.supersedes_memory_id, user_id: userId },
      });
    }
    return chain;
  }

  // =========================================================================
  // 6. EXPIRY
  // =========================================================================

  /**
   * Moves memories past their expiry date to EXPIRED.
   *
   * Step 18 sections 20 and 28: "interview tomorrow" is useful for a day and
   * then must stop shaping guidance. Retrieval already refuses an expired row
   * at read time, so this sweep is about keeping the store honest and emitting
   * the event, not about being the only line of defence.
   */
  async expireDue(options: { userId?: string; now?: Date } = {}): Promise<number> {
    const now = options.now ?? this.clock.now();
    const due = await this.memories.find({
      where: {
        ...(options.userId ? { user_id: options.userId } : {}),
        status: MemoryStatus.ACTIVE,
        expires_at: LessThanOrEqual(now),
        deleted_at: IsNull(),
      },
      take: 500,
    });
    if (due.length === 0) return 0;

    return this.dataSource.transaction(async (manager) => {
      for (const memory of due) {
        memory.status = MemoryStatus.EXPIRED;
        await manager.save(ZunoMemory, memory);
        await this.outbox.enqueue(manager, {
          aggregateType: asAggregateType(MemoryAggregateType.MEMORY),
          aggregateId: memory.id,
          eventType: asEventType(MemoryEventType.EXPIRED),
          payload: {
            memory_id: memory.id,
            user_id: memory.user_id,
            memory_type: memory.memory_type,
          },
        });
      }
      return due.length;
    });
  }

  /**
   * Step 18 section 65: when a challenge resolves, its memory becomes
   * historical rather than continuing to be injected into unrelated
   * conversations.
   *
   * Challenge-lifetime memories are expired outright. Anything the user pinned,
   * or that is global in nature, is left alone - section 66 allows a later
   * similar challenge to draw on relevant historical lessons, and deleting them
   * here would make that impossible.
   */
  async closeChallengeMemory(
    userId: string,
    challengeId: string,
  ): Promise<number> {
    const rows = await this.memories.find({
      where: {
        user_id: userId,
        challenge_id: challengeId,
        status: MemoryStatus.ACTIVE,
        retention_class: MemoryRetentionClass.CHALLENGE_LIFETIME,
        deleted_at: IsNull(),
      },
    });
    if (rows.length === 0) return 0;

    return this.dataSource.transaction(async (manager) => {
      const now = this.clock.now();
      for (const memory of rows) {
        memory.status = MemoryStatus.EXPIRED;
        memory.expires_at = now;
        await manager.save(ZunoMemory, memory);
        await this.outbox.enqueue(manager, {
          aggregateType: asAggregateType(MemoryAggregateType.MEMORY),
          aggregateId: memory.id,
          eventType: asEventType(MemoryEventType.EXPIRED),
          payload: {
            memory_id: memory.id,
            user_id: userId,
            challenge_id: challengeId,
            reason: 'CHALLENGE_CLOSED',
          },
        });
      }
      return rows.length;
    });
  }

  // =========================================================================
  // 7. DELETION
  // =========================================================================

  /**
   * The user asks ZUNO to forget something.
   *
   * Step 18 section 54, Step 24 sections 41 and 165, Build Rule 38. The
   * acceptance criterion for this whole phase is that a deleted memory stops
   * influencing retrieval, AI context, Future Self and Plans - so deletion does
   * three separate things, any one of which would be enough on its own, which
   * is the point:
   *
   *   1. status -> DELETED. `RETRIEVABLE_MEMORY_STATUSES` is an allow-list
   *      containing only ACTIVE, so retrieval drops it.
   *   2. redacted_at set and memory_value cleared of content. Even a query that
   *      forgot the status predicate has nothing left to put in a prompt.
   *   3. soft delete timestamp set, so ordinary repository reads exclude it.
   *
   * The row survives because Step 24 section 95 distinguishes privacy deletion
   * from row removal and requires audit metadata - but it survives as a
   * tombstone with a reason label, not as the content the user asked us to
   * forget.
   */
  async deleteMemory(
    userId: string,
    memoryId: string,
    reason = 'USER_REQUESTED',
  ): Promise<void> {
    const memory = await this.findOwned(userId, memoryId);

    await this.dataSource.transaction(async (manager) => {
      const now = this.clock.now();
      const beforeStatus = memory.status;

      memory.status = MemoryStatus.DELETED;
      memory.redacted_at = now;
      memory.deleted_at = now;
      memory.deletion_reason = reason;
      // Step 18 section 54: record audit metadata without retaining prohibited
      // content. The key and type stay so quality metrics still work; the
      // statement does not.
      memory.memory_value = { statement: '', label: memory.memory_value?.label };
      memory.expires_at = now;
      await manager.save(ZunoMemory, memory);

      // Any candidate that produced it, or is still proposing it, goes too -
      // otherwise a pending candidate would re-create what was just deleted.
      const relatedCandidates = await manager.find(ZunoMemoryCandidate, {
        where: [
          { resulting_memory_id: memory.id },
          {
            user_id: userId,
            memory_key: memory.memory_key,
            status: MemoryCandidateStatus.AWAITING_CONFIRMATION,
          },
        ],
      });
      for (const candidate of relatedCandidates) {
        candidate.proposed_value = null;
        if (candidate.status === MemoryCandidateStatus.AWAITING_CONFIRMATION) {
          candidate.status = MemoryCandidateStatus.REJECTED;
          candidate.rejection_reason = MemoryRejectionReason.USER_REJECTED;
          candidate.decided_at = now;
        }
        await manager.save(ZunoMemoryCandidate, candidate);
      }

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: userId,
        userId,
        action: 'MEMORY_DELETED',
        entityType: 'ZunoMemory',
        entityId: memory.id,
        before: { status: beforeStatus },
        after: { status: MemoryStatus.DELETED },
        metadata: { reason, memory_type: memory.memory_type },
      });

      await this.outbox.enqueue(manager, {
        aggregateType: asAggregateType(MemoryAggregateType.MEMORY),
        aggregateId: memory.id,
        eventType: asEventType(MemoryEventType.DELETED),
        payload: {
          memory_id: memory.id,
          user_id: userId,
          memory_type: memory.memory_type,
          reason,
          // Step 24 section 165: downstream indexes and caches must be
          // invalidated. No such index exists yet; the event is the hook that
          // will drive it, and publishing it now means the contract is in place
          // before anything depends on it.
          invalidate_downstream: true,
        },
      });
    });
  }

  /**
   * Bulk forget for one challenge. Step 18 section 52: "clear challenge
   * memory" is one of the controls the product must offer.
   */
  async deleteChallengeMemory(
    userId: string,
    challengeId: string,
  ): Promise<number> {
    const rows = await this.memories.find({
      where: {
        user_id: userId,
        challenge_id: challengeId,
        status: MemoryStatus.ACTIVE,
        deleted_at: IsNull(),
      },
    });
    for (const row of rows) {
      await this.deleteMemory(userId, row.id, 'USER_CLEARED_CHALLENGE');
    }
    return rows.length;
  }

  // =========================================================================
  // Internals
  // =========================================================================

  /** The single place a ZunoMemory row is created from an accepted candidate. */
  private async writeMemory(
    manager: EntityManager,
    params: {
      candidate: ZunoMemoryCandidate;
      retention: MemoryRetentionClass;
      incumbent: ZunoMemory | null;
      now: Date;
    },
  ): Promise<ZunoMemory> {
    const { candidate, retention, incumbent, now } = params;
    const expiryDays = defaultExpiryDays(retention);

    const memory = manager.create(ZunoMemory, {
      user_id: candidate.user_id,
      challenge_id: candidate.challenge_id,
      scope: candidate.scope,
      memory_type: candidate.memory_type,
      memory_key: candidate.memory_key,
      memory_value: candidate.proposed_value,
      factuality: candidate.factuality,
      source: candidate.source,
      source_event_id: candidate.source_event_id,
      evidence_type: candidate.evidence_type,
      confidence: candidate.confidence,
      retention_class: retention,
      sensitivity_class: candidate.sensitivity_class,
      status: MemoryStatus.ACTIVE,
      last_confirmed_at: now,
      confirmation_count: 1,
      expires_at:
        expiryDays === null
          ? null
          : new Date(now.getTime() + expiryDays * 86_400_000),
      supersedes_memory_id: incumbent ? incumbent.id : null,
      superseded_by_memory_id: null,
      superseded_at: null,
      redacted_at: null,
      deletion_reason: null,
    });
    const saved = await manager.save(ZunoMemory, memory);

    if (incumbent) {
      await this.supersede(manager, incumbent, saved, now);
    }

    await this.evidenceRow(manager, {
      memoryId: saved.id,
      sourceEntityType: 'ZunoMemoryCandidate',
      sourceEntityId: candidate.id,
      role: MemoryEvidenceRole.ORIGIN,
      observedAt: now,
    });

    await this.audit.record(manager, {
      actorType: candidate.source === MemorySource.USER_EXPLICIT ? 'USER' : 'SYSTEM',
      actorId: candidate.user_id,
      userId: candidate.user_id,
      action: 'MEMORY_CREATED',
      entityType: 'ZunoMemory',
      entityId: saved.id,
      after: { memory_type: saved.memory_type, status: saved.status },
    });

    await this.outbox.enqueue(manager, {
      aggregateType: asAggregateType(MemoryAggregateType.MEMORY),
      aggregateId: saved.id,
      eventType: asEventType(MemoryEventType.CREATED),
      payload: {
        memory_id: saved.id,
        user_id: saved.user_id,
        memory_type: saved.memory_type,
        challenge_id: saved.challenge_id,
        retention_class: saved.retention_class,
      },
    });

    return saved;
  }

  private async markSuperseded(
    manager: EntityManager,
    incumbent: ZunoMemory,
    replacement: ZunoMemory,
    now: Date,
  ): Promise<void> {
    incumbent.status = MemoryStatus.SUPERSEDED;
    incumbent.superseded_by_memory_id = replacement.id;
    incumbent.superseded_at = now;
    await manager.save(ZunoMemory, incumbent);
  }

  /**
   * Step 18 section 59: re-observing something already known updates
   * confirmation metadata rather than writing another row. Confidence moves
   * towards 1 but never past it, and the count is what later lets a repeated
   * observation support a PATTERN (section 18).
   */
  private async recordConfirmation(
    memory: ZunoMemory,
    observedConfidence: number,
    evidence: ProposeCandidateParams['evidence'],
  ): Promise<ZunoMemory> {
    return this.dataSource.transaction(async (manager) => {
      const now = this.clock.now();
      const current = Number.parseFloat(memory.confidence) || 0;
      const blended = Math.min(
        1,
        Math.max(current, clampNumber(observedConfidence)) + 0.02,
      );
      memory.confidence = blended.toFixed(3);
      memory.last_confirmed_at = now;
      memory.confirmation_count = (memory.confirmation_count ?? 1) + 1;
      const saved = await manager.save(ZunoMemory, memory);

      for (const entry of evidence ?? []) {
        await this.evidenceRow(manager, {
          memoryId: saved.id,
          sourceEntityType: entry.sourceEntityType,
          sourceEntityId: entry.sourceEntityId,
          role: entry.role ?? MemoryEvidenceRole.CONFIRMATION,
          observedAt: entry.observedAt ?? now,
        });
      }

      await this.outbox.enqueue(manager, {
        aggregateType: asAggregateType(MemoryAggregateType.MEMORY),
        aggregateId: saved.id,
        eventType: asEventType(MemoryEventType.UPDATED),
        payload: {
          memory_id: saved.id,
          user_id: saved.user_id,
          confirmation_count: saved.confirmation_count,
        },
      });
      return saved;
    });
  }

  private async evidenceRow(
    manager: EntityManager,
    params: {
      memoryId: string;
      sourceEntityType: string;
      sourceEntityId: string;
      role: MemoryEvidenceRole;
      observedAt: Date;
    },
  ): Promise<void> {
    const row = manager.create(ZunoMemoryEvidence, {
      memory_id: params.memoryId,
      source_entity_type: params.sourceEntityType,
      source_entity_id: params.sourceEntityId,
      evidence_role: params.role,
      observed_at: params.observedAt,
      redacted_at: null,
    });
    await manager.save(ZunoMemoryEvidence, row);
  }

  private async recordConflict(
    manager: EntityManager,
    params: {
      userId: string;
      incumbent: ZunoMemory;
      incomingSource: MemorySource;
      challengerId?: string;
    },
  ): Promise<void> {
    const row = manager.create(ZunoMemoryConflict, {
      user_id: params.userId,
      memory_a_id: params.incumbent.id,
      memory_b_id: params.challengerId ?? params.incumbent.id,
      resolution_status: MemoryConflictResolution.UNRESOLVED,
      resolved_memory_id: null,
      authority_a: MEMORY_SOURCE_AUTHORITY[params.incumbent.source] ?? 40,
      authority_b: MEMORY_SOURCE_AUTHORITY[params.incomingSource] ?? 40,
      resolved_at: null,
    });
    await manager.save(ZunoMemoryConflict, row);

    await this.outbox.enqueue(manager, {
      aggregateType: asAggregateType(MemoryAggregateType.MEMORY),
      aggregateId: params.incumbent.id,
      eventType: asEventType(MemoryEventType.CONFLICT_DETECTED),
      payload: {
        user_id: params.userId,
        incumbent_memory_id: params.incumbent.id,
        incoming_source: params.incomingSource,
      },
    });
  }

  private async findActiveByKey(
    userId: string,
    key: string,
    challengeId: string | null,
  ): Promise<ZunoMemory | null> {
    return this.memories.findOne({
      where: {
        user_id: userId,
        memory_key: key,
        challenge_id: challengeId === null ? IsNull() : challengeId,
        status: MemoryStatus.ACTIVE,
        deleted_at: IsNull(),
      },
    });
  }

  /** Types the user's memory screen groups by. */
  async countByStatus(
    userId: string,
    statuses: MemoryStatus[],
  ): Promise<number> {
    return this.memories.count({
      where: { user_id: userId, status: In(statuses) },
    });
  }
}

function refusal(reason: MemoryRejectionReason): ProposeCandidateResult {
  return {
    candidate: null,
    memory: null,
    rejectedReason: reason,
    confirmationReason: null,
    merged: false,
  };
}

function clampConfidence(value: number): string {
  return clampNumber(value).toFixed(3);
}

function clampNumber(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Human labels for the memory screen. Step 18 section 53 asks for "useful
 * categories"; Step 11 Rule 5 forbids showing raw internal codes in consumer
 * UX, and a memory type is exactly such a code.
 */
function humanTypeLabel(type: MemoryType): string {
  const labels: Record<MemoryType, string> = {
    [MemoryType.PROFILE]: 'About you',
    [MemoryType.PREFERENCE]: 'How you like to be helped',
    [MemoryType.GOAL]: 'What you are working towards',
    [MemoryType.CHALLENGE]: 'What you are facing',
    [MemoryType.CONSTRAINT]: 'What limits your options',
    [MemoryType.DECISION]: 'Decisions you have made',
    [MemoryType.COMMITMENT]: 'What you said you would do',
    [MemoryType.PLAN_CONTEXT]: 'Your plan',
    [MemoryType.PROGRESS]: 'What you have done',
    [MemoryType.LIFE_EVENT]: 'Things that changed',
    [MemoryType.PATTERN]: 'What tends to work for you',
    [MemoryType.USER_CORRECTION]: 'Corrections you made',
    [MemoryType.ASTRO_CONTEXT_REFERENCE]: 'Timing context',
    [MemoryType.FUTURE_SELF_NARRATIVE]: 'Your story so far',
    [MemoryType.TEMPORARY_CONTEXT]: 'Right now',
  };
  return labels[type] ?? 'Other';
}

/**
 * A one-line reason this memory is kept. Step 24 section 40: the user should be
 * able to understand what ZUNO remembers *and why it matters*.
 *
 * Derived from the memory's own governed fields rather than generated, so it is
 * always true and never costs a model call.
 */
export function whyItMatters(memory: ZunoMemory): string {
  switch (memory.retention_class) {
    case MemoryRetentionClass.USER_PINNED:
      return 'You asked ZUNO to keep this.';
    case MemoryRetentionClass.UNTIL_SUPERSEDED:
      return 'Kept until you tell ZUNO it has changed.';
    case MemoryRetentionClass.CHALLENGE_LIFETIME:
      return 'Kept while you are working through this situation.';
    case MemoryRetentionClass.LONG_TERM:
      return 'Kept because it shapes guidance over time.';
    case MemoryRetentionClass.SHORT_TERM:
      return 'Kept briefly, then forgotten automatically.';
    case MemoryRetentionClass.SESSION:
      return 'Kept only for this conversation.';
    default:
      return 'Used to keep ZUNO consistent with what you have said.';
  }
}
