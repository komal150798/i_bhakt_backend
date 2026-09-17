import { ZunoMemory } from '../entities/zuno-memory.entity';
import {
  MEMORY_SOURCE_AUTHORITY,
  MemoryFactuality,
  MemoryRequestContext,
  MemoryRetentionClass,
  MemoryScope,
  MemorySensitivity,
  MemoryStatus,
  MemoryType,
  NON_FACTUAL_FACTUALITIES,
  RETENTION_IMPORTANCE,
  RETENTION_RECENCY_HALF_LIFE_DAYS,
  RETRIEVABLE_MEMORY_STATUSES,
  SENSITIVITY_RANK,
} from '../enums/memory.enum';

/**
 * Memory retrieval relevance. Roadmap section 69, Step 18 sections 32-34 and
 * 62, Step 18 Rule 6.
 *
 * ================================================================
 * THE RANKING, AND WHY IT IS THIS ONE
 * ================================================================
 *
 * The requirement is not "sort the memories". It is "do not dump all historical
 * user state into every prompt". Those need different machinery, so retrieval
 * is two stages and the first stage matters more than the second:
 *
 *   STAGE 1 - ADMISSIBILITY (hard, boolean, non-negotiable)
 *     A memory that fails any of these is not ranked at all. There is no score
 *     high enough to re-admit it. This is where deletion, expiry, supersession,
 *     hypothetical isolation, sensitivity and challenge scoping live, because
 *     every one of them is a correctness rule rather than a preference.
 *
 *   STAGE 2 - RELEVANCE SCORE (soft, weighted, 0..1)
 *     Only admissible memories are scored, and only those clearing
 *     `minScore` are returned. The floor is the part that makes this a filter
 *     rather than a ranking: when nothing is relevant, retrieval returns
 *     nothing, instead of padding the prompt with the least-irrelevant twelve
 *     rows it could find.
 *
 * The six factors and their weights:
 *
 *   purpose      0.30  Does this memory type serve the question being asked?
 *                      Step 18 section 33 gives a priority order per request
 *                      context, and PURPOSE_TYPE_PRIORITY is that order made
 *                      explicit. This is the largest weight because it is the
 *                      only factor that knows what the user is doing right now,
 *                      which is what "relevant" means (section 32).
 *
 *   scope        0.20  Challenge-scoped memory for *this* challenge scores 1.0;
 *                      global scores 0.6. Section 64 warns that global
 *                      constraints ("limited weekday capacity") do cross
 *                      challenges, so global is discounted, not excluded.
 *
 *   authority    0.15  Step 18 section 31's precedence ladder, normalised.
 *                      A current explicit user correction outranks an old
 *                      inference by construction, so section 118 ("current
 *                      confirmed facts always outrank stale memory") does not
 *                      depend on the model noticing.
 *
 *   importance   0.15  Retention class as a standing-importance proxy. This is
 *                      the counterweight that satisfies section 62: a newer
 *                      trivial event must not displace an older important fact.
 *
 *   confidence   0.10  Section 25: low-confidence memories have limited
 *                      influence. Small weight on purpose - confidence should
 *                      moderate influence, not decide relevance.
 *
 *   recency      0.10  Exponential decay whose half-life comes from the
 *                      retention class (section 61): an inferred short-term
 *                      behaviour fades in a fortnight, an explicit long-term
 *                      preference takes a year, a pinned memory never fades.
 *                      Deliberately the joint-smallest weight, because ranking
 *                      memory by recency is how an assistant ends up leading
 *                      with whatever was said most recently regardless of
 *                      whether it matters.
 *
 * Rejected alternatives, recorded because the choice is not obvious:
 *
 *   Vector similarity. Step 18 section 34 says explicitly "do not rely
 *   exclusively on vector similarity", and section 35 says structured state
 *   comes first. There is also no embedding store in this repository, and
 *   Build Rule 121 says not to add a dependency speculatively. Lexical overlap
 *   with the current challenge is available as an *optional* additive nudge
 *   (see `queryTerms`), never as the primary signal.
 *
 *   Letting the model choose what to recall. Step 18 section 85 puts retrieval
 *   filters on the deterministic side of the line: "AI may propose what
 *   matters. ZUNO software decides what is stored and how it is governed."
 *
 * ================================================================
 * BOUNDING
 * ================================================================
 *
 * Three independent bounds, because one is not enough:
 *   maxItems     hard row cap (default 12, the figure in section 88; ceiling 25)
 *   perTypeCap   no single memory type may take more than half the slots, so
 *                forty PROGRESS rows cannot crowd out the one DECISION that
 *                changes the answer (section 33's priority list implies breadth)
 *   charBudget   Step 18 section 33 requires retrieval to be token-budget
 *                aware. Characters are used as a proxy; the budget is applied
 *                after ranking, so the lowest-scoring items are the ones that
 *                fall off the end.
 */

