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
var RulebookRepositoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulebookRepositoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_rulebook_version_entity_1 = require("../entities/zuno-rulebook-version.entity");
const zuno_rulebook_rule_entity_1 = require("../entities/zuno-rulebook-rule.entity");
const zuno_rulebook_knowledge_entity_1 = require("../entities/zuno-rulebook-knowledge.entity");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const clock_service_1 = require("../../common/services/clock.service");
const enums_1 = require("../../common/enums");
let RulebookRepositoryService = RulebookRepositoryService_1 = class RulebookRepositoryService {
    constructor(versions, rules, interpretations, remedies, domainConfigs, conflictRules, clock) {
        this.versions = versions;
        this.rules = rules;
        this.interpretations = interpretations;
        this.remedies = remedies;
        this.domainConfigs = domainConfigs;
        this.conflictRules = conflictRules;
        this.clock = clock;
        this.logger = new common_1.Logger(RulebookRepositoryService_1.name);
        this.cachedActive = null;
        this.cacheLoadedAt = 0;
    }
    async getActive() {
        const now = Date.now();
        if (this.cachedActive && now - this.cacheLoadedAt < RulebookRepositoryService_1.CACHE_TTL_MS) {
            return this.cachedActive;
        }
        const version = await this.versions.findOne({
            where: { is_production: true, status: enums_1.RulebookStatus.PRODUCTION },
        });
        this.cachedActive = version
            ? {
                versionId: version.id,
                version: version.version,
                activatedAt: version.activated_at,
                hash: version.source_file_hash,
            }
            : null;
        this.cacheLoadedAt = now;
        return this.cachedActive;
    }
    async requireActive() {
        const active = await this.getActive();
        if (!active) {
            this.logger.warn('No active Rulebook. Astrology-derived guidance is disabled (fail closed).');
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.RULEBOOK_UNAVAILABLE, {
                internalDetail: 'no rulebook version in PRODUCTION status',
            });
        }
        return active;
    }
    async isAstrologyAvailable() {
        return (await this.getActive()) !== null;
    }
    async findRules(query) {
        const active = await this.requireActive();
        if (query.domains.length === 0)
            return [];
        const candidates = await this.rules.find({
            where: {
                rulebook_version_id: active.versionId,
                domain: (0, typeorm_2.In)(query.domains),
                status: enums_1.RuleStatus.APPROVED,
            },
        });
        const referenceDate = query.referenceDate ?? this.clock.today();
        return candidates.filter((rule) => {
            if (rule.sme_confidence === enums_1.SmeConfidence.EXPERIMENTAL)
                return false;
            if (enums_1.NON_PRODUCTION_SAFETY_CLASSES.includes(rule.safety_class))
                return false;
            if (rule.effective_from && referenceDate < rule.effective_from)
                return false;
            if (rule.effective_until && referenceDate > rule.effective_until)
                return false;
            return true;
        });
    }
    async findInterpretations(keys) {
        if (keys.length === 0)
            return new Map();
        const active = await this.requireActive();
        const rows = await this.interpretations.find({
            where: {
                rulebook_version_id: active.versionId,
                external_interpretation_key: (0, typeorm_2.In)(keys),
                status: enums_1.RuleStatus.APPROVED,
            },
        });
        return new Map(rows.map((r) => [r.external_interpretation_key, r]));
    }
    async findRemedies(keys) {
        if (keys.length === 0)
            return [];
        const active = await this.requireActive();
        const rows = await this.remedies.find({
            where: {
                rulebook_version_id: active.versionId,
                external_remedy_key: (0, typeorm_2.In)(keys),
                status: enums_1.RuleStatus.APPROVED,
            },
        });
        return rows.filter((r) => !enums_1.NON_PRODUCTION_SAFETY_CLASSES.includes(r.safety_class));
    }
    async findDomainConfigs(domains) {
        if (domains.length === 0)
            return new Map();
        const active = await this.requireActive();
        const rows = await this.domainConfigs.find({
            where: { rulebook_version_id: active.versionId, domain: (0, typeorm_2.In)(domains) },
        });
        return new Map(rows.map((r) => [r.domain, r]));
    }
    async findConflictRules(ruleKeys) {
        if (ruleKeys.length === 0)
            return [];
        const active = await this.requireActive();
        const all = await this.conflictRules.find({
            where: { rulebook_version_id: active.versionId },
        });
        const wanted = new Set(ruleKeys);
        return all.filter((c) => (c.rule_keys ?? []).some((k) => wanted.has(k)));
    }
    async findRuleForAudit(versionId, externalRuleKey) {
        return this.rules.findOne({
            where: {
                rulebook_version_id: versionId,
                external_rule_key: externalRuleKey,
            },
        });
    }
    invalidateCache() {
        this.cachedActive = null;
        this.cacheLoadedAt = 0;
        this.logger.log('Rulebook runtime cache invalidated.');
    }
};
exports.RulebookRepositoryService = RulebookRepositoryService;
RulebookRepositoryService.CACHE_TTL_MS = 60_000;
exports.RulebookRepositoryService = RulebookRepositoryService = RulebookRepositoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_rulebook_version_entity_1.ZunoRulebookVersion)),
    __param(1, (0, typeorm_1.InjectRepository)(zuno_rulebook_rule_entity_1.ZunoRulebookRule)),
    __param(2, (0, typeorm_1.InjectRepository)(zuno_rulebook_knowledge_entity_1.ZunoRulebookInterpretation)),
    __param(3, (0, typeorm_1.InjectRepository)(zuno_rulebook_knowledge_entity_1.ZunoRulebookRemedy)),
    __param(4, (0, typeorm_1.InjectRepository)(zuno_rulebook_knowledge_entity_1.ZunoRulebookDomainConfig)),
    __param(5, (0, typeorm_1.InjectRepository)(zuno_rulebook_knowledge_entity_1.ZunoRulebookConflictRule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        clock_service_1.ClockService])
], RulebookRepositoryService);
//# sourceMappingURL=rulebook-repository.service.js.map