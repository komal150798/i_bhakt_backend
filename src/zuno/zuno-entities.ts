import {
  ZunoUser,
  ZunoUserProfile,
  ZunoUserPreference,
  ZunoUserConsent,
  ZunoBirthProfile,
} from './identity/entities';
import {
  ZunoChallenge,
  ZunoChallengeContext,
  ZunoChallengeDomain,
  ZunoChallengeLink,
} from './challenges/entities';
import { ZunoResponse } from './responses/entities';
import { ZunoSafetyDecision, ZunoSafetyIncident } from './safety/entities';
import { ZunoAiGenerationRun, ZunoEngineRun } from './ai/entities';
import {
  ZunoEventOutbox,
  ZunoIdempotencyKey,
  ZunoAuditEvent,
} from './common/entities';
import {
  ZunoRulebookVersion,
  ZunoRulebookRule,
  ZunoRulebookInterpretation,
  ZunoRulebookTimingRule,
  ZunoRulebookRemedy,
  ZunoRulebookDomainConfig,
  ZunoRulebookConflictRule,
  ZunoRulebookGoldenCase,
  ZunoRulebookValidationRun,
  ZunoRulebookReviewItem,
  ZunoRulebookAuditLog,
} from './rulebook/entities';

// Phase 6 - Scenario & What-If (Step 20 scenario sections)
import {
  ZunoScenarioSet,
  ZunoScenario,
  ZunoScenarioCondition,
  ZunoWhatIfSession,
  ZunoWhatIfAssumption,
} from './scenario/entities';

// Phase 7 - MKA + Plan (Step 15, Step 16)
import { ZunoMkaProgram, ZunoMkaItem, ZunoMkaCompletion } from './mka/entities';
import { ZunoPlan, ZunoPlanItem, ZunoPlanItemEvent } from './plan/entities';

// Phase 8 - Karma Ledger (Step 17)
import {
  ZunoKarmaEntry,
  ZunoKarmaEntryRevision,
  ZunoKarmaScoreConfiguration,
  ZunoKarmaPattern,
} from './karma/entities';

// Phase 9 - Life Signals + Realignment (Step 13, Step 14)
import {
  ZunoLifeSignal,
  ZunoLifeSignalSource,
  ZunoLifeSignalConfirmation,
  ZunoLifeSignalImpact,
} from './signals/entities';
import {
  ZunoRealignment,
  ZunoRealignmentChange,
  ZunoRealignmentAssumption,
} from './realignment/entities';

// Phase 10 - Memory + Future Self (Step 18)
import {
  ZunoMemory,
  ZunoMemoryCandidate,
  ZunoMemoryEvidence,
  ZunoMemoryConflict,
} from './memory/entities';
import {
  ZunoFutureSelfNarrative,
  ZunoFutureSelfSource,
} from './future-self/entities';

/**
 * Every ZUNO entity, in one list.
 *
 * Kept in its own file rather than in `zuno.module.ts` so that
 * `infrastructure/database/database.module.ts` can register the tables without
 * importing the ZUNO module and, with it, every controller and provider in the
 * graph. That import would be evaluated purely for a list of classes, and it
 * makes a future circular reference far too easy to introduce.
 *
 * `DatabaseModule` builds an explicit entity array rather than globbing paths,
 * so a new ZUNO entity is invisible to TypeORM until it is added here.
 */
export const ZUNO_ENTITIES = [
  // Identity and birth context (Step 20 sections 10-15)
  ZunoUser,
  ZunoUserProfile,
  ZunoUserPreference,
  ZunoUserConsent,
  ZunoBirthProfile,

  // WhatNow (Step 20 sections 18-22, 119)
  ZunoChallenge,
  ZunoChallengeContext,
  ZunoChallengeDomain,
  ZunoChallengeLink,

  // Adaptive response (Step 20 sections 59-61)
  ZunoResponse,

  // Safety and trust (Step 20 sections 62-63)
  ZunoSafetyDecision,
  ZunoSafetyIncident,

  // AI provenance and engine execution state (Step 20 sections 80, 108)
  ZunoAiGenerationRun,
  ZunoEngineRun,

  // Platform: outbox, idempotency, audit (Step 20 sections 79, 105, 107)
  ZunoEventOutbox,
  ZunoIdempotencyKey,
  ZunoAuditEvent,

  // SME Astrology Rulebook - the externally managed knowledge layer
  // (Step 20 sections 65-73, Step 10 section 19).
  ZunoRulebookVersion,
  ZunoRulebookRule,
  ZunoRulebookInterpretation,
  ZunoRulebookTimingRule,
  ZunoRulebookRemedy,
  ZunoRulebookDomainConfig,
  ZunoRulebookConflictRule,
  ZunoRulebookGoldenCase,
  ZunoRulebookValidationRun,
  ZunoRulebookReviewItem,
  ZunoRulebookAuditLog,

  // Phase 6 - Scenario & What-If
  ZunoScenarioSet,
  ZunoScenario,
  ZunoScenarioCondition,
  ZunoWhatIfSession,
  ZunoWhatIfAssumption,

  // Phase 7 - MKA programmes and the Plan/action lifecycle
  ZunoMkaProgram,
  ZunoMkaItem,
  ZunoMkaCompletion,
  ZunoPlan,
  ZunoPlanItem,
  ZunoPlanItemEvent,

  // Phase 8 - Karma Ledger
  ZunoKarmaEntry,
  ZunoKarmaEntryRevision,
  ZunoKarmaScoreConfiguration,
  ZunoKarmaPattern,

  // Phase 9 - Life Signals and Realignment
  ZunoLifeSignal,
  ZunoLifeSignalSource,
  ZunoLifeSignalConfirmation,
  ZunoLifeSignalImpact,
  ZunoRealignment,
  ZunoRealignmentChange,
  ZunoRealignmentAssumption,

  // Phase 10 - Memory and Future Self
  ZunoMemory,
  ZunoMemoryCandidate,
  ZunoMemoryEvidence,
  ZunoMemoryConflict,
  ZunoFutureSelfNarrative,
  ZunoFutureSelfSource,
];
