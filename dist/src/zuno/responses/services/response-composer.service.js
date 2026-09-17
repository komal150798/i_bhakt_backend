"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseComposerService = exports.RESPONSE_COMPOSER_VERSION = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const enums_1 = require("../../common/enums");
exports.RESPONSE_COMPOSER_VERSION = 'response-composer-1.0.0';
let ResponseComposerService = class ResponseComposerService {
    compose(input) {
        const sections = [];
        let order = 1;
        if (input.safety.blocked) {
            sections.push(this.safetySection(input.safety, order++));
            return {
                title: 'Let us pause here.',
                sections,
            };
        }
        sections.push(this.contextSection(input, order++));
        if (input.clarificationRequired) {
            sections.push(this.clarificationSection(input, order++));
            return {
                title: this.title(input),
                sections,
            };
        }
        const takeaway = this.takeawaySection(input, order);
        if (takeaway) {
            sections.push(takeaway);
            order++;
        }
        const priorities = this.prioritiesSection(input, order);
        if (priorities) {
            sections.push(priorities);
            order++;
        }
        if (input.safety.boundaryMessage) {
            sections.push(this.safetySection(input.safety, order++));
        }
        return {
            title: this.title(input),
            sections,
        };
    }
    contextSection(input, order) {
        const items = input.context.items;
        const understood = items
            .filter((item) => item.type === enums_1.ContextItemType.FACT ||
            item.type === enums_1.ContextItemType.EXTERNAL_EVENT)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, this.itemLimit(input.responseDepth))
            .map((item) => item.text);
        const concerns = items
            .filter((item) => item.type === enums_1.ContextItemType.FEAR ||
            item.type === enums_1.ContextItemType.ASSUMPTION ||
            item.type === enums_1.ContextItemType.USER_BELIEF)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, this.itemLimit(input.responseDepth))
            .map((item) => item.text);
        return {
            id: (0, crypto_1.randomUUID)(),
            type: enums_1.ResponseSectionType.CONTEXT_VALIDATION,
            order,
            title: 'What I understand',
            emphasis: enums_1.SectionEmphasis.PRIMARY,
            payload: {
                summary: input.context.summary,
                understood,
                concerns,
                correction_invited: true,
            },
        };
    }
    clarificationSection(input, order) {
        const questions = input.context.missing_information.slice(0, 2).map((entry) => ({
            id: entry.id,
            question: entry.question,
        }));
        return {
            id: (0, crypto_1.randomUUID)(),
            type: enums_1.ResponseSectionType.CLARIFICATION,
            order,
            title: 'One thing that would help',
            emphasis: enums_1.SectionEmphasis.PRIMARY,
            payload: {
                questions,
                reason: 'Knowing this would change what I suggest.',
            },
        };
    }
    takeawaySection(input, order) {
        const dependencies = input.context.dependencies;
        if (dependencies.length === 0)
            return null;
        const chain = dependencies.slice(0, 3).map((edge) => `${edge.from} → ${edge.to}`);
        return {
            id: (0, crypto_1.randomUUID)(),
            type: enums_1.ResponseSectionType.KEY_TAKEAWAY,
            order,
            title: 'What is really connected here',
            emphasis: enums_1.SectionEmphasis.SECONDARY,
            payload: {
                headline: 'This is not one isolated worry — a few things depend on each other.',
                detail: chain.join('  ·  '),
            },
        };
    }
    prioritiesSection(input, order) {
        const controllable = input.context.factors.controllable;
        if (controllable.length === 0)
            return null;
        const limit = input.responseDepth === enums_1.ResponseDepth.QUICK ? 2 : 3;
        const priorities = controllable.slice(0, limit).map((title) => ({
            id: (0, crypto_1.randomUUID)(),
            title,
            why: 'This is within your influence.',
        }));
        return {
            id: (0, crypto_1.randomUUID)(),
            type: enums_1.ResponseSectionType.FOCUS_PRIORITIES,
            order,
            title: 'Where your effort actually counts',
            emphasis: enums_1.SectionEmphasis.SECONDARY,
            payload: { priorities },
        };
    }
    safetySection(safety, order) {
        return {
            id: (0, crypto_1.randomUUID)(),
            type: enums_1.ResponseSectionType.SAFETY_BOUNDARY,
            order,
            emphasis: enums_1.SectionEmphasis.PRIMARY,
            payload: {
                message: safety.boundaryMessage ??
                    'There is a limit to what I should advise on here, and I would rather say so than guess.',
                disposition: safety.disposition,
                domain: safety.domains[0],
                suggested_support: safety.suggestedSupport,
            },
        };
    }
    title(input) {
        if (input.clarificationRequired) {
            return 'Let me make sure I have this right.';
        }
        const hasFear = input.context.items.some((item) => item.type === enums_1.ContextItemType.FEAR);
        if (hasFear) {
            return 'Let us focus on what we can prepare for.';
        }
        return 'Here is where things stand.';
    }
    itemLimit(depth) {
        switch (depth) {
            case enums_1.ResponseDepth.QUICK:
                return 2;
            case enums_1.ResponseDepth.DEEP:
                return 6;
            default:
                return 3;
        }
    }
};
exports.ResponseComposerService = ResponseComposerService;
exports.ResponseComposerService = ResponseComposerService = __decorate([
    (0, common_1.Injectable)()
], ResponseComposerService);
//# sourceMappingURL=response-composer.service.js.map