export const DEFAULT_MAX_MEMORY_ITEMS = 12;
export const MAX_MEMORY_ITEMS_CEILING = 25;
export const DEFAULT_MEMORY_CHAR_BUDGET = 1600;
export const DEFAULT_MIN_RELEVANCE_SCORE = 0.35;

/** Confidence below which a memory is treated as too weak to influence output. */
export const MEMORY_CONFIDENCE_FLOOR = 0.3;

export const RELEVANCE_WEIGHTS = Object.freeze({
  purpose: 0.3,
  scope: 0.2,
  authority: 0.15,
  importance: 0.15,
  confidence: 0.1,
  recency: 0.1,
});

/** Highest authority value in the ladder, used to normalise to 0..1. */
const MAX_AUTHORITY = 100;

/**
 * Step 18 section 33's context budget priority, expressed per request purpose.
 *
 * Order is significant: index 0 is the most relevant type for that purpose.
 * A type absent from a list is not forbidden - it scores the floor value, so it
 * can still surface if its other factors are strong (a USER_PINNED correction,
 * say) but will not beat a type the purpose actually calls for.
 */
export const PURPOSE_TYPE_PRIORITY: Readonly<
  Record<MemoryRequestContext, readonly MemoryType[]>
> = {
  [MemoryRequestContext.CAREER_WEEKLY_REVIEW]: [
    MemoryType.DECISION,
    MemoryType.PROGRESS,
    MemoryType.COMMITMENT,
    MemoryType.GOAL,
    MemoryType.CONSTRAINT,
    MemoryType.PREFERENCE,
    MemoryType.PATTERN,
  ],
  [MemoryRequestContext.CHALLENGE_GUIDANCE]: [
    MemoryType.CHALLENGE,
    MemoryType.DECISION,
    MemoryType.CONSTRAINT,
    MemoryType.GOAL,
    MemoryType.COMMITMENT,
    MemoryType.PREFERENCE,
    MemoryType.LIFE_EVENT,
  ],
  [MemoryRequestContext.FUTURE_SELF_DAILY]: [
    MemoryType.COMMITMENT,
    MemoryType.PROGRESS,
    MemoryType.PLAN_CONTEXT,
    MemoryType.TEMPORARY_CONTEXT,
    MemoryType.PREFERENCE,
  ],
  [MemoryRequestContext.FUTURE_SELF_WEEKLY]: [
    MemoryType.PROGRESS,
    MemoryType.DECISION,
    MemoryType.COMMITMENT,
    MemoryType.CHALLENGE,
    MemoryType.GOAL,
    MemoryType.CONSTRAINT,
    MemoryType.PREFERENCE,
  ],
  [MemoryRequestContext.FUTURE_SELF_MILESTONE]: [
    MemoryType.LIFE_EVENT,
    MemoryType.PROGRESS,
    MemoryType.DECISION,
    MemoryType.GOAL,
    MemoryType.CHALLENGE,
  ],
  [MemoryRequestContext.FUTURE_SELF_REALIGNMENT]: [
    MemoryType.LIFE_EVENT,
    MemoryType.DECISION,
    MemoryType.PLAN_CONTEXT,
    MemoryType.CONSTRAINT,
    MemoryType.GOAL,
  ],
  [MemoryRequestContext.FUTURE_SELF_REFLECTION]: [
    MemoryType.PATTERN,
    MemoryType.PROGRESS,
    MemoryType.DECISION,
    MemoryType.GOAL,
    MemoryType.PREFERENCE,
  ],
  [MemoryRequestContext.PLAN_GENERATION]: [
    MemoryType.CONSTRAINT,
    MemoryType.DECISION,
    MemoryType.GOAL,
    MemoryType.PREFERENCE,
    MemoryType.COMMITMENT,
    MemoryType.PATTERN,
  ],
  [MemoryRequestContext.USER_MEMORY_VIEW]: [],
};

