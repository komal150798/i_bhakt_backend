import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { ZunoDomain } from '../../common/enums';
import {
  DEFAULT_SIGNAL_FRESHNESS_DAYS,
  LifeSignalMateriality,
  LifeSignalNature,
  LifeSignalOrigin,
  LifeSignalRelevance,
  LifeSignalReliability,
  LifeSignalSource,
  LifeSignalType,
  MATERIALITY_RANK,
  NON_DECAYING_SIGNAL_TYPES,
  RealignmentReasonCode,
  UrgencyChange,
} from '../enums';

export const SIGNAL_DETECTOR_VERSION = 'signal-classifier@1.0.0';

export interface ClassifyInput {
  statement: string;
  declaredType: LifeSignalType | null;
  source: LifeSignalSource;
  origin: LifeSignalOrigin;
  domain: ZunoDomain | null;
  /** Domains the challenge is already about, for relevance scoring. */
  challengeDomains: ZunoDomain[];
  occurredAt: Date | null;
  detectedAt: Date;
}

export interface Classification {
  isCandidateSignal: boolean;
  /** Present when `isCandidateSignal` is false; why we stored nothing. */
  noiseReason: string | null;
  signalType: LifeSignalType;
  nature: LifeSignalNature;
  normalizedEvent: string;
  reliability: LifeSignalReliability;
  isInference: boolean;
  confidence: number;
  materiality: LifeSignalMateriality;
  relevance: LifeSignalRelevance;
  urgencyChange: UrgencyChange;
  clarificationRequired: boolean;
  reasonCodes: RealignmentReasonCode[];
  staleAfter: Date | null;
  fingerprint: string;
  /** True when interpretation would need the SME Rulebook. */
  requiresRulebook: boolean;
}

/**
 * Deterministic candidate-signal detection and classification.
 * Step 13 sections 10-19, 49, 70.
 *
 * WHAT THIS IS NOT
 *
 * It is not an LLM prompt. Step 13 section 70 draws the line precisely: "AI
 * interprets the signal. ZUNO controls what the signal is allowed to change" -
 * and puts enums, timestamps, deduplication, state transitions, materiality
 * thresholds and the realignment trigger on the deterministic side. Every one
 * of those is decided here. When an extraction model is eventually wired in it
 * supplies `declaredType` and a normalised phrase; it never gets to set
 * materiality or flip a state.
 *
 * It also contains no astrology. ASTRO_TIMING_CHANGE is recognised as a *type*
 * so such a signal can be stored and attributed, but this class never decides
 * what a timing window means - that is `RulebookRepositoryService`'s business,
 * and it fails closed (Build Rule 51, Step 20 section 125).
 *
 * THE LEXICONS BELOW
 *
 * Keyword matching is a floor, not a ceiling. It exists so that the engine
 * behaves correctly, and conservatively, with no model available - the same
 * reasoning as SafetySignalDetector. Every ambiguity resolves towards asking
 * the user rather than asserting (Step 13 sections 18, 78, 82).
 */
