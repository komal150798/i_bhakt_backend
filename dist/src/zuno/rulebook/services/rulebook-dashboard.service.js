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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulebookDashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_rulebook_version_entity_1 = require("../entities/zuno-rulebook-version.entity");
const zuno_rulebook_rule_entity_1 = require("../entities/zuno-rulebook-rule.entity");
const zuno_rulebook_governance_entity_1 = require("../entities/zuno-rulebook-governance.entity");
const enums_1 = require("../../common/enums");
let RulebookDashboardService = class RulebookDashboardService {
    constructor(versions, rules, reviewItems, validationRuns, auditLog) {
        this.versions = versions;
        this.rules = rules;
        this.reviewItems = reviewItems;
        this.validationRuns = validationRuns;
        this.auditLog = auditLog;
    }
    async listVersions(limit) {
        return this.versions.find({
            order: { created_at: 'DESC' },
            take: limit,
        });
    }
    async latestValidationRun(versionId) {
        return this.validationRuns.findOne({
            where: { rulebook_version_id: versionId },
            order: { created_at: 'DESC' },
        });
    }
    async reviewDashboard(versionId) {
        const [rules, items] = await Promise.all([
            this.rules.find({ where: { rulebook_version_id: versionId } }),
            this.reviewItems.find({ where: { rulebook_version_id: versionId } }),
        ]);
        const byReviewStatus = tally(items.map((i) => i.review_status));
        const byDomain = tally(rules.map((r) => r.domain));
        const bySafetyClass = tally(rules.map((r) => r.safety_class));
        const byTheme = tally(rules.map((r) => r.theme));
        const byStatus = tally(rules.map((r) => r.status));
        const pending = items.filter((i) => i.review_status === enums_1.RuleReviewStatus.PENDING).length;
        const approved = items.filter((i) => i.review_status === enums_1.RuleReviewStatus.APPROVED).length;
        const rejected = items.filter((i) => i.review_status === enums_1.RuleReviewStatus.REJECTED).length;
        const duplicates = items.filter((i) => i.review_status === enums_1.RuleReviewStatus.POSSIBLE_DUPLICATE).length;
        const twoPersonRequired = items.filter((i) => i.requires_two_person_review);
        const awaitingSecondReview = twoPersonRequired.filter((i) => i.secondary_reviewer_id === null).length;
        return {
            totalRules: rules.length,
            reviewedRules: items.length - pending,
            pendingRules: pending,
            approvedRules: approved,
            rejectedRules: rejected,
            possibleDuplicates: duplicates,
            twoPersonReviewRequired: twoPersonRequired.length,
            awaitingSecondReview,
            readyForApproval: pending === 0 && awaitingSecondReview === 0,
            byReviewStatus,
            byDomain,
            bySafetyClass,
            byTheme,
            byRuleStatus: byStatus,
        };
    }
    async listRules(versionId, options) {
        const query = this.rules
            .createQueryBuilder('rule')
            .where('rule.rulebook_version_id = :versionId', { versionId })
            .orderBy('rule.external_rule_key', 'ASC')
            .skip(options.offset)
            .take(options.limit);
        if (options.domain) {
            query.andWhere('rule.domain = :domain', {
                domain: options.domain.toUpperCase(),
            });
        }
        const [rules, total] = await query.getManyAndCount();
        const items = rules.length
            ? await this.reviewItems.find({
                where: { rulebook_version_id: versionId },
            })
            : [];
        const byRuleId = new Map(items.map((i) => [i.rule_id, i]));
        let mapped = rules.map((rule) => {
            const item = byRuleId.get(rule.id);
            return {
                ruleId: rule.id,
                ruleKey: rule.external_rule_key,
                ruleName: rule.rule_name,
                domain: rule.domain,
                theme: rule.theme,
                direction: rule.direction,
                strength: rule.strength,
                safetyClass: rule.safety_class,
                status: rule.status,
                smeConfidence: rule.sme_confidence,
                sensitiveSubjects: rule.sensitive_subjects ?? [],
                primaryCondition: (rule.conditions ?? []).find((c) => c.role === 'PRIMARY')
                    ?.raw_expression ?? '',
                interpretationKey: rule.interpretation_key,
                reviewStatus: item?.review_status ?? null,
                requiresTwoPersonReview: item?.requires_two_person_review ?? false,
                hasSecondaryReview: item?.secondary_reviewer_id != null,
                duplicateOfKey: item?.duplicate_of_key ?? null,
                sourceRow: rule.source_row,
            };
        });
        if (options.reviewStatus) {
            const wanted = options.reviewStatus.toUpperCase();
            mapped = mapped.filter((r) => r.reviewStatus === wanted);
        }
        return { items: mapped, total };
    }
    async auditTrail(versionId) {
        const entries = await this.auditLog.find({
            where: { rulebook_version_id: versionId },
            order: { created_at: 'DESC' },
            take: 200,
        });
        return entries.map((entry) => ({
            action: entry.action,
            actorId: entry.actor_id,
            actorRole: entry.actor_role,
            fromStatus: entry.from_status,
            toStatus: entry.to_status,
            reason: entry.reason,
            metadata: entry.metadata,
            at: entry.created_at.toISOString(),
        }));
    }
};
exports.RulebookDashboardService = RulebookDashboardService;
exports.RulebookDashboardService = RulebookDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_rulebook_version_entity_1.ZunoRulebookVersion)),
    __param(1, (0, typeorm_1.InjectRepository)(zuno_rulebook_rule_entity_1.ZunoRulebookRule)),
    __param(2, (0, typeorm_1.InjectRepository)(zuno_rulebook_governance_entity_1.ZunoRulebookReviewItem)),
    __param(3, (0, typeorm_1.InjectRepository)(zuno_rulebook_governance_entity_1.ZunoRulebookValidationRun)),
    __param(4, (0, typeorm_1.InjectRepository)(zuno_rulebook_governance_entity_1.ZunoRulebookAuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RulebookDashboardService);
function tally(values) {
    return values.reduce((acc, value) => {
        if (!value)
            return acc;
        acc[value] = (acc[value] ?? 0) + 1;
        return acc;
    }, {});
}
//# sourceMappingURL=rulebook-dashboard.service.js.map