export interface MemoryRetrievalQuery {
  userId: string;
  requestContext: MemoryRequestContext;
  /** The challenge the user is currently in, if any. */
  challengeId?: string | null;
  /**
   * Challenges that are resolved/archived. Step 18 section 65/109: their
   * memory becomes historical and must not be injected into unrelated
   * conversations.
   */
  closedChallengeIds?: readonly string[];
  /** Restrict to these types. Step 18 section 88 `memory_types`. */
  memoryTypes?: readonly MemoryType[];
  maxItems?: number;
  charBudget?: number;
  minScore?: number;
  /**
   * Opt-in, purpose-bound access to sensitive memory. Step 18 section 50 and
   * Rule 11: minimum-necessary retrieval. Absent means STANDARD only, which is
   * what makes Step 18 section 110 (a sensitive fact exists but is irrelevant
   * -> do not retrieve it) the default rather than a special case.
   */
  maxSensitivity?: MemorySensitivity;
  /**
   * Opt-in access to hypothetical / forecast rows. Step 18 sections 45-47 and
   * Rules 4-5: these are never returned to a caller that did not ask for them
   * by name, so they cannot drift into a prompt as facts.
   */
  includeFactualities?: readonly MemoryFactuality[];
  /**
   * Optional lexical nudge from the current question or challenge summary.
   * Additive only, capped, and never able to admit an inadmissible memory.
   */
  queryTerms?: readonly string[];
  now?: Date;
}

export interface ScoredMemory {
  memory: ZunoMemory;
  score: number;
  factors: {
    purpose: number;
    scope: number;
    authority: number;
    importance: number;
    confidence: number;
    recency: number;
    lexical: number;
  };
}

export interface MemoryRetrievalResult {
  items: ScoredMemory[];
  /** How many admissible memories existed before bounding. Diagnostics only. */
  consideredCount: number;
  /** Dropped for score floor, per-type cap or budget. Diagnostics only. */
  droppedCount: number;
  charBudgetUsed: number;
}

/** Why a memory was not admissible. Used by tests and by debug logging. */
export type InadmissibleReason =
  | 'NOT_OWNED'
  | 'NOT_ACTIVE'
  | 'REDACTED'
  | 'SOFT_DELETED'
  | 'EXPIRED'
  | 'NON_FACTUAL'
  | 'TOO_SENSITIVE'
  | 'OTHER_CHALLENGE'
  | 'CLOSED_CHALLENGE'
  | 'TYPE_NOT_REQUESTED'
  | 'BELOW_CONFIDENCE_FLOOR';

/**
 * Stage 1. Returns null when the memory may be ranked, otherwise the reason it
 * may not be.
 *
 * Every branch here is a specification rule, and the order is chosen so the
 * cheapest and most absolute checks come first. Ownership is first because a
 * retrieval that leaks another user's memory is not a relevance problem.
 */
export function admissibility(
  memory: ZunoMemory,
  query: MemoryRetrievalQuery,
  now: Date,
): InadmissibleReason | null {
  // Step 21 section 106: never trust an id alone. Retrieval is a read path, and
  // a read path that forgets ownership is exactly how cross-user leakage
  // happens.
  if (memory.user_id !== query.userId) return 'NOT_OWNED';

  // Build Rule 38 / Step 24 section 165. DELETED, SUPERSEDED, EXPIRED and
  // PENDING_CONFIRMATION all fail this single check, by allow-list.
  if (!RETRIEVABLE_MEMORY_STATUSES.includes(memory.status)) return 'NOT_ACTIVE';

  // Belt and braces for deletion. A row whose status was somehow left ACTIVE
  // while the privacy-deletion timestamp is set must still never be retrieved:
  // Step 24 section 165 is about the content ceasing to influence anything, not
  // about one column.
  if (memory.redacted_at) return 'REDACTED';
  if (memory.deleted_at) return 'SOFT_DELETED';

  // Step 18 section 28. Expiry is enforced at read time as well as by the
  // sweep, so a memory is never used past its date merely because the periodic
  // job has not run yet.
  if (memory.expires_at && memory.expires_at.getTime() <= now.getTime()) {
    return 'EXPIRED';
  }

  // Step 18 sections 45-47, Rules 4 and 5.
  const allowedFactualities = query.includeFactualities ?? [];
  if (
    NON_FACTUAL_FACTUALITIES.includes(memory.factuality) &&
    !allowedFactualities.includes(memory.factuality)
  ) {
    return 'NON_FACTUAL';
  }

  // Step 18 sections 49-50 and 110, Rule 11.
  const ceiling = query.maxSensitivity ?? MemorySensitivity.STANDARD;
  if (SENSITIVITY_RANK[memory.sensitivity_class] > SENSITIVITY_RANK[ceiling]) {
    return 'TOO_SENSITIVE';
  }

  if (memory.scope === MemoryScope.CHALLENGE && memory.challenge_id) {
    // Step 18 section 63: challenge memory belongs to its challenge.
    if (query.challengeId && memory.challenge_id !== query.challengeId) {
      return 'OTHER_CHALLENGE';
    }
    // Step 18 sections 65 and 109: once a challenge is resolved, its detail
    // stops being injected into unrelated conversations. When the caller is
    // working on that same challenge (a reopen, section 66), it stays.
    if (
      !query.challengeId &&
      (query.closedChallengeIds ?? []).includes(memory.challenge_id)
    ) {
      return 'CLOSED_CHALLENGE';
    }
    if (!query.challengeId && query.closedChallengeIds === undefined) {
      // No challenge context at all and no knowledge of which challenges are
      // closed: fail closed rather than volunteering challenge detail into a
      // conversation that may be about something else entirely.
      return 'OTHER_CHALLENGE';
    }
  }

  if (query.memoryTypes && query.memoryTypes.length > 0) {
    if (!query.memoryTypes.includes(memory.memory_type)) {
      return 'TYPE_NOT_REQUESTED';
    }
  }

  // Step 18 section 25: low-confidence memories have limited influence. Below
  // the floor, "limited" means none.
  if (toNumber(memory.confidence) < MEMORY_CONFIDENCE_FLOOR) {
    return 'BELOW_CONFIDENCE_FLOOR';
  }

  return null;
}