@Injectable()
export class SignalClassifierService {
  classify(input: ClassifyInput): Classification {
    const text = input.statement.trim();
    const lower = text.toLowerCase();

    // Step 13 section 5: "Okay." / "Thanks." / "I read the plan." are
    // conversation, not change. Storing them as signals would make every
    // downstream count meaningless and invite exactly the "every message
    // regenerates everything" architecture section 101 prohibits.
    const noise = this.noiseReason(lower, input);
    if (noise) {
      return this.noiseResult(noise, input, text);
    }

    const signalType = input.declaredType ?? this.inferType(lower);
    const nature = this.inferNature(signalType, lower);
    const hedged = this.isHedged(lower);
    const explicit = this.isExplicit(lower);

    const reliability = this.inferReliability(input.source, hedged, explicit);
    const isInference =
      reliability === LifeSignalReliability.INFERRED ||
      reliability === LifeSignalReliability.UNVERIFIED;

    const confidence = this.scoreConfidence(hedged, explicit, input.source);
    const relevance = this.scoreRelevance(input, signalType);
    const urgencyChange = this.scoreUrgencyChange(signalType, lower);
    const materiality = this.scoreMateriality(
      signalType,
      relevance,
      urgencyChange,
      hedged,
    );

    // Step 13 section 18: "Low-confidence, high-impact signals should be
    // clarified." This is the rule that stops "they hinted something may
    // happen" becoming TERMINATION_CONFIRMED.
    const clarificationRequired =
      hedged && MATERIALITY_RANK[materiality] >= MATERIALITY_RANK[LifeSignalMateriality.HIGH];

    return {
      isCandidateSignal: true,
      noiseReason: null,
      signalType,
      nature,
      normalizedEvent: this.normalizeEvent(signalType, lower),
      reliability,
      isInference,
      confidence,
      materiality,
      relevance,
      urgencyChange,
      clarificationRequired,
      reasonCodes: this.reasonCodes(signalType, urgencyChange, materiality),
      staleAfter: this.staleAfter(signalType, nature, input),
      fingerprint: this.fingerprint(
        signalType,
        this.normalizeEvent(signalType, lower),
        input.occurredAt ?? input.detectedAt,
      ),
      requiresRulebook: signalType === LifeSignalType.ASTRO_TIMING_CHANGE,
    };
  }

  /**
   * Recomputes the fingerprint the way `classify` does, for dedup lookups
   * before a write. Kept public so the service never re-derives it by hand.
   */
  fingerprintFor(
    signalType: LifeSignalType,
    normalizedEvent: string,
    at: Date,
  ): string {
    return this.fingerprint(signalType, normalizedEvent, at);
  }

  // ---------------------------------------------------------------- internals

  private noiseReason(lower: string, input: ClassifyInput): string | null {
    if (lower.length === 0) return 'EMPTY';
    // An explicitly declared type from a system source is trusted to be a real
    // event: a plan item completing is short but is not conversational noise.
    if (input.source !== LifeSignalSource.USER_EXPLICIT) return null;
    if (input.declaredType) return null;

    const ACKNOWLEDGEMENTS = [
      'ok',
      'okay',
      'thanks',
      'thank you',
      'got it',
      'sure',
      'fine',
      'tell me more',
      'i read the plan',
      'i opened the app',
      'i feel the same as yesterday',
      'no change',
      'nothing new',
      'same as before',
    ];
    const stripped = lower.replace(/[.!?,]/g, '').trim();
    if (ACKNOWLEDGEMENTS.includes(stripped)) return 'ACKNOWLEDGEMENT';
    // Too short to carry a "what changed" without a declared type.
    if (stripped.split(/\s+/).length < 3) return 'INSUFFICIENT_CONTENT';
    return null;
  }

  private noiseResult(
    reason: string,
    input: ClassifyInput,
    text: string,
  ): Classification {
    return {
      isCandidateSignal: false,
      noiseReason: reason,
      signalType: LifeSignalType.OTHER,
      nature: LifeSignalNature.EVENT,
      normalizedEvent: 'NONE',
      reliability: LifeSignalReliability.UNVERIFIED,
      isInference: true,
      confidence: 0,
      materiality: LifeSignalMateriality.LOW,
      relevance: LifeSignalRelevance.UNRELATED,
      urgencyChange: UrgencyChange.NONE,
      clarificationRequired: false,
      reasonCodes: [],
      staleAfter: null,
      fingerprint: this.fingerprint(
        LifeSignalType.OTHER,
        text.slice(0, 64),
        input.detectedAt,
      ),
      requiresRulebook: false,
    };
  }

