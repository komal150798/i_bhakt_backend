import { ZunoBaseEntity, ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { RuleReviewStatus, RulebookAuditAction, ValidationSeverity } from '../../common/enums';
export interface ValidationFinding {
    severity: ValidationSeverity;
    code: string;
    sheet?: string;
    row?: number;
    column?: string;
    entity_key?: string;
    message: string;
}
export declare class ZunoRulebookValidationRun extends ZunoBaseEntity {
    rulebook_version_id: string;
    validator_version: string;
    status: 'RUNNING' | 'PASSED' | 'PASSED_WITH_WARNINGS' | 'FAILED';
    total_rules: number;
    valid_rules: number;
    invalid_rules: number;
    error_count: number;
    warning_count: number;
    findings: ValidationFinding[];
    started_at: Date;
    completed_at: Date | null;
}
export declare class ZunoRulebookReviewItem extends ZunoBaseEntity {
    rulebook_version_id: string;
    rule_id: string;
    external_rule_key: string;
    review_status: RuleReviewStatus;
    reviewer_id: string | null;
    review_comment: string | null;
    reviewed_at: Date | null;
    secondary_reviewer_id: string | null;
    secondary_reviewed_at: Date | null;
    requires_two_person_review: boolean;
    duplicate_of_key: string | null;
}
export declare class ZunoRulebookAuditLog extends ZunoImmutableEntity {
    rulebook_version_id: string;
    action: RulebookAuditAction;
    actor_id: string | null;
    actor_role: string | null;
    reason: string | null;
    from_status: string | null;
    to_status: string | null;
    metadata: Record<string, unknown> | null;
}