/** Stage 2. Pure function of one memory and the query. */
export function scoreMemory(
  memory: ZunoMemory,
  query: MemoryRetrievalQuery,
  now: Date,
): ScoredMemory {
  const purpose = purposeScore(memory.memory_type, query.requestContext);
  const scope = scopeScore(memory, query);
  const authority =
    (MEMORY_SOURCE_AUTHORITY[memory.source] ?? 40) / MAX_AUTHORITY;
  const importance =
    RETENTION_IMPORTANCE[memory.retention_class] ??
    RETENTION_IMPORTANCE[MemoryRetentionClass.SHORT_TERM];
  const confidence = clamp01(toNumber(memory.confidence));
  const recency = recencyScore(memory, now);
  const lexical = lexicalScore(memory, query.queryTerms);

  const weighted =
    RELEVANCE_WEIGHTS.purpose * purpose +
    RELEVANCE_WEIGHTS.scope * scope +
    RELEVANCE_WEIGHTS.authority * authority +
    RELEVANCE_WEIGHTS.importance * importance +
    RELEVANCE_WEIGHTS.confidence * confidence +
    RELEVANCE_WEIGHTS.recency * recency;

  // The lexical term is an additive nudge with a hard cap, never a factor with
  // a weight of its own. Step 18 section 34: do not rely exclusively on
  // similarity - and a small bonus cannot promote an irrelevant type past the
  // floor on its own.
  const score = clamp01(weighted + lexical * 0.05);

  return {
    memory,
    score,
    factors: { purpose, scope, authority, importance, confidence, recency, lexical },
  };
}

/**
 * The retrieval entry point: admissibility, then scoring, then bounding.
 *
 * Kept as a pure function over an already-fetched array so it is exhaustively
 * testable without a database. MemoryService supplies the rows, having narrowed
 * them in SQL first using the indexes on `zuno_memories`.
 */
