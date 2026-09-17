import { MemoryType } from '../enums/memory.enum';

/**
 * The JSONB payload of a memory row.
 *
 * Step 20 section 49 makes `memory_value` a JSONB column, but leaving it as
 * `any` would mean every consumer guesses. The shape below is deliberately
 * small: a human-readable statement, an optional short label for the user-facing
 * memory screen (Step 21 section 59), and structured references.
 *
 * What it must never contain (Step 18 section 48, Step 24 section 39):
 *   - raw SME rulebook text. Only `rulebook_version` / `rule_ids` references.
 *   - embeddings, system prompts or model reasoning (Step 18 section 53).
 *   - birth details. Those live on `zuno_birth_profiles` and are referenced,
 *     not copied.
 */
export interface MemoryValue {
  /**
   * What ZUNO remembers, phrased as ZUNO would say it back to the user.
   * Step 18 section 53: user-readable, no internal machinery.
   */
  statement: string;

  /** Short grouping label for the memory screen, e.g. "Career decision". */
  label?: string;

  /**
   * Structured references to authoritative domain state. Step 18 section 97:
   * memory references domain state, it does not replace it.
   */
  refs?: {
    entity_type: string;
    entity_id: string;
  }[];

  /**
   * Step 18 section 48: rulebook provenance is kept as a reference so an
   * interpretation can be re-resolved against the governed knowledge source.
   */
  rulebook?: {
    rulebook_version_id?: string;
    rule_ids?: string[];
    interpretation_id?: string;
  };

  /**
   * Free-form structured detail for a specific memory type - for example a
   * commitment's due date. Kept narrow on purpose.
   */
  detail?: Record<string, string | number | boolean | null>;
}

/**
 * A memory candidate as proposed by the extraction layer.
 *
 * Step 18 section 21. This is the *unvalidated* shape: everything the AI layer
 * is allowed to propose, and nothing it is allowed to decide. Step 18 section
 * 85 is the governing line - "AI may propose what matters. ZUNO software
 * decides what is stored and how it is governed."
 */
export interface MemoryCandidateProposal {
  type: MemoryType;
  key: string;
  value: MemoryValue;
  /** 0..1. Step 18 section 25. */
  confidence: number;
  /**
   * The event this candidate came from. Step 18 section 95 uses it, together
   * with key and scope, to make repeated processing idempotent.
   */
  sourceEventId?: string | null;
}

/** Human-readable grouping for the "what do you remember about me" screen. */
export interface MemorySummaryGroup {
  type: MemoryType;
  label: string;
  items: {
    id: string;
    statement: string;
    scope: string;
    challengeId: string | null;
    /** Why it matters - Step 24 section 40 asks the user be able to see this. */
    why: string;
    lastConfirmedAt: string | null;
    expiresAt: string | null;
  }[];
}
