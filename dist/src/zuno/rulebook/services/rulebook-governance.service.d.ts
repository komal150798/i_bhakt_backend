import { DataSource, Repository } from 'typeorm';
import { ZunoRulebookVersion } from '../entities/zuno-rulebook-version.entity';
import { ZunoRulebookRule } from '../entities/zuno-rulebook-rule.entity';
import { ZunoRulebookReviewItem, ZunoRulebookValidationRun } from '../entities/zuno-rulebook-governance.entity';
import { RulebookParserService } from '../parsing/rulebook-parser.service';
import { RulebookValidatorService } from '../validation/rulebook-validator.service';
import { RulebookCompilerService } from './rulebook-compiler.service';
import { ClockService } from '../../common/services/clock.service';
import { RuleReviewStatus, RulebookPermission, RulebookReleaseType } from '../../common/enums';
export interface GovernanceActor {
    userId: string;
    role: string;
    permissions: RulebookPermission[];
}
export interface UploadRulebookInput {
    version: string;
    releaseName: string;
    description?: string;
    releaseType: RulebookReleaseType;
    smeReference?: string;
    changeSummary?: string;
    fileName: string;
    buffer: Buffer;
    storedLocation?: string | null;
}
export declare class RulebookGovernanceService {
    private readonly versions;
    private readonly rules;
    private readonly validationRuns;
    private readonly reviewItems;
    private readonly parser;
    private readonly validator;
    private readonly compiler;
    private readonly clock;
    private readonly dataSource;
    private readonly logger;
    constructor(versions: Repository<ZunoRulebookVersion>, rules: Repository<ZunoRulebookRule>, validationRuns: Repository<ZunoRulebookValidationRun>, reviewItems: Repository<ZunoRulebookReviewItem>, parser: RulebookParserService, validator: RulebookValidatorService, compiler: RulebookCompilerService, clock: ClockService, dataSource: DataSource);
    upload(actor: GovernanceActor, input: UploadRulebookInput): Promise<ZunoRulebookVersion>;
    validate(actor: GovernanceActor, versionId: string, buffer: Buffer): Promise<{
        version: ZunoRulebookVersion;
        run: ZunoRulebookValidationRun;
    }>;
    private seedReviewItems;
    private requiresTwoPersonReview;
    reviewRule(actor: GovernanceActor, versionId: string, ruleId: string, decision: {
        status: RuleReviewStatus;
        comment?: string;
        isSecondaryReview?: boolean;
    }): Promise<ZunoRulebookReviewItem>;
    smeApprove(actor: GovernanceActor, versionId: string, comment?: string): Promise<ZunoRulebookVersion>;
    smeReject(actor: GovernanceActor, versionId: string, reason: string): Promise<ZunoRulebookVersion>;
    moveToStaging(actor: GovernanceActor, versionId: string): Promise<ZunoRulebookVersion>;
    recordRegression(actor: GovernanceActor, versionId: string, outcome: {
        passed: boolean;
        totalCases: number;
        unchanged: number;
        improvements: number;
        needsReview: number;
        criticalRegressions: number;
        notes?: string;
    }): Promise<ZunoRulebookVersion>;
    approveForProduction(actor: GovernanceActor, versionId: string): Promise<ZunoRulebookVersion>;
    activate(actor: GovernanceActor, versionId: string, reason?: string): Promise<ZunoRulebookVersion>;
    rollback(actor: GovernanceActor, targetVersionId: string, reason: string): Promise<ZunoRulebookVersion>;
    findVersion(versionId: string): Promise<ZunoRulebookVersion>;
    private assertTransition;
    private setStatus;
    private audit;
    private requirePermission;
}