  /** Step 13 sections 18-19: hedging keeps a statement a possibility. */
  private isHedged(lower: string): boolean {
    const HEDGES = [
      'i think',
      'i feel like',
      'maybe',
      'might',
      'may be',
      'may happen',
      'possibly',
      'perhaps',
      'not sure',
      'seemed',
      'seems',
      'hinted',
      'rumour',
      'rumor',
      'i heard',
      'apparently',
      'could be',
      'probably',
      'worried that',
      'afraid that',
    ];
    return HEDGES.some((hedge) => lower.includes(hedge));
  }

  /** Step 13 section 19: explicit, attributable statements promote to fact. */
  private isExplicit(lower: string): boolean {
    const EXPLICIT = [
      'confirmed',
      'formally',
      'officially',
      'gave me',
      'i received',
      'i have received',
      'i signed',
      'i accepted',
      'i resigned',
      'i decided',
      'we decided',
      'i completed',
      'has been',
      'have been terminated',
      'last working day',
      'letter',
      'notice',
      'agreed',
    ];
    return EXPLICIT.some((token) => lower.includes(token));
  }

  private inferType(lower: string): LifeSignalType {
    const RULES: [LifeSignalType, string[]][] = [
      [
        LifeSignalType.PLAN_BLOCKER,
        ['refused', 'rejected my request', 'blocked', 'cannot proceed', 'will not discuss'],
      ],
      [
        LifeSignalType.PLAN_PROGRESS,
        ['updated my cv', 'completed the', 'finished the', 'i completed', 'mock test completed'],
      ],
      [
        LifeSignalType.OPPORTUNITY,
        ['offer', 'recruiter', 'interview', 'opportunity', 'wants me to join'],
      ],
      [
        LifeSignalType.STATUS_CHANGE,
        ['terminated', 'termination', 'laid off', 'resigned', 'promoted', 'role is safe', 'retained'],
      ],
      [
        LifeSignalType.FINANCIAL_CHANGE,
        ['loan', 'emi', 'bank', 'salary', 'income', 'revenue'],
      ],
      [LifeSignalType.DEADLINE, ['expires', 'due on', 'deadline', 'last date']],
      // GOAL_CHANGE and PREFERENCE_CHANGE are matched BEFORE the generic
      // DECISION. Step 13 section 32 is explicit that "I no longer want to stay
      // in this company" is not merely a decision or an emotional statement - it
      // is a change of goal, and Step 14 section 64 makes a goal change one of
      // the few things ZUNO must ask about before acting. Filing it as DECISION
      // would silently skip that consent step.
      [LifeSignalType.GOAL_CHANGE, ['i want to leave', 'i no longer want to', 'my goal is now']],
      [LifeSignalType.PREFERENCE_CHANGE, ["i don't want to", 'i do not want to', 'i prefer']],
      [LifeSignalType.DECISION, ['i have decided', 'we decided', 'i no longer want']],
      [
        LifeSignalType.CAREER_EVENT,
        ['restructuring', 'manager', 'hr ', 'layoff', 'appraisal', 'my role'],
      ],
      [LifeSignalType.RELATIONSHIP_EVENT, ['partner', 'marriage', 'counseling', 'counselling']],
      [LifeSignalType.EDUCATION_EVENT, ['exam', 'mock score', 'result', 'admission']],
      [LifeSignalType.LEGAL_EVENT, ['legal notice', 'court', 'lawyer', 'summons']],
      [LifeSignalType.LOCATION_EVENT, ['visa', 'relocate', 'residency', 'moving to']],
      [LifeSignalType.WELLBEING_SIGNAL, ['doctor', 'diagnosed', 'medical', 'health']],
    ];
    for (const [type, tokens] of RULES) {
      if (tokens.some((token) => lower.includes(token))) return type;
    }
    return LifeSignalType.OTHER;
  }

