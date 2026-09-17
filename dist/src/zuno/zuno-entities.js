"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZUNO_ENTITIES = void 0;
const entities_1 = require("./identity/entities");
const entities_2 = require("./challenges/entities");
const entities_3 = require("./responses/entities");
const entities_4 = require("./safety/entities");
const entities_5 = require("./ai/entities");
const entities_6 = require("./common/entities");
const entities_7 = require("./rulebook/entities");
const entities_8 = require("./scenario/entities");
const entities_9 = require("./mka/entities");
const entities_10 = require("./plan/entities");
const entities_11 = require("./karma/entities");
const entities_12 = require("./signals/entities");
const entities_13 = require("./realignment/entities");
const entities_14 = require("./memory/entities");
const entities_15 = require("./future-self/entities");
exports.ZUNO_ENTITIES = [
    entities_1.ZunoUser,
    entities_1.ZunoUserProfile,
    entities_1.ZunoUserPreference,
    entities_1.ZunoUserConsent,
    entities_1.ZunoBirthProfile,
    entities_2.ZunoChallenge,
    entities_2.ZunoChallengeContext,
    entities_2.ZunoChallengeDomain,
    entities_2.ZunoChallengeLink,
    entities_3.ZunoResponse,
    entities_4.ZunoSafetyDecision,
    entities_4.ZunoSafetyIncident,
    entities_5.ZunoAiGenerationRun,
    entities_5.ZunoEngineRun,
    entities_6.ZunoEventOutbox,
    entities_6.ZunoIdempotencyKey,
    entities_6.ZunoAuditEvent,
    entities_7.ZunoRulebookVersion,
    entities_7.ZunoRulebookRule,
    entities_7.ZunoRulebookInterpretation,
    entities_7.ZunoRulebookTimingRule,
    entities_7.ZunoRulebookRemedy,
    entities_7.ZunoRulebookDomainConfig,
    entities_7.ZunoRulebookConflictRule,
    entities_7.ZunoRulebookGoldenCase,
    entities_7.ZunoRulebookValidationRun,
    entities_7.ZunoRulebookReviewItem,
    entities_7.ZunoRulebookAuditLog,
    entities_8.ZunoScenarioSet,
    entities_8.ZunoScenario,
    entities_8.ZunoScenarioCondition,
    entities_8.ZunoWhatIfSession,
    entities_8.ZunoWhatIfAssumption,
    entities_9.ZunoMkaProgram,
    entities_9.ZunoMkaItem,
    entities_9.ZunoMkaCompletion,
    entities_10.ZunoPlan,
    entities_10.ZunoPlanItem,
    entities_10.ZunoPlanItemEvent,
    entities_11.ZunoKarmaEntry,
    entities_11.ZunoKarmaEntryRevision,
    entities_11.ZunoKarmaScoreConfiguration,
    entities_11.ZunoKarmaPattern,
    entities_12.ZunoLifeSignal,
    entities_12.ZunoLifeSignalSource,
    entities_12.ZunoLifeSignalConfirmation,
    entities_12.ZunoLifeSignalImpact,
    entities_13.ZunoRealignment,
    entities_13.ZunoRealignmentChange,
    entities_13.ZunoRealignmentAssumption,
    entities_14.ZunoMemory,
    entities_14.ZunoMemoryCandidate,
    entities_14.ZunoMemoryEvidence,
    entities_14.ZunoMemoryConflict,
    entities_15.ZunoFutureSelfNarrative,
    entities_15.ZunoFutureSelfSource,
];
//# sourceMappingURL=zuno-entities.js.map