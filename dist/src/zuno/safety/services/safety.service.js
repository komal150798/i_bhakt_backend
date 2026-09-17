"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SafetyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyService = void 0;
const common_1 = require("@nestjs/common");
const zuno_safety_decision_entity_1 = require("../entities/zuno-safety-decision.entity");
const zuno_safety_incident_entity_1 = require("../entities/zuno-safety-incident.entity");
const safety_signal_detector_1 = require("./safety-signal-detector");
const safety_policy_1 = require("./safety-policy");
const enums_1 = require("../../common/enums");
let SafetyService = SafetyService_1 = class SafetyService {
    constructor(detector) {
        this.detector = detector;
        this.logger = new common_1.Logger(SafetyService_1.name);
    }
    preCheck(input) {
        const deterministicFlags = this.detector.detect(input.text);
        const flags = Array.from(new Set([...deterministicFlags, ...(input.modelFlags ?? [])]));
        const domains = input.domains ?? [];
        const matched = this.matchRules(flags, domains);
        const domainBaseline = domains.reduce((worst, domain) => this.worseRisk(worst, enums_1.DOMAIN_BASELINE_RISK[domain] ?? enums_1.ZunoRiskClass.LOW_RISK), enums_1.ZunoRiskClass.LOW_RISK);
        const riskLevel = matched.reduce((worst, rule) => this.worseRisk(worst, rule.risk_level), domainBaseline);
        const disposition = matched.reduce((worst, rule) => this.worseDisposition(worst, rule.disposition), enums_1.SafetyDisposition.ALLOW);
        const actions = unique(matched.flatMap((rule) => rule.required_actions));
        const blockedCapabilities = unique(matched.flatMap((rule) => rule.blocked_capabilities));
        const leadRule = [...matched].sort((a, b) => enums_1.SAFETY_DISPOSITION_SEVERITY[b.disposition] -
            enums_1.SAFETY_DISPOSITION_SEVERITY[a.disposition])[0];
        return {
            riskLevel,
            disposition,
            domains,
            flags,
            actions,
            blockedCapabilities,
            matchedRuleIds: matched.map((rule) => rule.rule_id),
            boundaryMessage: leadRule?.boundary_message,
            suggestedSupport: leadRule?.suggested_support,
            policyVersion: enums_1.ZUNO_SAFETY_POLICY_VERSION,
            blocked: actions.includes(enums_1.SafetyAction.BLOCK_RESPONSE) ||
                disposition === enums_1.SafetyDisposition.CRITICAL_ESCALATION,
            astrologySuppressed: actions.includes(enums_1.SafetyAction.SUPPRESS_ASTROLOGY) ||
                blockedCapabilities.includes(enums_1.SafetyBlockedCapability.ASTROLOGY_REMEDY),
        };
    }
    refineWithDomains(previous, input) {
        return this.preCheck({
            ...input,
            modelFlags: unique([...(previous.flags ?? []), ...(input.modelFlags ?? [])]),
        });
    }
    postCheck(input) {
        const text = (input.candidateText ?? '').toLowerCase();
        const violations = [];
        const certaintyPatterns = [
            /\byou\s+will\s+(definitely|certainly|surely)\b/,
            /\byou\s+are\s+going\s+to\s+(lose|fail|get\s+fired|be\s+fired)\b/,
            /\bis\s+guaranteed\s+to\b/,
            /\bwill\s+definitely\s+(happen|occur)\b/,
            /\bthere\s+is\s+no\s+doubt\s+that\s+you\b/,
            /\byou\s+will\s+(lose|fail)\s+your\b/,
        ];
        if (certaintyPatterns.some((p) => p.test(text))) {
            violations.push(enums_1.SafetyViolation.UNSUPPORTED_CERTAINTY);
        }
        const fatalismPatterns = [
            /\bnothing\s+(you\s+)?can\s+(be\s+)?do(ne)?\b/,
            /\b(it|this)\s+is\s+(your\s+)?(fate|destiny|written)\b/,
            /\bcannot\s+be\s+(avoided|changed|escaped)\b/,
            /\bno\s+way\s+(out|to\s+avoid)\b/,
        ];
        if (fatalismPatterns.some((p) => p.test(text))) {
            violations.push(enums_1.SafetyViolation.FATALISM);
        }
        const fearPatterns = [
            /\b(disaster|catastroph(e|ic)|doomed|ruined)\b/,
            /\byou\s+should\s+be\s+(very\s+)?(afraid|scared|worried)\b/,
            /\bbefore\s+it\s+is\s+too\s+late\b/,
        ];
        if (fearPatterns.some((p) => p.test(text))) {
            violations.push(enums_1.SafetyViolation.FEAR_AMPLIFICATION);
        }
        if (input.assessment.actions.includes(enums_1.SafetyAction.REQUIRE_PROFESSIONAL_BOUNDARY)) {
            const boundaryPresent = /\b(professional|adviser|advisor|lawyer|doctor|specialist|qualified)\b/.test(text);
            if (!boundaryPresent) {
                violations.push(enums_1.SafetyViolation.PROFESSIONAL_BOUNDARY_VIOLATION);
            }
        }
        if (input.assessment.blockedCapabilities.includes(enums_1.SafetyBlockedCapability.ASTROLOGY_REMEDY)) {
            const remedyPatterns = [
                /\b(wear|donate|chant|recite|perform|offer)\s+(a|an|the)?\s*\w*\s*(gemstone|stone|mantra|puja|ritual|yantra|rudraksha)\b/,
                /\b(gemstone|mantra|puja|yantra|rudraksha)\b/,
            ];
            if (remedyPatterns.some((p) => p.test(text))) {
                violations.push(enums_1.SafetyViolation.UNSAFE_REMEDY);
            }
        }
        const allowed = violations.length === 0;
        return {
            allowed,
            rewriteRequired: !allowed,
            violations,
        };
    }
    async recordDecision(manager, params) {
        const { assessment } = params;
        const decision = manager.create(zuno_safety_decision_entity_1.ZunoSafetyDecision, {
            user_id: params.userId,
            challenge_id: params.challengeId ?? null,
            operation: params.operation,
            risk_level: assessment.riskLevel,
            disposition: assessment.disposition,
            domains: assessment.domains,
            flags: assessment.flags,
            actions: assessment.actions,
            blocked_capabilities: assessment.blockedCapabilities,
            matched_rule_ids: assessment.matchedRuleIds,
            policy_version: assessment.policyVersion,
            redacted_at: null,
        });
        return manager.save(zuno_safety_decision_entity_1.ZunoSafetyDecision, decision);
    }
    async recordIncident(manager, params) {
        this.logger.warn(`Safety incident [${params.source}] severity=${params.severity} violations=${params.violations.join(',')}`);
        const incident = manager.create(zuno_safety_incident_entity_1.ZunoSafetyIncident, {
            user_id: params.userId ?? null,
            safety_decision_id: params.safetyDecisionId ?? null,
            related_response_id: params.responseId ?? null,
            source: params.source,
            domain: params.domain ?? null,
            severity: params.severity,
            violations: params.violations,
            status: 'OPEN',
            policy_version: enums_1.ZUNO_SAFETY_POLICY_VERSION,
            resolved_at: null,
            redacted_at: null,
        });
        return manager.save(zuno_safety_incident_entity_1.ZunoSafetyIncident, incident);
    }
    hasCriticalFlag(flags) {
        return flags.some((flag) => enums_1.CRITICAL_SAFETY_FLAGS.includes(flag));
    }
    matchRules(flags, domains) {
        return (0, safety_policy_1.activeRules)().filter((rule) => {
            if (rule.flag && !flags.includes(rule.flag))
                return false;
            if (rule.domain && !domains.includes(rule.domain))
                return false;
            return rule.flag !== null || rule.domain !== null;
        });
    }
    worseRisk(a, b) {
        return enums_1.RISK_CLASS_SEVERITY[b] > enums_1.RISK_CLASS_SEVERITY[a] ? b : a;
    }
    worseDisposition(a, b) {
        return enums_1.SAFETY_DISPOSITION_SEVERITY[b] > enums_1.SAFETY_DISPOSITION_SEVERITY[a] ? b : a;
    }
};
exports.SafetyService = SafetyService;
exports.SafetyService = SafetyService = SafetyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [safety_signal_detector_1.SafetySignalDetector])
], SafetyService);
function unique(values) {
    return Array.from(new Set(values));
}
//# sourceMappingURL=safety.service.js.map