export function selectRelevantMemories(
  memories: readonly ZunoMemory[],
  query: MemoryRetrievalQuery,
): MemoryRetrievalResult {
  const now = query.now ?? new Date();
  const maxItems = Math.min(
    Math.max(1, query.maxItems ?? DEFAULT_MAX_MEMORY_ITEMS),
    MAX_MEMORY_ITEMS_CEILING,
  );
  const charBudget = query.charBudget ?? DEFAULT_MEMORY_CHAR_BUDGET;
  const minScore = query.minScore ?? DEFAULT_MIN_RELEVANCE_SCORE;
  const perTypeCap = Math.max(1, Math.ceil(maxItems / 2));

  const admissible = memories.filter(
    (memory) => admissibility(memory, query, now) === null,
  );

  const scored = admissible
    .map((memory) => scoreMemory(memory, query, now))
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Deterministic tie-break, so two runs over the same data produce the
      // same prompt. Authority first, then recency, then id.
      const authorityDelta = b.factors.authority - a.factors.authority;
      if (authorityDelta !== 0) return authorityDelta;
      const recencyDelta = b.factors.recency - a.factors.recency;
      if (recencyDelta !== 0) return recencyDelta;
      return a.memory.id < b.memory.id ? -1 : 1;
    });

  const perType = new Map<MemoryType, number>();
  const items: ScoredMemory[] = [];
  let chars = 0;

  for (const entry of scored) {
    if (items.length >= maxItems) break;

    const typeCount = perType.get(entry.memory.memory_type) ?? 0;
    if (typeCount >= perTypeCap) continue;

    const cost = (entry.memory.memory_value?.statement ?? '').length + 1;
    if (chars + cost > charBudget && items.length > 0) continue;

    items.push(entry);
    perType.set(entry.memory.memory_type, typeCount + 1);
    chars += cost;
  }

  return {
    items,
    consideredCount: admissible.length,
    droppedCount: admissible.length - items.length,
    charBudgetUsed: chars,
  };
}

/**
 * Purpose fit, from the priority list.
 *
 * Rank 0 scores 1.0 and each subsequent rank steps down, with a floor of 0.25
 * so an unlisted type is discounted rather than eliminated - eliminating it
 * here would duplicate the `memoryTypes` filter and make the two ways of
 * narrowing behave differently.
 */
export function purposeScore(
  type: MemoryType,
  requestContext: MemoryRequestContext,
): number {
  const priority = PURPOSE_TYPE_PRIORITY[requestContext] ?? [];
  if (priority.length === 0) return 0.6;
  const rank = priority.indexOf(type);
  if (rank < 0) return 0.25;
  const step = 0.75 / Math.max(1, priority.length - 1);
  return clamp01(1 - rank * step);
}

function scopeScore(memory: ZunoMemory, query: MemoryRetrievalQuery): number {
  if (
    memory.scope === MemoryScope.CHALLENGE &&
    query.challengeId &&
    memory.challenge_id === query.challengeId
  ) {
    return 1;
  }
  // Step 18 section 64: a global constraint such as limited weekday capacity
  // genuinely affects career, study and health alike, so global memory is worth
  // most of a challenge match.
  if (memory.scope === MemoryScope.GLOBAL) return 0.6;
  return 0.4;
}

/**
 * Exponential decay from the last confirmation, half-life by retention class.
 *
 * `last_confirmed_at` rather than `created_at` is the right clock: Step 18
 * section 59 updates confirmation metadata when a preference is re-observed, so
 * a preference stated once and re-confirmed monthly should not look stale.
 */
export function recencyScore(memory: ZunoMemory, now: Date): number {
  const halfLife =
    RETENTION_RECENCY_HALF_LIFE_DAYS[memory.retention_class] ??
    RETENTION_RECENCY_HALF_LIFE_DAYS[MemoryRetentionClass.SHORT_TERM];
  if (!Number.isFinite(halfLife)) return 1;

  const anchor = memory.last_confirmed_at ?? memory.updated_at ?? memory.created_at;
  if (!anchor) return 0.5;

  const ageDays = Math.max(
    0,
    (now.getTime() - new Date(anchor).getTime()) / 86_400_000,
  );
  return clamp01(Math.pow(0.5, ageDays / halfLife));
}

/**
 * Overlap between the memory statement and the current question's terms.
 *
 * Token overlap, not embeddings: Step 18 section 34 warns against relying on
 * similarity alone, and this is capped at a 0.05 contribution so it cannot do
 * so even if it wanted to.
 */
function lexicalScore(
  memory: ZunoMemory,
  queryTerms: readonly string[] | undefined,
): number {
  if (!queryTerms || queryTerms.length === 0) return 0;
  const haystack = [
    memory.memory_value?.statement ?? '',
    memory.memory_value?.label ?? '',
    memory.memory_key,
  ]
    .join(' ')
    .toLowerCase();

  let hits = 0;
  for (const term of queryTerms) {
    const normalised = term.trim().toLowerCase();
    if (normalised.length < 4) continue;
    if (haystack.includes(normalised)) hits++;
  }
  return clamp01(hits / Math.max(1, queryTerms.length));
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Re-exported so callers do not reach into the enum module for one constant. */
export const RETRIEVABLE_STATUSES = RETRIEVABLE_MEMORY_STATUSES;
export const ACTIVE_STATUS = MemoryStatus.ACTIVE;
