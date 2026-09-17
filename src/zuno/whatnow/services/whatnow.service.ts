import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  IWhatNowEngine,
  WhatNowExtraction,
  WHATNOW_ENGINE,
} from '../engines/whatnow.port';
import {
  ChallengeContextPayload,
  ContextItem,
  DependencyEdge,
} from '../../challenges/entities/challenge-context.types';
import {
  ChallengeMode,
  ContextItemType,
  DOMAIN_BASELINE_RISK,
  EngineRouting,
  ResponseDepth,
  Urgency,
  ZunoDomain,
  ZunoRiskClass,
} from '../../common/enums';

/**
 * Confidence below which ZUNO asks rather than assumes.
 * Step 11 section 30 names 0.75 as the starting threshold and says it must
 * remain configurable, so it is read from config with that default.
 */
const DEFAULT_CLARIFICATION_THRESHOLD = 0.75;

export interface WhatNowAnalysis {
  payload: ChallengeContextPayload;
  primaryDomain: ZunoDomain;
  secondaryDomains: { domain: ZunoDomain; confidence: number }[];
  theme: string | null;
  urgency: Urgency;
  emotionalIntensity: WhatNowExtraction['emotional_intensity'];
  confidence: number;
  clarificationRequired: boolean;
  routing: EngineRouting;
  mode: ChallengeMode;
  responseDepth: ResponseDepth;
  title: string;
  safetyFlags: WhatNowExtraction['safety_flags'];
  extractorVersion: string;
  aiGenerationRunId: string | null;
  /** Risk class per domain, for persisting challenge_domains rows. */
  domainRisk: Map<ZunoDomain, ZunoRiskClass>;
}

/**
 * Deterministic control layer over the WhatNow intelligence engine.
 *
 * Step 11 section 55 draws the line this class implements:
 *   "LLM understands language. ZUNO software controls behaviour."
 * The engine returns a structured extraction; everything that decides what
 * happens next - enum validity, confidence thresholds, routing, response depth,
 * operating mode, the fact/fear boundary - is computed here, in code, from
 * rules that can be read and tested.
 *
 * Step 11 section 68 states the prohibited architecture explicitly: user input
 * must not go straight to an astrology LLM and back out as an answer. Nothing
 * in this class produces guidance; it produces understanding.
 */
@Injectable()
export class WhatNowService {
  private readonly logger = new Logger(WhatNowService.name);

  constructor(
    @Inject(WHATNOW_ENGINE) private readonly engine: IWhatNowEngine,
  ) {}

  private get clarificationThreshold(): number {
    const configured = Number(process.env.ZUNO_WHATNOW_CLARIFY_THRESHOLD);
    return Number.isFinite(configured) && configured > 0 && configured <= 1
      ? configured
      : DEFAULT_CLARIFICATION_THRESHOLD;
  }

  /**
   * Runs extraction and applies every deterministic rule on top of it.
   */
  async analyze(params: {
    statement: string;
    countryCode?: string | null;
    preferredName?: string | null;
    previousSummary?: string | null;
  }): Promise<WhatNowAnalysis> {
    const result = await this.engine.extract({
      statement: params.statement,
      knownContext: {
        countryCode: params.countryCode ?? null,
        preferredName: params.preferredName ?? null,
        previousSummary: params.previousSummary ?? null,
      },
    });

    const extraction = this.enforceInvariants(result.extraction);

    const items: ContextItem[] = extraction.items.map((item) => ({
      id: randomUUID(),
      text: item.text,
      type: item.type,
      source: item.source,
      confidence: item.confidence,
    }));

    const dependencies: DependencyEdge[] = extraction.dependencies.map((edge) => ({
      id: randomUUID(),
      from: edge.from,
      to: edge.to,
      description: edge.description,
      source: extraction.items.find((i) => i.text === edge.from)?.source ??
        ('INFERRED' as DependencyEdge['source']),
      confidence: 0.8,
    }));

    const payload: ChallengeContextPayload = {
      summary: extraction.summary,
      items,
      dependencies,
      desired_outcomes: extraction.desired_outcomes.map((outcome) => ({
        id: randomUUID(),
        goal: outcome.goal,
        status: outcome.status,
        confidence: outcome.confidence,
      })),
      decisions: extraction.decisions.map((decision) => ({
        id: randomUUID(),
        question: decision.question,
        options: decision.options,
        confidence: decision.confidence,
      })),
      factors: {
        controllable: extraction.controllable,
        external: extraction.external,
      },
      temporal_anchors: extraction.temporal_anchors,
      // Step 11 section 31: rank clarification questions by information gain,
      // then keep only the best few - section 29 forbids turning this into a
      // form.
      missing_information: [...extraction.missing_information]
        .sort((a, b) => b.information_gain - a.information_gain)
        .slice(0, 3)
        .map((entry) => ({
          id: randomUUID(),
          question: entry.question,
          information_gain: entry.information_gain,
          rationale: entry.rationale,
        })),
      emotional_signals: extraction.emotional_signals,
      subthemes: extraction.subthemes,
    };

    const clarificationRequired =
      extraction.confidence < this.clarificationThreshold &&
      payload.missing_information.length > 0;

    const allDomains = this.collectDomains(extraction);
    const domainRisk = new Map<ZunoDomain, ZunoRiskClass>(
      allDomains.map((domain) => [
        domain,
        DOMAIN_BASELINE_RISK[domain] ?? ZunoRiskClass.LOW_RISK,
      ]),
    );

    return {
      payload,
      primaryDomain: extraction.primary_domain,
      secondaryDomains: extraction.secondary_domains,
      theme: extraction.theme,
      urgency: extraction.urgency,
      emotionalIntensity: extraction.emotional_intensity,
      confidence: extraction.confidence,
      clarificationRequired,
      routing: this.deriveRouting(extraction, clarificationRequired),
      mode: this.deriveMode(extraction, clarificationRequired),
      responseDepth: this.deriveResponseDepth(extraction),
      title: this.deriveTitle(extraction),
      safetyFlags: extraction.safety_flags,
      extractorVersion: result.extractorVersion,
      aiGenerationRunId: result.aiGenerationRunId,
      domainRisk,
    };
  }

