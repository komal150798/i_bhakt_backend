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
var RulebookGovernanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulebookGovernanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_rulebook_version_entity_1 = require("../entities/zuno-rulebook-version.entity");
const zuno_rulebook_rule_entity_1 = require("../entities/zuno-rulebook-rule.entity");
const zuno_rulebook_governance_entity_1 = require("../entities/zuno-rulebook-governance.entity");
const rulebook_parser_service_1 = require("../parsing/rulebook-parser.service");
const rulebook_validator_service_1 = require("../validation/rulebook-validator.service");
const rulebook_compiler_service_1 = require("./rulebook-compiler.service");
const clock_service_1 = require("../../common/services/clock.service");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const enums_1 = require("../../common/enums");
let RulebookGovernanceService = RulebookGovernanceService_1 = class RulebookGovernanceService {
    constructor(versions, rules, validationRuns, reviewItems, parser, validator, compiler, clock, dataSource) {
        this.versions = versions;
        this.rules = rules;
        this.validationRuns = validationRuns;
        this.reviewItems = reviewItems;
        this.parser = parser;
        this.validator = validator;
        this.compiler = compiler;
        this.clock = clock;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(RulebookGovernanceService_1.name);
    }
    async upload(actor, input) {
        this.requirePermission(actor, enums_1.RulebookPermission.RULEBOOK_UPLOAD);
        if (!/^\d+\.\d+\.\d+$/.test(input.version)) {
            throw zuno_exception_1.ZunoException.validation([{ field: 'version', code: 'INVALID_SEMVER' }], 'Version must be semantic, e.g. 1.5.0.');
        }
        const duplicateVersion = await this.versions.findOne({
            where: { version: input.version },
        });
        if (duplicateVersion) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                message: `Version ${input.version} has already been uploaded.`,
            });
        }
        const parsed = await this.parser.parse(input.buffer, input.fileName);
        const duplicateFile = await this.versions.findOne({
            where: { source_file_hash: parsed.fileHash },
        });
        if (duplicateFile) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                message: `This exact file was already uploaded as version ${duplicateFile.version}.`,
            });
        }
        const now = this.clock.now();
        return this.dataSource.transaction(async (manager) => {
            const version = manager.create(zuno_rulebook_version_entity_1.ZunoRulebookVersion, {
                version: input.version,
                release_name: input.releaseName,
                description: input.description ?? null,
                release_type: input.releaseType,
                status: enums_1.RulebookStatus.UPLOADED,
                source_file_name: input.fileName,
                source_file_hash: parsed.fileHash,
                source_file_size: String(parsed.fileSize),
                source_file_location: input.storedLocation ?? null,
                sme_reference: input.smeReference ?? null,
                change_summary: input.changeSummary ?? null,
                uploaded_by: actor.userId,
                uploaded_at: now,
                is_production: false,
            });
            const saved = await manager.save(zuno_rulebook_version_entity_1.ZunoRulebookVersion, version);
            await this.audit(manager, saved.id, enums_1.RulebookAuditAction.RULEBOOK_UPLOADED, actor, {
                toStatus: enums_1.RulebookStatus.UPLOADED,
                metadata: {
                    file_hash: parsed.fileHash,
                    file_size: parsed.fileSize,
                    release_type: input.releaseType,
                },
            });
            this.logger.log(`Rulebook ${saved.version} uploaded by ${actor.userId} (${parsed.fileHash.slice(0, 12)})`);
            return saved;
        });
    }
    async validate(actor, versionId, buffer) {
        this.requirePermission(actor, enums_1.RulebookPermission.RULEBOOK_VALIDATE);
        const version = await this.findVersion(versionId);
        this.assertTransition(version, enums_1.RulebookStatus.VALIDATING);
        const startedAt = this.clock.now();
        const parsed = await this.parser.parse(buffer, version.source_file_name);
        if (parsed.fileHash !== version.source_file_hash) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                message: 'The supplied file does not match the uploaded file for this version.',
                internalDetail: 'rulebook file hash mismatch on validate',
            });
        }
        const result = this.validator.validate(parsed);
        return this.dataSource.transaction(async (manager) => {
            await this.setStatus(manager, version, enums_1.RulebookStatus.VALIDATING, actor, {
                action: enums_1.RulebookAuditAction.VALIDATION_STARTED,
            });
            const run = manager.create(zuno_rulebook_governance_entity_1.ZunoRulebookValidationRun, {
                rulebook_version_id: version.id,
                validator_version: `${rulebook_parser_service_1.RULEBOOK_PARSER_VERSION}+${rulebook_validator_service_1.RULEBOOK_VALIDATOR_VERSION}`,
                status: result.passed
                    ? result.warningCount > 0
                        ? 'PASSED_WITH_WARNINGS'
                        : 'PASSED'
                    : 'FAILED',
                total_rules: result.totalRules,
                valid_rules: result.validRules,
                invalid_rules: result.invalidRules,
                error_count: result.errorCount,
                warning_count: result.warningCount,
                findings: result.findings,
                started_at: startedAt,
                completed_at: this.clock.now(),
            });
            const savedRun = await manager.save(zuno_rulebook_governance_entity_1.ZunoRulebookValidationRun, run);
            if (!result.passed) {
                const failed = await this.setStatus(manager, version, enums_1.RulebookStatus.VALIDATION_FAILED, actor, {
                    action: enums_1.RulebookAuditAction.VALIDATION_FAILED,
                    reason: `${result.errorCount} validation error(s)`,
                    metadata: { validation_run_id: savedRun.id },
                });
                return { version: failed, run: savedRun };
            }
            const counts = await this.compiler.compile(manager, version.id, parsed);
            version.total_rules = counts.rules;
            version.total_interpretations = counts.interpretations;
            version.total_remedies = counts.remedies;
            version.total_timing_rules = counts.timingRules;
            version.total_golden_cases = counts.goldenCases;
            version.domains_covered = counts.domainsCovered;
            await manager.save(zuno_rulebook_version_entity_1.ZunoRulebookVersion, version);
            await this.seedReviewItems(manager, version.id, result.duplicateCandidates);
            const validated = await this.setStatus(manager, version, enums_1.RulebookStatus.VALIDATED, actor, {
                action: enums_1.RulebookAuditAction.VALIDATION_PASSED,
                metadata: {
                    validation_run_id: savedRun.id,
                    rules: counts.rules,
                    warnings: result.warningCount,
                },
            });
            this.logger.log(`Rulebook ${version.version} validated: ${counts.rules} rules compiled, ${result.warningCount} warnings`);
            return { version: validated, run: savedRun };
        });
    }
    async seedReviewItems(manager, versionId, duplicateCandidates) {
        const rules = await manager.find(zuno_rulebook_rule_entity_1.ZunoRulebookRule, {
            where: { rulebook_version_id: versionId },
        });
        const duplicates = new Map(duplicateCandidates.map((d) => [d.key, d.duplicateOf]));
        const items = rules.map((rule) => manager.create(zuno_rulebook_governance_entity_1.ZunoRulebookReviewItem, {
            rulebook_version_id: versionId,
            rule_id: rule.id,
            external_rule_key: rule.external_rule_key,
            review_status: duplicates.has(rule.external_rule_key)
                ? enums_1.RuleReviewStatus.POSSIBLE_DUPLICATE
                : enums_1.RuleReviewStatus.PENDING,
            duplicate_of_key: duplicates.get(rule.external_rule_key) ?? null,
            requires_two_person_review: this.requiresTwoPersonReview(rule),
        }));
        if (items.length) {
            await manager.save(zuno_rulebook_governance_entity_1.ZunoRulebookReviewItem, items, { chunk: 200 });
        }
    }
    requiresTwoPersonReview(rule) {
        const highImpactSubjects = [
            enums_1.SensitiveSubject.HEALTH,
            enums_1.SensitiveSubject.DISEASE,
            enums_1.SensitiveSubject.DEATH,
            enums_1.SensitiveSubject.LONGEVITY,
            enums_1.SensitiveSubject.PREGNANCY,
            enums_1.SensitiveSubject.CHILD_GENDER,
            enums_1.SensitiveSubject.LEGAL_CONSEQUENCE,
            enums_1.SensitiveSubject.FINANCIAL_LOSS,
            enums_1.SensitiveSubject.MISSING_PERSON,
        ];
        if ((rule.sensitive_subjects ?? []).some((s) => highImpactSubjects.includes(s))) {
            return true;
        }
        return (rule.safety_class === enums_1.RuleSafetyClass.SME_SUPERVISION ||
            rule.safety_class === enums_1.RuleSafetyClass.EXCLUDE_PENDING_SPECIAL_REVIEW ||
            rule.safety_class === enums_1.RuleSafetyClass.REQUIRES_CAUTION);
    }
    async reviewRule(actor, versionId, ruleId, decision) {
        this.requirePermission(actor, enums_1.RulebookPermission.RULEBOOK_REVIEW);
        const version = await this.findVersion(versionId);
        if (version.status !== enums_1.RulebookStatus.VALIDATED &&
            version.status !== enums_1.RulebookStatus.SME_REVIEW_IN_PROGRESS) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                message: `Rules cannot be reviewed while the rulebook is ${version.status}.`,
            });
        }
        const item = await this.reviewItems.findOne({ where: { rule_id: ruleId } });
        if (!item || item.rulebook_version_id !== versionId) {
            throw zuno_exception_1.ZunoException.notFound('review item');
        }
        return this.dataSource.transaction(async (manager) => {
            if (version.status === enums_1.RulebookStatus.VALIDATED) {
                await this.setStatus(manager, version, enums_1.RulebookStatus.SME_REVIEW_IN_PROGRESS, actor, { action: enums_1.RulebookAuditAction.SME_REVIEW_STARTED });
            }
            if (decision.isSecondaryReview) {
                if (item.secondary_reviewer_id === actor.userId) {
                    throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                        message: 'You have already recorded a secondary review for this rule.',
                    });
                }
                if (item.reviewer_id === actor.userId) {
                    throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.FORBIDDEN, {
                        message: 'The secondary review must be performed by a different reviewer.',
                    });
                }
                item.secondary_reviewer_id = actor.userId;
                item.secondary_reviewed_at = this.clock.now();
            }
            else {
                item.reviewer_id = actor.userId;
                item.reviewed_at = this.clock.now();
            }
            item.review_status = decision.status;
            item.review_comment = decision.comment ?? item.review_comment;
            return manager.save(zuno_rulebook_governance_entity_1.ZunoRulebookReviewItem, item);
        });
    }
    async smeApprove(actor, versionId, comment) {
        this.requirePermission(actor, enums_1.RulebookPermission.RULEBOOK_APPROVE);
        const version = await this.findVersion(versionId);
        if (version.uploaded_by && version.uploaded_by === actor.userId) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.FORBIDDEN, {
                message: 'The person who uploaded a rulebook cannot also give SME approval for it.',
                internalDetail: 'separation of duties: uploader === approver',
            });
        }
        const outstanding = await this.reviewItems.count({
            where: {
                rulebook_version_id: versionId,
                review_status: enums_1.RuleReviewStatus.PENDING,
            },
        });
        if (outstanding > 0) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                message: `${outstanding} rule(s) are still awaiting review.`,
            });
        }
        const missingSecondary = await this.reviewItems
            .createQueryBuilder('item')
            .where('item.rulebook_version_id = :versionId', { versionId })
            .andWhere('item.requires_two_person_review = true')
            .andWhere('item.secondary_reviewer_id IS NULL')
            .getCount();
        if (missingSecondary > 0) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                message: `${missingSecondary} high-impact rule(s) still need a second reviewer.`,
            });
        }
        return this.dataSource.transaction(async (manager) => {
            version.reviewed_by = actor.userId;
            version.reviewed_at = this.clock.now();
            version.approved_by = actor.userId;
            version.approved_at = this.clock.now();
            return this.setStatus(manager, version, enums_1.RulebookStatus.SME_REVIEWED, actor, {
                action: enums_1.RulebookAuditAction.SME_APPROVED,
                reason: comment,
            });
        });
    }
    async smeReject(actor, versionId, reason) {
        this.requirePermission(actor, enums_1.RulebookPermission.RULEBOOK_APPROVE);
        if (!reason?.trim()) {
            throw zuno_exception_1.ZunoException.validation([{ field: 'reason', code: 'REQUIRED' }]);
        }
        const version = await this.findVersion(versionId);
        return this.dataSource.transaction(async (manager) => this.setStatus(manager, version, enums_1.RulebookStatus.SME_REJECTED, actor, {
            action: enums_1.RulebookAuditAction.SME_REJECTED,
            reason,
        }));
    }
    async moveToStaging(actor, versionId) {
        this.requirePermission(actor, enums_1.RulebookPermission.RULEBOOK_STAGE);
        const version = await this.findVersion(versionId);
        return this.dataSource.transaction(async (manager) => this.setStatus(manager, version, enums_1.RulebookStatus.STAGING, actor, {
            action: enums_1.RulebookAuditAction.STAGING_ACTIVATED,
        }));
    }
    async recordRegression(actor, versionId, outcome) {
        this.requirePermission(actor, enums_1.RulebookPermission.RULEBOOK_STAGE);
        const version = await this.findVersion(versionId);
        return this.dataSource.transaction(async (manager) => {
            await this.setStatus(manager, version, enums_1.RulebookStatus.REGRESSION_RUNNING, actor, { action: enums_1.RulebookAuditAction.REGRESSION_STARTED });
            const passed = outcome.passed && outcome.criticalRegressions === 0;
            return this.setStatus(manager, version, passed ? enums_1.RulebookStatus.REGRESSION_PASSED : enums_1.RulebookStatus.REGRESSION_FAILED, actor, {
                action: passed
                    ? enums_1.RulebookAuditAction.REGRESSION_PASSED
                    : enums_1.RulebookAuditAction.REGRESSION_FAILED,
                reason: outcome.notes,
                metadata: { ...outcome },
            });
        });
    }
    async approveForProduction(actor, versionId) {
        this.requirePermission(actor, enums_1.RulebookPermission.RULEBOOK_ACTIVATE);
        const version = await this.findVersion(versionId);
        return this.dataSource.transaction(async (manager) => this.setStatus(manager, version, enums_1.RulebookStatus.APPROVED, actor, {
            action: enums_1.RulebookAuditAction.SME_APPROVED,
        }));
    }
    async activate(actor, versionId, reason) {
        this.requirePermission(actor, enums_1.RulebookPermission.RULEBOOK_ACTIVATE);
        const version = await this.findVersion(versionId);
        if (version.approved_by && version.approved_by === actor.userId) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.FORBIDDEN, {
                message: 'The person who gave SME approval cannot also activate the rulebook in production.',
                internalDetail: 'separation of duties: approver === activator',
            });
        }
        return this.dataSource.transaction(async (manager) => {
            const current = await manager.findOne(zuno_rulebook_version_entity_1.ZunoRulebookVersion, {
                where: { is_production: true },
            });
            if (current && current.id !== version.id) {
                current.is_production = false;
                current.superseded_at = this.clock.now();
                await this.setStatus(manager, current, enums_1.RulebookStatus.SUPERSEDED, actor, {
                    action: enums_1.RulebookAuditAction.PRODUCTION_ACTIVATED,
                    reason: `Superseded by ${version.version}`,
                });
            }
            version.is_production = true;
            version.activated_by = actor.userId;
            version.activated_at = this.clock.now();
            version.supersedes_version_id = current?.id ?? null;
            const activated = await this.setStatus(manager, version, enums_1.RulebookStatus.PRODUCTION, actor, {
                action: enums_1.RulebookAuditAction.PRODUCTION_ACTIVATED,
                reason,
                metadata: { supersedes: current?.version ?? null },
            });
            this.logger.log(`Rulebook ${version.version} is now PRODUCTION (activated by ${actor.userId})`);
            return activated;
        });
    }
    async rollback(actor, targetVersionId, reason) {
        this.requirePermission(actor, enums_1.RulebookPermission.RULEBOOK_ROLLBACK);
        if (!reason?.trim()) {
            throw zuno_exception_1.ZunoException.validation([{ field: 'reason', code: 'REQUIRED' }], 'A rollback requires a reason.');
        }
        const target = await this.findVersion(targetVersionId);
        if (target.status !== enums_1.RulebookStatus.SUPERSEDED) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                message: `Only a previously superseded version can be rolled back to. Version ${target.version} is ${target.status}.`,
            });
        }
        return this.dataSource.transaction(async (manager) => {
            await this.audit(manager, target.id, enums_1.RulebookAuditAction.ROLLBACK_INITIATED, actor, {
                reason,
            });
            const current = await manager.findOne(zuno_rulebook_version_entity_1.ZunoRulebookVersion, {
                where: { is_production: true },
            });
            if (current) {
                current.is_production = false;
                await this.setStatus(manager, current, enums_1.RulebookStatus.ROLLED_BACK, actor, {
                    action: enums_1.RulebookAuditAction.ROLLBACK_COMPLETED,
                    reason,
                });
            }
            target.is_production = true;
            target.activated_by = actor.userId;
            target.activated_at = this.clock.now();
            target.superseded_at = null;
            const restored = await this.setStatus(manager, target, enums_1.RulebookStatus.PRODUCTION, actor, {
                action: enums_1.RulebookAuditAction.ROLLBACK_COMPLETED,
                reason,
                metadata: { rolled_back_from: current?.version ?? null },
            });
            this.logger.warn(`Rulebook rolled back to ${target.version} by ${actor.userId}: ${reason}`);
            return restored;
        });
    }
    async findVersion(versionId) {
        const version = await this.versions.findOne({ where: { id: versionId } });
        if (!version)
            throw zuno_exception_1.ZunoException.notFound('rulebook version');
        return version;
    }
    assertTransition(version, next) {
        if (!(0, enums_1.canTransitionRulebook)(version.status, next)) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                message: `A rulebook in state ${version.status} cannot move to ${next}.`,
                internalDetail: `illegal rulebook transition ${version.status} -> ${next}`,
            });
        }
    }
    async setStatus(manager, version, next, actor, options) {
        const from = version.status;
        if (from !== next) {
            this.assertTransition(version, next);
            version.status = next;
        }
        if (options.reason)
            version.status_reason = options.reason;
        const saved = await manager.save(zuno_rulebook_version_entity_1.ZunoRulebookVersion, version);
        await this.audit(manager, saved.id, options.action, actor, {
            fromStatus: from,
            toStatus: next,
            reason: options.reason,
            metadata: options.metadata,
        });
        return saved;
    }
    async audit(manager, versionId, action, actor, options = {}) {
        const entry = manager.create(zuno_rulebook_governance_entity_1.ZunoRulebookAuditLog, {
            rulebook_version_id: versionId,
            action,
            actor_id: actor.userId,
            actor_role: actor.role,
            reason: options.reason ?? null,
            from_status: options.fromStatus ?? null,
            to_status: options.toStatus ?? null,
            metadata: options.metadata ?? null,
            redacted_at: null,
        });
        await manager.save(zuno_rulebook_governance_entity_1.ZunoRulebookAuditLog, entry);
    }
    requirePermission(actor, permission) {
        if (!actor?.permissions?.includes(permission)) {
            this.logger.warn(`Denied ${permission} for actor ${actor?.userId ?? 'unknown'} (role ${actor?.role ?? 'none'})`);
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.FORBIDDEN, {
                message: 'This action is not available with your role.',
                internalDetail: `missing permission ${permission}`,
            });
        }
    }
};
exports.RulebookGovernanceService = RulebookGovernanceService;
exports.RulebookGovernanceService = RulebookGovernanceService = RulebookGovernanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_rulebook_version_entity_1.ZunoRulebookVersion)),
    __param(1, (0, typeorm_1.InjectRepository)(zuno_rulebook_rule_entity_1.ZunoRulebookRule)),
    __param(2, (0, typeorm_1.InjectRepository)(zuno_rulebook_governance_entity_1.ZunoRulebookValidationRun)),
    __param(3, (0, typeorm_1.InjectRepository)(zuno_rulebook_governance_entity_1.ZunoRulebookReviewItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        rulebook_parser_service_1.RulebookParserService,
        rulebook_validator_service_1.RulebookValidatorService,
        rulebook_compiler_service_1.RulebookCompilerService,
        clock_service_1.ClockService,
        typeorm_2.DataSource])
], RulebookGovernanceService);
//# sourceMappingURL=rulebook-governance.service.js.map