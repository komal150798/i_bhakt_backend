import {
  ContextItemSource,
  ContextItemType,
  GoalStatus,
  ChallengeTimeline,
  EmotionalSignal,
} from '../../common/enums';

/**
 * A single extracted statement about the user's situation.
 *
 * Step 11 section 9 requires every extracted statement to carry a type, and
 * section 8 makes the reason explicit: the difference between
 *   { text: "I may lose my job", type: FEAR }
 * and
 *   { text: "I may lose my job", type: FACT }
 * is the difference between ZUNO being trustworthy and ZUNO telling someone
 * they are going to be fired.
 *
 * Step 20 section 21 forbids flattening these into a single text summary, so
 * they are stored as a typed array rather than prose.
 */
export interface ContextItem {
  /** Stable id within the context version, so later versions can reference it. */
  id: string;
  text: string;
  type: ContextItemType;
  source: ContextItemSource;
  /** 0..1. Step 11 section 56: low confidence on a high-impact field clarifies. */
  confidence: number;
}

/** Step 11 sections 17-18: dependency graph edge, e.g. Employment -> Income. */
export interface DependencyEdge {
  id: string;
  from: string;
  to: string;
  /** Why this dependency matters to the user, in plain language. */
  description?: string;
  source: ContextItemSource;
  confidence: number;
}

/** Step 11 sections 19-20. Inferred goals are marked, never presented as stated. */
export interface DesiredOutcome {
  id: string;
  goal: string;
  status: GoalStatus;
  confidence: number;
}

/** Step 11 section 21: the user may actually be facing a decision. */
export interface DetectedDecision {
  id: string;
  question: string;
  options: string[];
  confidence: number;
}

/** Step 11 section 23: what the user can and cannot influence. */
export interface FactorSplit {
  controllable: string[];
  external: string[];
}

/** Step 11 section 16. Never invent a date the user did not supply. */
export interface TemporalAnchor {
  /** The user's own phrasing, e.g. "before my visa expires". */
  raw: string;
  /** ISO date, only when it could be resolved without guessing. */
  normalized_date: string | null;
  timeline: ChallengeTimeline;
}

/** Step 11 section 28: what we would need to know to help better. */
export interface MissingInformation {
  id: string;
  question: string;
  /** Higher means answering it changes the guidance more (section 31). */
  information_gain: number;
  /** Why we want it - for audit, never shown to the user. */
  rationale: string;
}

/**
 * The complete structured understanding of one challenge at one point in time.
 * Step 11 section 6, persisted as an immutable version (section 32/59).
 */
export interface ChallengeContextPayload {
  summary: string;
  items: ContextItem[];
  dependencies: DependencyEdge[];
  desired_outcomes: DesiredOutcome[];
  decisions: DetectedDecision[];
  factors: FactorSplit;
  temporal_anchors: TemporalAnchor[];
  missing_information: MissingInformation[];
  emotional_signals: EmotionalSignal[];
  /** Step 11 section 14: richer classification below the theme. */
  subthemes: string[];
}

/**
 * Helpers that keep the fact/fear boundary enforceable in code rather than
 * relying on every caller to remember it.
 */
export function factsOnly(items: ContextItem[]): ContextItem[] {
  return items.filter(
    (item) =>
      item.type === ContextItemType.FACT ||
      item.type === ContextItemType.EXTERNAL_EVENT,
  );
}

export function fearsAndAssumptions(items: ContextItem[]): ContextItem[] {
  return items.filter(
    (item) =>
      item.type === ContextItemType.FEAR ||
      item.type === ContextItemType.ASSUMPTION ||
      item.type === ContextItemType.USER_BELIEF,
  );
}

export function emptyContextPayload(): ChallengeContextPayload {
  return {
    summary: '',
    items: [],
    dependencies: [],
    desired_outcomes: [],
    decisions: [],
    factors: { controllable: [], external: [] },
    temporal_anchors: [],
    missing_information: [],
    emotional_signals: [],
    subthemes: [],
  };
}
