import { RuleReviewStatus, RulebookReleaseType, RulebookStatus } from '../../common/enums';
import { ZunoRulebookVersion } from '../entities/zuno-rulebook-version.entity';
import { ZunoRulebookValidationRun } from '../entities/zuno-rulebook-governance.entity';
export declare class UploadRulebookDto {
    version: string;
    releaseName: string;
    description?: string;
    releaseType: RulebookReleaseType;
    smeReference?: string;
    changeSummary?: string;
    file?: unknown;
}
export declare class ReviewRuleDto {
    status: RuleReviewStatus;
    comment?: string;
    isSecondaryReview?: boolean;
}
export declare class ApproveRulebookDto {
    comment?: string;
}
export declare class RejectRulebookDto {
    reason: string;
}
export declare class RollbackRulebookDto {
    reason: string;
}
export declare class RecordRegressionDto {
    passed: boolean;
    totalCases: number;
    unchanged: number;
    improvements: number;
    needsReview: number;
    criticalRegressions: number;
    notes?: string;
}
export declare class RulebookVersionView {
    id: string;
    version: string;
    releaseName: string;
    status: RulebookStatus;
    releaseType: RulebookReleaseType;
    isProduction: boolean;
    description: string | null;
    smeReference: string | null;
    changeSummary: string | null;
    fileName: string;
    fileHash: string;
    totals: {
        rules: number;
        interpretations: number;
        remedies: number;
        timingRules: number;
        goldenCases: number;
    };
    domainsCovered: string[];
    statusReason: string | null;
    uploadedAt: string;
    approvedAt: string | null;
    activatedAt: string | null;
    supersededAt: string | null;
    static from(version: ZunoRulebookVersion): RulebookVersionView;
}
export declare class ValidationRunView {
    id: string;
    status: string;
    validatorVersion: string;
    totals: {
        rules: number;
        validRules: number;
        invalidRules: number;
        errors: number;
        warnings: number;
    };
    findings: unknown[];
    startedAt: string;
    completedAt: string | null;
    static from(run: ZunoRulebookValidationRun): ValidationRunView;
}