  /**
   * Step 13 section 62. "Interview scheduled" is an EVENT; "currently
   * unemployed" is a STATE. The difference decides whether decay applies.
   */
  private inferNature(type: LifeSignalType, lower: string): LifeSignalNature {
    if (NON_DECAYING_SIGNAL_TYPES.includes(type)) return LifeSignalNature.STATE;
    const STATE_MARKERS = ['i am now', 'i am currently', 'no longer', 'has become'];
    return STATE_MARKERS.some((marker) => lower.includes(marker))
      ? LifeSignalNature.STATE
      : LifeSignalNature.EVENT;
  }

  private inferReliability(
    source: LifeSignalSource,
    hedged: boolean,
    explicit: boolean,
  ): LifeSignalReliability {
    if (source === LifeSignalSource.ADMIN) {
      return LifeSignalReliability.ADMIN_CONFIRMED;
    }
    if (
      source === LifeSignalSource.PLAN_EVENT ||
      source === LifeSignalSource.KARMA_LEDGER ||
      source === LifeSignalSource.SYSTEM_DERIVED
    ) {
      return LifeSignalReliability.SYSTEM_OBSERVED;
    }
    if (hedged && !explicit) return LifeSignalReliability.INFERRED;
    return LifeSignalReliability.USER_REPORTED;
  }

  private scoreConfidence(
    hedged: boolean,
    explicit: boolean,
    source: LifeSignalSource,
  ): number {
    if (source !== LifeSignalSource.USER_EXPLICIT) return 0.95;
    if (explicit && !hedged) return 0.92;
    if (hedged && explicit) return 0.6;
    if (hedged) return 0.45;
    return 0.75;
  }

  /**
   * Step 13 section 16. "My friend changed jobs" is UNRELATED to Ashish's job
   * security unless it materially affects his options.
   */
  private scoreRelevance(
    input: ClassifyInput,
    signalType: LifeSignalType,
  ): LifeSignalRelevance {
    if (input.challengeDomains.length === 0) return LifeSignalRelevance.UNCERTAIN;
    if (input.domain && input.challengeDomains.includes(input.domain)) {
      return LifeSignalRelevance.DIRECT;
    }
    if (
      signalType === LifeSignalType.PLAN_PROGRESS ||
      signalType === LifeSignalType.PLAN_BLOCKER
    ) {
      return LifeSignalRelevance.DIRECT;
    }
    if (input.domain === null) return LifeSignalRelevance.UNCERTAIN;
    return LifeSignalRelevance.INDIRECT;
  }

  private scoreUrgencyChange(
    signalType: LifeSignalType,
    lower: string,
  ): UrgencyChange {
    const DECREASE_MARKERS = [
      'role is safe',
      'retained',
      'agreed to lower',
      'extended by',
      'postponed',
      'improved',
    ];
    if (DECREASE_MARKERS.some((marker) => lower.includes(marker))) {
      return UrgencyChange.DECREASE;
    }
    // Wording that raises pressure regardless of the type it was filed under.
    // "My role is included in the restructuring" is a CAREER_EVENT by type but
    // is plainly not neutral, and Step 13 section 79 warns against
    // under-reacting to exactly this kind of statement.
    const INCREASE_MARKERS = [
      'restructuring',
      'layoff',
      'laid off',
      'terminated',
      'termination',
      'notice period',
      'last working day',
      'legal notice',
      'refused',
      'blocked',
      'expires',
      'deadline',
    ];
    if (INCREASE_MARKERS.some((marker) => lower.includes(marker))) {
      return UrgencyChange.INCREASE;
    }
    const INCREASE_TYPES: LifeSignalType[] = [
      LifeSignalType.SETBACK,
      LifeSignalType.DEADLINE,
      LifeSignalType.PLAN_BLOCKER,
      LifeSignalType.LEGAL_EVENT,
      LifeSignalType.STATUS_CHANGE,
    ];
    if (INCREASE_TYPES.includes(signalType)) return UrgencyChange.INCREASE;
    return UrgencyChange.NONE;
  }

