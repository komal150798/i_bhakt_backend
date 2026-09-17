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
];
//# sourceMappingURL=zuno-entities.js.map