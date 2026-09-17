import type { Response } from 'express';
import { ZunoPayload } from '../../common/interceptors/zuno-response.interceptor';
import { RulebookGovernanceService } from '../services/rulebook-governance.service';
import { RulebookActorService } from '../services/rulebook-actor.service';
import { RulebookTemplateService } from '../templates/rulebook-template.service';
import { RulebookRepositoryService } from '../services/rulebook-repository.service';
import { RulebookDashboardService } from '../services/rulebook-dashboard.service';
import { ApproveRulebookDto, RecordRegressionDto, RejectRulebookDto, ReviewRuleDto, RollbackRulebookDto, RulebookVersionView, UploadRulebookDto, ValidationRunView } from '../dtos/rulebook.dtos';
export declare class AdminRulebookController {
    private readonly governance;
    private readonly actors;
    private readonly templates;
    private readonly repository;
    private readonly dashboard;
    constructor(governance: RulebookGovernanceService, actors: RulebookActorService, templates: RulebookTemplateService, repository: RulebookRepositoryService, dashboard: RulebookDashboardService);
    downloadTemplate(req: any, res: Response): Promise<void>;
    list(req: any, limit?: string): Promise<ZunoPayload<RulebookVersionView[]>>;
    active(req: any): Promise<{
        active: import("../services/rulebook-repository.service").ActiveRulebook;
        astrologyAvailable: boolean;
        message: string;
    }>;
    detail(req: any, versionId: string): Promise<RulebookVersionView>;
    upload(req: any, file: {
        originalname: string;
        buffer: Buffer;
    } | undefined, dto: UploadRulebookDto): Promise<{
        versionId: string;
        version: string;
        status: import("../../common/enums").RulebookStatus;
        fileHash: string;
        nextStep: string;
    }>;
    validate(req: any, versionId: string, file: {
        buffer: Buffer;
    } | undefined): Promise<{
        version: RulebookVersionView;
        validation: ValidationRunView;
    }>;
    reviewDashboard(req: any, versionId: string): Promise<Record<string, unknown>>;
    rules(req: any, versionId: string, reviewStatus?: string, domain?: string, limit?: string, offset?: string): Promise<ZunoPayload<import("../services/rulebook-dashboard.service").RuleListItem[]>>;
    reviewRule(req: any, versionId: string, ruleId: string, dto: ReviewRuleDto): Promise<{
        ruleId: string;
        ruleKey: string;
        reviewStatus: import("../../common/enums").RuleReviewStatus;
        requiresTwoPersonReview: boolean;
        hasSecondaryReview: boolean;
    }>;
    approve(req: any, versionId: string, dto: ApproveRulebookDto): Promise<RulebookVersionView>;
    reject(req: any, versionId: string, dto: RejectRulebookDto): Promise<RulebookVersionView>;
    stage(req: any, versionId: string): Promise<RulebookVersionView>;
    regression(req: any, versionId: string, dto: RecordRegressionDto): Promise<RulebookVersionView>;
    approveForProduction(req: any, versionId: string): Promise<RulebookVersionView>;
    activate(req: any, versionId: string, dto: ApproveRulebookDto): Promise<RulebookVersionView>;
    rollback(req: any, versionId: string, dto: RollbackRulebookDto): Promise<RulebookVersionView>;
    audit(req: any, versionId: string): Promise<Record<string, unknown>[]>;
    validation(req: any, versionId: string): Promise<ValidationRunView>;
}
