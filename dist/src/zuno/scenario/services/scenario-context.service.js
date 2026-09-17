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
var ScenarioContextService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenarioContextService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_challenge_entity_1 = require("../../challenges/entities/zuno-challenge.entity");
const zuno_challenge_context_entity_1 = require("../../challenges/entities/zuno-challenge-context.entity");
const zuno_challenge_domain_entity_1 = require("../../challenges/entities/zuno-challenge-domain.entity");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const rulebook_repository_service_1 = require("../../rulebook/services/rulebook-repository.service");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const enums_1 = require("../../common/enums");
let ScenarioContextService = ScenarioContextService_1 = class ScenarioContextService {
    constructor(challenges, contexts, challengeDomains, ownership, rulebook) {
        this.challenges = challenges;
        this.contexts = contexts;
        this.challengeDomains = challengeDomains;
        this.ownership = ownership;
        this.rulebook = rulebook;
        this.logger = new common_1.Logger(ScenarioContextService_1.name);
    }
    async requireOwnedChallenge(userId, challengeId) {
        const challenge = await this.challenges.findOne({
            where: { id: challengeId, deleted_at: (0, typeorm_2.IsNull)() },
        });
        return this.ownership.require(challenge, userId, 'challenge');
    }
    async project(userId, challengeId) {
        const challenge = await this.requireOwnedChallenge(userId, challengeId);
        const context = await this.contexts.findOne({
            where: { challenge_id: challenge.id },
            order: { version_number: 'DESC' },
        });
        if (!context) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.PROCESSING, {
                message: 'We need to understand this one before we can map out the possibilities.',
                internalDetail: `challenge ${challenge.id} has no context version`,
            });
        }
        const domainRows = await this.challengeDomains.find({
            where: { challenge_id: challenge.id },
        });
        const domains = domainRows.length > 0
            ? domainRows.map((row) => row.domain)
            : challenge.primary_domain
                ? [challenge.primary_domain]
                : [];
        const items = context.payload?.items ?? [];
        const facts = items
            .filter((item) => item.type === enums_1.ContextItemType.FACT ||
            item.type === enums_1.ContextItemType.EXTERNAL_EVENT)
            .map((item) => item.text);
        const concerns = items
            .filter((item) => item.type === enums_1.ContextItemType.FEAR ||
            item.type === enums_1.ContextItemType.ASSUMPTION ||
            item.type === enums_1.ContextItemType.USER_BELIEF)
            .map((item) => item.text);
        return {
            challenge,
            context,
            domains,
            summary: context.summary ?? '',
            facts,
            concerns,
            dependencies: (context.payload?.dependencies ?? []).map((edge) => ({
                from: edge.from,
                to: edge.to,
                description: edge.description ?? null,
            })),
            decisions: (context.payload?.decisions ?? []).map((decision) => ({
                question: decision.question,
                options: decision.options,
            })),
            controllable: context.payload?.factors?.controllable ?? [],
            external: context.payload?.factors?.external ?? [],
            temporalAnchors: (context.payload?.temporal_anchors ?? []).map((anchor) => ({
                raw: anchor.raw,
                normalized_date: anchor.normalized_date,
            })),
            safetyText: [challenge.raw_user_statement, context.summary, ...concerns]
                .filter(Boolean)
                .join('\n'),
        };
    }
    async loadAstroContext(domains) {
        if (domains.length === 0)
            return null;
        try {
            const active = await this.rulebook.getActive();
            if (!active) {
                this.logger.debug('No active Rulebook - generating scenarios without astrology (Step 20 s.125)');
                return null;
            }
            const rules = await this.rulebook.findRules({ domains });
            if (rules.length === 0) {
                this.logger.debug(`Rulebook ${active.version} matched no approved rule for ${domains.join(',')}`);
                return null;
            }
            const supportive = [];
            const caution = [];
            for (const rule of rules) {
                if (rule.direction === enums_1.ThemeDirection.SUPPORTIVE) {
                    supportive.push(rule.theme);
                }
                else if (rule.direction === enums_1.ThemeDirection.CAUTION) {
                    caution.push(rule.theme);
                }
                else if (rule.direction === enums_1.ThemeDirection.MIXED) {
                    supportive.push(rule.theme);
                    caution.push(rule.theme);
                }
            }
            return {
                supportive_themes: unique(supportive),
                caution_themes: unique(caution),
                timing_windows: [],
                rule_keys: rules.map((rule) => rule.external_rule_key),
                rulebook_version_id: active.versionId,
            };
        }
        catch (error) {
            this.logger.warn(`Rulebook unavailable; scenarios will be produced without astrology (${error instanceof Error ? error.message : 'unknown'})`);
            return null;
        }
    }
};
exports.ScenarioContextService = ScenarioContextService;
exports.ScenarioContextService = ScenarioContextService = ScenarioContextService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_challenge_entity_1.ZunoChallenge)),
    __param(1, (0, typeorm_1.InjectRepository)(zuno_challenge_context_entity_1.ZunoChallengeContext)),
    __param(2, (0, typeorm_1.InjectRepository)(zuno_challenge_domain_entity_1.ZunoChallengeDomain)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        zuno_ownership_service_1.ZunoOwnershipService,
        rulebook_repository_service_1.RulebookRepositoryService])
], ScenarioContextService);
function unique(values) {
    return Array.from(new Set(values));
}
//# sourceMappingURL=scenario-context.service.js.map