  /**
   * Deterministic invariants applied after validation but before use.
   *
   * The schema validator checks *shape*. This checks *meaning* - the rules that
   * matter even when the model returned something perfectly well-formed.
   */
  private enforceInvariants(extraction: WhatNowExtraction): WhatNowExtraction {
    const items = extraction.items.map((item) => {
      // Step 11 Rule 1 and section 8, enforced in code rather than trusted to
      // the prompt: a statement the model inferred cannot be recorded as a
      // hard FACT. Only something the user actually said or confirmed can be.
      if (
        item.type === ContextItemType.FACT &&
        item.source === ('INFERRED' as typeof item.source)
      ) {
        this.logger.debug(
          'Demoted an INFERRED item from FACT to ASSUMPTION (Step 11 s.8)',
        );
        return { ...item, type: ContextItemType.ASSUMPTION };
      }
      return item;
    });

    // Step 11 section 11: exactly one primary domain, and it must not be
    // duplicated in the secondary list.
    const secondary = extraction.secondary_domains.filter(
      (entry) => entry.domain !== extraction.primary_domain,
    );

    return { ...extraction, items, secondary_domains: secondary };
  }

  private collectDomains(extraction: WhatNowExtraction): ZunoDomain[] {
    return Array.from(
      new Set<ZunoDomain>([
        extraction.primary_domain,
        ...extraction.secondary_domains.map((entry) => entry.domain),
      ]),
    );
  }

  /**
   * Which downstream engines this challenge needs.
   * Step 11 sections 38-39: not every challenge needs every engine.
   */
  private deriveRouting(
    extraction: WhatNowExtraction,
    clarificationRequired: boolean,
  ): EngineRouting {
    // While we are still clarifying, running scenario/plan/MKA would be
    // building on an understanding we have just admitted is incomplete.
    if (clarificationRequired) {
      return {
        scenario_engine: false,
        life_signal_engine: false,
        realignment_engine: false,
        mka_engine: false,
        plan_engine: false,
        karma_ledger: false,
        memory_context: false,
        safety_review: extraction.safety_flags.length > 0,
        astrology: false,
      };
    }

    const hasDecision = extraction.decisions.length > 0;
    const hasUncertainFuture = extraction.items.some(
      (item) =>
        item.type === ContextItemType.FEAR ||
        item.type === ContextItemType.ASSUMPTION,
    );
    const isUrgent =
      extraction.urgency === Urgency.HIGH ||
      extraction.urgency === Urgency.IMMEDIATE;

    return {
      // Scenarios earn their place when there is a real branch point.
      scenario_engine: hasDecision || hasUncertainFuture,
      // Anything with an open future is worth watching for Life Signals.
      life_signal_engine: hasUncertainFuture || isUrgent,
      realignment_engine: hasUncertainFuture || isUrgent,
      mka_engine: true,
      plan_engine: true,
      karma_ledger: false,
      memory_context: true,
      safety_review: extraction.safety_flags.length > 0,
      astrology: true,
    };
  }

  /**
   * The operating mode this WhatNow starts in. Master Index section 13.
   */
  private deriveMode(
    extraction: WhatNowExtraction,
    clarificationRequired: boolean,
  ): ChallengeMode {
    if (clarificationRequired) return ChallengeMode.UNDERSTAND;
    if (extraction.decisions.length > 0) return ChallengeMode.DECIDE;
    if (extraction.urgency === Urgency.IMMEDIATE) return ChallengeMode.ACT;

    const hasConfirmedLoss = extraction.items.some(
      (item) =>
        item.type === ContextItemType.FACT &&
        /\b(terminated|fired|laid off|ended|lost|failed|rejected)\b/i.test(item.text),
    );
    if (hasConfirmedLoss) return ChallengeMode.RECOVER;

    const hasFear = extraction.items.some(
      (item) => item.type === ContextItemType.FEAR,
    );
    if (hasFear) return ChallengeMode.PREPARE;

    return ChallengeMode.UNDERSTAND;
  }

  /**
   * How much to say on the first pass. Step 11 sections 41-42.
   *
   * The rule worth preserving: a highly distressed person does not get twelve
   * screens of analysis (section 25). Depth of understanding and density of
   * presentation are separate concerns.
   */
  private deriveResponseDepth(extraction: WhatNowExtraction): ResponseDepth {
    if (
      extraction.emotional_intensity === 'VERY_HIGH' ||
      extraction.safety_flags.length > 0
    ) {
      return ResponseDepth.QUICK;
    }
    if (extraction.emotional_intensity === 'HIGH') {
      return ResponseDepth.STANDARD;
    }
    return ResponseDepth.STANDARD;
  }

  /**
   * A short human label for the challenge.
   *
   * Step 11 section 44: internally structured, externally human. The title must
   * not read like "CAREER / JOB_SECURITY", so it is derived from the summary
   * rather than from the classification codes - Step 11 Rule 5 forbids exposing
   * internal domain codes in normal consumer UX.
   */
  private deriveTitle(extraction: WhatNowExtraction): string {
    const summary = extraction.summary.trim();
    const firstSentence = summary.split(/(?<=[.!?])\s/)[0] ?? summary;
    const trimmed = firstSentence.replace(/\.$/, '');
    if (trimmed.length <= 80) return trimmed;
    return `${trimmed.slice(0, 77).trimEnd()}...`;
  }
}