  /**
   * Step 13 sections 14-15 and 50.
   *
   * Section 15 warns that "no single dimension should automatically dominate in
   * every domain", so this starts from a per-type baseline and then adjusts for
   * relevance and urgency rather than reading materiality off any one input.
   */
  private scoreMateriality(
    signalType: LifeSignalType,
    relevance: LifeSignalRelevance,
    urgencyChange: UrgencyChange,
    hedged: boolean,
  ): LifeSignalMateriality {
    const BASELINE: Partial<Record<LifeSignalType, LifeSignalMateriality>> = {
      // Step 13 section 53 / Rule 6: completing a task is progress, not a
      // change in life state.
      [LifeSignalType.PLAN_PROGRESS]: LifeSignalMateriality.LOW,
      [LifeSignalType.OTHER]: LifeSignalMateriality.LOW,
      [LifeSignalType.TIME_SIGNAL]: LifeSignalMateriality.MEDIUM,
      [LifeSignalType.ASTRO_TIMING_CHANGE]: LifeSignalMateriality.MEDIUM,
      [LifeSignalType.EXTERNAL_EVENT]: LifeSignalMateriality.MEDIUM,
      [LifeSignalType.WELLBEING_SIGNAL]: LifeSignalMateriality.HIGH,
      // Step 13 Rule 7: a blocked plan is itself a material signal.
      [LifeSignalType.PLAN_BLOCKER]: LifeSignalMateriality.HIGH,
      [LifeSignalType.STATUS_CHANGE]: LifeSignalMateriality.HIGH,
      [LifeSignalType.OPPORTUNITY]: LifeSignalMateriality.HIGH,
      [LifeSignalType.GOAL_CHANGE]: LifeSignalMateriality.HIGH,
      [LifeSignalType.DECISION]: LifeSignalMateriality.HIGH,
      [LifeSignalType.LEGAL_EVENT]: LifeSignalMateriality.HIGH,
      [LifeSignalType.SETBACK]: LifeSignalMateriality.HIGH,
    };

    let rank = MATERIALITY_RANK[BASELINE[signalType] ?? LifeSignalMateriality.MEDIUM];

    if (relevance === LifeSignalRelevance.UNRELATED) rank -= 2;
    else if (relevance === LifeSignalRelevance.INDIRECT) rank -= 1;

    if (urgencyChange !== UrgencyChange.NONE) rank += 1;

    // Step 13 section 78: do not overreact to ambiguous events. A hedged
    // statement can still be material, but it cannot be CRITICAL on its own.
    if (hedged) rank = Math.min(rank, MATERIALITY_RANK[LifeSignalMateriality.HIGH]);

    // CRITICAL is not simply "HIGH plus urgency".
    //
    // Step 13 section 14 defines CRITICAL as requiring immediate reassessment
    // "and possibly Safety & Trust intervention", and Step 14 section 22 makes
    // a CRITICAL realignment one where safety takes precedence over ordinary
    // optimisation. A confirmed termination is a major life change, and Step 14
    // section 98 rates exactly that case as MAJOR, not CRITICAL - so letting an
    // urgency bump promote any HIGH signal to CRITICAL would route ordinary
    // career and money changes through the safety path and make the level
    // meaningless. Only the domains the spec itself flags that way qualify.
    const CRITICAL_ELIGIBLE: LifeSignalType[] = [
      LifeSignalType.WELLBEING_SIGNAL, // Step 13 section 73
      LifeSignalType.LEGAL_EVENT, // Step 13 section 72
    ];
    if (!CRITICAL_ELIGIBLE.includes(signalType)) {
      rank = Math.min(rank, MATERIALITY_RANK[LifeSignalMateriality.HIGH]);
    }

    rank = Math.max(0, Math.min(3, rank));
    return (
      (Object.keys(MATERIALITY_RANK) as LifeSignalMateriality[]).find(
        (key) => MATERIALITY_RANK[key] === rank,
      ) ?? LifeSignalMateriality.MEDIUM
    );
  }

