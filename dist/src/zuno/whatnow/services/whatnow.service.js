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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WhatNowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatNowService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const whatnow_port_1 = require("../engines/whatnow.port");
const enums_1 = require("../../common/enums");
const DEFAULT_CLARIFICATION_THRESHOLD = 0.75;
let WhatNowService = WhatNowService_1 = class WhatNowService {
    constructor(engine) {
        this.engine = engine;
        this.logger = new common_1.Logger(WhatNowService_1.name);
    }
    get clarificationThreshold() {
        const configured = Number(process.env.ZUNO_WHATNOW_CLARIFY_THRESHOLD);
        return Number.isFinite(configured) && configured > 0 && configured <= 1
            ? configured
            : DEFAULT_CLARIFICATION_THRESHOLD;
    }
    async analyze(params) {
        const result = await this.engine.extract({
            statement: params.statement,
            knownContext: {
                countryCode: params.countryCode ?? null,
                preferredName: params.preferredName ?? null,
                previousSummary: params.previousSummary ?? null,
            },
        });
        const extraction = this.enforceInvariants(result.extraction);
        const items = extraction.items.map((item) => ({
            id: (0, crypto_1.randomUUID)(),
            text: item.text,
            type: item.type,
            source: item.source,
            confidence: item.confidence,
        }));
        const dependencies = extraction.dependencies.map((edge) => ({
            id: (0, crypto_1.randomUUID)(),
            from: edge.from,
            to: edge.to,
            description: edge.description,
            source: extraction.items.find((i) => i.text === edge.from)?.source ??
                'INFERRED',
            confidence: 0.8,
        }));
        const payload = {
            summary: extraction.summary,
            items,
            dependencies,
            desired_outcomes: extraction.desired_outcomes.map((outcome) => ({
                id: (0, crypto_1.randomUUID)(),
                goal: outcome.goal,
                status: outcome.status,
                confidence: outcome.confidence,
            })),
            decisions: extraction.decisions.map((decision) => ({
                id: (0, crypto_1.randomUUID)(),
                question: decision.question,
                options: decision.options,
                confidence: decision.confidence,
            })),
            factors: {
                controllable: extraction.controllable,
                external: extraction.external,
            },
            temporal_anchors: extraction.temporal_anchors,
            missing_information: [...extraction.missing_information]
                .sort((a, b) => b.information_gain - a.information_gain)
                .slice(0, 3)
                .map((entry) => ({
                id: (0, crypto_1.randomUUID)(),
                question: entry.question,
                information_gain: entry.information_gain,
                rationale: entry.rationale,
            })),
            emotional_signals: extraction.emotional_signals,
            subthemes: extraction.subthemes,
        };
        const clarificationRequired = extraction.confidence < this.clarificationThreshold &&
            payload.missing_information.length > 0;
        const allDomains = this.collectDomains(extraction);
        const domainRisk = new Map(allDomains.map((domain) => [
            domain,
            enums_1.DOMAIN_BASELINE_RISK[domain] ?? enums_1.ZunoRiskClass.LOW_RISK,
        ]));
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
    enforceInvariants(extraction) {
        const items = extraction.items.map((item) => {
            if (item.type === enums_1.ContextItemType.FACT &&
                item.source === 'INFERRED') {
                this.logger.debug('Demoted an INFERRED item from FACT to ASSUMPTION (Step 11 s.8)');
                return { ...item, type: enums_1.ContextItemType.ASSUMPTION };
            }
            return item;
        });
        const secondary = extraction.secondary_domains.filter((entry) => entry.domain !== extraction.primary_domain);
        return { ...extraction, items, secondary_domains: secondary };
    }
    collectDomains(extraction) {
        return Array.from(new Set([
            extraction.primary_domain,
            ...extraction.secondary_domains.map((entry) => entry.domain),
        ]));
    }
    deriveRouting(extraction, clarificationRequired) {
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
        const hasUncertainFuture = extraction.items.some((item) => item.type === enums_1.ContextItemType.FEAR ||
            item.type === enums_1.ContextItemType.ASSUMPTION);
        const isUrgent = extraction.urgency === enums_1.Urgency.HIGH ||
            extraction.urgency === enums_1.Urgency.IMMEDIATE;
        return {
            scenario_engine: hasDecision || hasUncertainFuture,
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
    deriveMode(extraction, clarificationRequired) {
        if (clarificationRequired)
            return enums_1.ChallengeMode.UNDERSTAND;
        if (extraction.decisions.length > 0)
            return enums_1.ChallengeMode.DECIDE;
        if (extraction.urgency === enums_1.Urgency.IMMEDIATE)
            return enums_1.ChallengeMode.ACT;
        const hasConfirmedLoss = extraction.items.some((item) => item.type === enums_1.ContextItemType.FACT &&
            /\b(terminated|fired|laid off|ended|lost|failed|rejected)\b/i.test(item.text));
        if (hasConfirmedLoss)
            return enums_1.ChallengeMode.RECOVER;
        const hasFear = extraction.items.some((item) => item.type === enums_1.ContextItemType.FEAR);
        if (hasFear)
            return enums_1.ChallengeMode.PREPARE;
        return enums_1.ChallengeMode.UNDERSTAND;
    }
    deriveResponseDepth(extraction) {
        if (extraction.emotional_intensity === 'VERY_HIGH' ||
            extraction.safety_flags.length > 0) {
            return enums_1.ResponseDepth.QUICK;
        }
        if (extraction.emotional_intensity === 'HIGH') {
            return enums_1.ResponseDepth.STANDARD;
        }
        return enums_1.ResponseDepth.STANDARD;
    }
    deriveTitle(extraction) {
        const summary = extraction.summary.trim();
        const firstSentence = summary.split(/(?<=[.!?])\s/)[0] ?? summary;
        const trimmed = firstSentence.replace(/\.$/, '');
        if (trimmed.length <= 80)
            return trimmed;
        return `${trimmed.slice(0, 77).trimEnd()}...`;
    }
};
exports.WhatNowService = WhatNowService;
exports.WhatNowService = WhatNowService = WhatNowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(whatnow_port_1.WHATNOW_ENGINE)),
    __metadata("design:paramtypes", [Object])
], WhatNowService);
//# sourceMappingURL=whatnow.service.js.map