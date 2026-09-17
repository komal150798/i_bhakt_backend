import { Repository } from 'typeorm';
import { ZunoRulebookVersion } from '../entities/zuno-rulebook-version.entity';
import { ZunoRulebookRule } from '../entities/zuno-rulebook-rule.entity';
import { ZunoRulebookAuditLog, ZunoRulebookReviewItem, ZunoRulebookValidationRun } from '../entities/zuno-rulebook-governance.entity';
import { RuleReviewStatus } from '../../common/enums';
export interface RuleListItem {
    ruleId: string;
    ruleKey: string;
    ruleName: string;
    domain: string;
    theme: string;
    direction: string;
    strength: string;
    safetyClass: string;
    status: string;
    smeConfidence: string;
    sensitiveSubjects: string[];
    primaryCondition: string;
    interpretationKey: string | null;
    reviewStatus: RuleReviewStatus | null;
    requiresTwoPersonReview: boolean;
    hasSecondaryReview: boolean;
    duplicateOfKey: string | null;
    sourceRow: number | null;
}
export declare class RulebookDashboardService {
    private readonly versions;
    private readonly rules;
    private readonly reviewItems;
    private readonly validationRuns;
    private readonly auditLog;
    constructor(versions: Repository<ZunoRulebookVersion>, rules: Repository<ZunoRulebookRule>, reviewItems: Repository<ZunoRulebookReviewItem>, validationRuns: Repository<ZunoRulebookValidationRun>, auditLog: Repository<ZunoRulebookAuditLog>);
    listVersions(limit: number): Promise<ZunoRulebookVersion[]>;
    latestValidationRun(versionId: string): Promise<ZunoRulebookValidationRun | null>;
    reviewDashboard(versionId: string): Promise<Record<string, unknown>>;
    listRules(versionId: string, options: {
        reviewStatus?: string;
        domain?: string;
        limit: number;
        offset: number;
    }): Promise<{
        items: RuleListItem[];
        total: number;
    }>;
    auditTrail(versionId: string): Promise<Record<string, unknown>[]>;
}