  private reasonCodes(
    signalType: LifeSignalType,
    urgencyChange: UrgencyChange,
    materiality: LifeSignalMateriality,
  ): RealignmentReasonCode[] {
    const codes: RealignmentReasonCode[] = [];
    switch (signalType) {
      case LifeSignalType.STATUS_CHANGE:
        codes.push(RealignmentReasonCode.NEW_FACT);
        break;
      case LifeSignalType.OPPORTUNITY:
        codes.push(RealignmentReasonCode.OPPORTUNITY_APPEARED);
        break;
      case LifeSignalType.PLAN_BLOCKER:
        codes.push(RealignmentReasonCode.PLAN_BLOCKED);
        break;
      case LifeSignalType.GOAL_CHANGE:
        codes.push(RealignmentReasonCode.GOAL_CHANGED);
        break;
      case LifeSignalType.PREFERENCE_CHANGE:
        codes.push(RealignmentReasonCode.PREFERENCE_CHANGED);
        break;
      case LifeSignalType.DEADLINE:
      case LifeSignalType.TIME_SIGNAL:
        codes.push(RealignmentReasonCode.TIME_WINDOW_CHANGED);
        break;
      case LifeSignalType.FINANCIAL_CHANGE:
        codes.push(RealignmentReasonCode.DEPENDENCY_CHANGED);
        break;
      case LifeSignalType.ASTRO_TIMING_CHANGE:
        codes.push(RealignmentReasonCode.ASTRO_TIMING_CHANGED);
        break;
      default:
        break;
    }
    if (urgencyChange === UrgencyChange.INCREASE) {
      codes.push(RealignmentReasonCode.URGENCY_INCREASED);
    }
    if (urgencyChange === UrgencyChange.DECREASE) {
      codes.push(RealignmentReasonCode.URGENCY_DECREASED);
    }
    if (
      codes.length === 0 &&
      MATERIALITY_RANK[materiality] >= MATERIALITY_RANK[LifeSignalMateriality.HIGH]
    ) {
      codes.push(RealignmentReasonCode.RISK_CHANGED);
    }
    return codes;
  }

  /**
   * Step 13 sections 60-61. States do not decay; events do, from the moment
   * they occurred rather than the moment we were told, so a month-old event
   * reported today is already most of the way through its shelf life.
   */
  private staleAfter(
    signalType: LifeSignalType,
    nature: LifeSignalNature,
    input: ClassifyInput,
  ): Date | null {
    if (nature === LifeSignalNature.STATE) return null;
    if (NON_DECAYING_SIGNAL_TYPES.includes(signalType)) return null;
    const anchor = input.occurredAt ?? input.detectedAt;
    return new Date(
      anchor.getTime() + DEFAULT_SIGNAL_FRESHNESS_DAYS * 24 * 60 * 60 * 1000,
    );
  }

  /**
   * Step 13 section 20: semantic-ish deduplication without a vector store.
   *
   * The date is truncated to the day because "my interview is Friday" told on
   * Tuesday and repeated on Wednesday describes one interview. Using the full
   * timestamp would defeat the whole mechanism.
   */
  private normalizeEvent(type: LifeSignalType, lower: string): string {
    const significant = lower
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !STOPWORDS.has(word))
      .sort()
      .slice(0, 8)
      .join('_');
    return `${type}:${significant || 'unspecified'}`.slice(0, 120);
  }

  private fingerprint(
    type: LifeSignalType,
    normalizedEvent: string,
    at: Date,
  ): string {
    const day = at.toISOString().slice(0, 10);
    return createHash('sha256')
      .update(`${type}|${normalizedEvent}|${day}`)
      .digest('hex')
      .slice(0, 64);
  }
}

const STOPWORDS = new Set([
  'that',
  'this',
  'with',
  'have',
  'from',
  'they',
  'been',
  'will',
  'about',
  'there',
  'their',
  'today',
  'tomorrow',
  'just',
  'very',
  'into',
  'what',
  'when',
  'then',
  'than',
  'because',
]);
