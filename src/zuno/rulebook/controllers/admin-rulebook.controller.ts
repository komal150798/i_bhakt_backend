import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ZunoResponseInterceptor, ZunoPayload } from '../../common/interceptors/zuno-response.interceptor';
import { ZunoExceptionFilter } from '../../common/filters/zuno-exception.filter';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { RulebookGovernanceService } from '../services/rulebook-governance.service';
import { RulebookActorService } from '../services/rulebook-actor.service';
import { RulebookTemplateService } from '../templates/rulebook-template.service';
import { RulebookRepositoryService } from '../services/rulebook-repository.service';
import { RulebookDashboardService } from '../services/rulebook-dashboard.service';
import {
  ApproveRulebookDto,
  RecordRegressionDto,
  RejectRulebookDto,
  ReviewRuleDto,
  RollbackRulebookDto,
  RulebookVersionView,
  UploadRulebookDto,
  ValidationRunView,
} from '../dtos/rulebook.dtos';

/**
 * System Admin Rulebook API. Step 21 API Contracts sections 71-79.
 *
 * Every route resolves a GovernanceActor from the authenticated admin and
 * passes it to the service, which checks the specific permission. Nothing here
 * trusts a role sent by the client (Step 21 Rule 6), and no route can move a
 * rulebook to production on its own - the lifecycle enforces the full path.
 *
 * Mounted under `/api/v1/internal/rulebooks` rather than `/api/v1/admin/...`
 * because the `admin` prefix is already owned by the existing iBhakt admin
 * controllers, and `internal` is in ZUNO_ROUTE_ROOTS so these routes get the
 * ZUNO response envelope. Recorded in ZUNO_DECISION_LOG.md item 14.
 */
@ApiTags('ZUNO - Admin Rulebook')
@ApiBearerAuth('JWT-auth')
@Controller('internal/rulebooks')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class AdminRulebookController {
  constructor(
    private readonly governance: RulebookGovernanceService,
    private readonly actors: RulebookActorService,
    private readonly templates: RulebookTemplateService,
    private readonly repository: RulebookRepositoryService,
    private readonly dashboard: RulebookDashboardService,
  ) {}

  /**
   * Downloads the blank workbook for the SME to fill in.
   *
   * Generated from the same schema the parser and validator use, so a correctly
   * completed template cannot fail schema validation.
   */
  @Get('template')
  @ApiOperation({ summary: 'Download the blank SME Rulebook template (.xlsx)' })
  async downloadTemplate(@Req() req: any, @Res() res: Response): Promise<void> {
    await this.actors.resolve(req.user); // any admin may read the template
    const buffer = await this.templates.generate();

    // Streams a file, so it bypasses the ZUNO JSON envelope deliberately.
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="ZUNO_Astrology_Rulebook_Template.xlsx"',
    );
    res.send(buffer);
  }

  /** Step 10 section 7: the rulebook dashboard. */
  @Get()
  @ApiOperation({ summary: 'List rulebook versions with lifecycle state' })
  async list(@Req() req: any, @Query('limit') limit?: string) {
    await this.actors.resolve(req.user);
    const versions = await this.dashboard.listVersions(
      Math.min(Number(limit) || 25, 100),
    );
    const active = await this.repository.getActive();
    return new ZunoPayload(versions.map(RulebookVersionView.from), {
      activeVersion: active?.version ?? null,
      astrologyAvailable: active !== null,
    });
  }

  @Get('active')
  @ApiOperation({ summary: 'The current production rulebook, if any' })
  @ApiResponse({ status: 200, description: 'Active version, or null.' })
  async active(@Req() req: any) {
    await this.actors.resolve(req.user);
    const active = await this.repository.getActive();
    // Null is a legitimate answer: no rulebook means astrology is disabled,
    // and saying so plainly is the point (Step 20 section 125).
    return {
      active,
      astrologyAvailable: active !== null,
      message: active
        ? null
        : 'No approved rulebook is active, so astrology-derived guidance is disabled.',
    };
  }

  @Get(':versionId')
  @ApiOperation({ summary: 'Rulebook version detail' })
  async detail(
    @Req() req: any,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    await this.actors.resolve(req.user);
    const version = await this.governance.findVersion(versionId);
    return RulebookVersionView.from(version);
  }

  /** Step 21 sections 72-73. Upload is not activation. */
  @Post()
  @HttpCode(201)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new rulebook version (.xlsx)' })
  @ApiBody({ type: UploadRulebookDto })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024, files: 1 },
    }),
  )
  async upload(
    @Req() req: any,
    @UploadedFile() file: { originalname: string; buffer: Buffer } | undefined,
    @Body() dto: UploadRulebookDto,
  ) {
    const actor = await this.actors.resolve(req.user);
    if (!file?.buffer) {
      throw ZunoException.validation(
        [{ field: 'file', code: 'REQUIRED' }],
        'An .xlsx workbook is required.',
      );
    }

    const version = await this.governance.upload(actor, {
      version: dto.version,
      releaseName: dto.releaseName,
      description: dto.description,
      releaseType: dto.releaseType,
      smeReference: dto.smeReference,
      changeSummary: dto.changeSummary,
      fileName: file.originalname,
      buffer: file.buffer,
    });

    return {
      versionId: version.id,
      version: version.version,
      status: version.status,
      fileHash: version.source_file_hash,
      nextStep:
        'Upload does not activate anything. Run validate next, then SME review.',
    };
  }

  /**
   * Step 21 section 74. Validates and, on success, compiles the rules.
   *
   * The workbook is re-supplied and its hash checked against the upload, so
   * validation always runs against exactly the bytes that were uploaded.
   */
  @Post(':versionId/validate')
  @HttpCode(200)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Validate and compile an uploaded rulebook' })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024, files: 1 } }),
  )
  async validate(
    @Req() req: any,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @UploadedFile() file: { buffer: Buffer } | undefined,
  ) {
    const actor = await this.actors.resolve(req.user);
    if (!file?.buffer) {
      throw ZunoException.validation(
        [{ field: 'file', code: 'REQUIRED' }],
        'Re-supply the same .xlsx file that was uploaded for this version.',
      );
    }
    const { version, run } = await this.governance.validate(
      actor,
      versionId,
      file.buffer,
    );
    return {
      version: RulebookVersionView.from(version),
      validation: ValidationRunView.from(run),
    };
  }

  /** Step 21 section 75: SME review dashboard counts. */
  @Get(':versionId/review-dashboard')
  @ApiOperation({ summary: 'SME review progress and breakdowns' })
  async reviewDashboard(
    @Req() req: any,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    await this.actors.resolve(req.user);
    return this.dashboard.reviewDashboard(versionId);
  }

  /** Step 21 section 76: list rules for review. */
  @Get(':versionId/rules')
  @ApiOperation({ summary: 'List rules in a version, filterable by review state' })
  async rules(
    @Req() req: any,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Query('reviewStatus') reviewStatus?: string,
    @Query('domain') domain?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    await this.actors.resolve(req.user);
    const { items, total } = await this.dashboard.listRules(versionId, {
      reviewStatus,
      domain,
      limit: Math.min(Number(limit) || 50, 200),
      offset: Number(offset) || 0,
    });
    return new ZunoPayload(items, { total });
  }

  /** Step 21 section 76: record an SME decision on one rule. */
  @Post(':versionId/rules/:ruleId/review')
  @HttpCode(200)
  @ApiOperation({ summary: 'Record an SME review decision for a rule' })
  async reviewRule(
    @Req() req: any,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
    @Body() dto: ReviewRuleDto,
  ) {
    const actor = await this.actors.resolve(req.user);
    const item = await this.governance.reviewRule(actor, versionId, ruleId, {
      status: dto.status,
      comment: dto.comment,
      isSecondaryReview: dto.isSecondaryReview,
    });
    return {
      ruleId: item.rule_id,
      ruleKey: item.external_rule_key,
      reviewStatus: item.review_status,
      requiresTwoPersonReview: item.requires_two_person_review,
      hasSecondaryReview: item.secondary_reviewer_id !== null,
    };
  }

  /**
   * Step 21 section 77. SME approval must be explicit.
   *
   * Refuses if any rule is still pending, if a high-impact rule lacks its
   * second reviewer, or if the approver is the person who uploaded the file.
   */
  @Post(':versionId/approve')
  @HttpCode(200)
  @ApiOperation({ summary: 'SME approval of the whole rulebook' })
  @ApiResponse({ status: 409, description: 'Rules still awaiting review.' })
  @ApiResponse({ status: 403, description: 'Separation of duties violation.' })
  async approve(
    @Req() req: any,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: ApproveRulebookDto,
  ) {
    const actor = await this.actors.resolve(req.user);
    const version = await this.governance.smeApprove(actor, versionId, dto.comment);
    return RulebookVersionView.from(version);
  }

  @Post(':versionId/reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'SME rejection, with a required reason' })
  async reject(
    @Req() req: any,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: RejectRulebookDto,
  ) {
    const actor = await this.actors.resolve(req.user);
    const version = await this.governance.smeReject(actor, versionId, dto.reason);
    return RulebookVersionView.from(version);
  }

  /** Step 10 section 20: staging before production, always. */
  @Post(':versionId/stage')
  @HttpCode(200)
  @ApiOperation({ summary: 'Move an SME-approved rulebook to staging' })
  async stage(
    @Req() req: any,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    const actor = await this.actors.resolve(req.user);
    const version = await this.governance.moveToStaging(actor, versionId);
    return RulebookVersionView.from(version);
  }

  /** Step 10 sections 21-22: Golden Case regression outcome. */
  @Post(':versionId/regression')
  @HttpCode(200)
  @ApiOperation({ summary: 'Record the Golden Case regression result' })
  async regression(
    @Req() req: any,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: RecordRegressionDto,
  ) {
    const actor = await this.actors.resolve(req.user);
    const version = await this.governance.recordRegression(actor, versionId, {
      passed: dto.passed,
      totalCases: dto.totalCases,
      unchanged: dto.unchanged,
      improvements: dto.improvements,
      needsReview: dto.needsReview,
      criticalRegressions: dto.criticalRegressions,
      notes: dto.notes,
    });
    return RulebookVersionView.from(version);
  }

  @Post(':versionId/approve-for-production')
  @HttpCode(200)
  @ApiOperation({ summary: 'Administrative approval after SME sign-off and regression' })
  async approveForProduction(
    @Req() req: any,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    const actor = await this.actors.resolve(req.user);
    const version = await this.governance.approveForProduction(actor, versionId);
    return RulebookVersionView.from(version);
  }

  /**
   * Step 21 section 78. Atomic activation.
   *
   * Refuses if the activator is the person who gave SME approval, and
   * invalidates the runtime cache so no request is served from the retired
   * version (Step 20 section 124).
   */
  @Post(':versionId/activate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Activate as the single production rulebook' })
  @ApiResponse({ status: 403, description: 'Separation of duties violation.' })
  @ApiResponse({ status: 409, description: 'Illegal lifecycle transition.' })
  async activate(
    @Req() req: any,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: ApproveRulebookDto,
  ) {
    const actor = await this.actors.resolve(req.user);
    const version = await this.governance.activate(actor, versionId, dto.comment);
    this.repository.invalidateCache();
    return RulebookVersionView.from(version);
  }

  /** Step 21 section 79. Rollback to a previously approved version. */
  @Post(':versionId/rollback')
  @HttpCode(200)
  @ApiOperation({ summary: 'Roll back to this previously superseded version' })
  async rollback(
    @Req() req: any,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: RollbackRulebookDto,
  ) {
    const actor = await this.actors.resolve(req.user);
    const version = await this.governance.rollback(actor, versionId, dto.reason);
    this.repository.invalidateCache();
    return RulebookVersionView.from(version);
  }

  /** Step 10 sections 36-37: immutable governance audit history. */
  @Get(':versionId/audit')
  @ApiOperation({ summary: 'Governance audit trail for this version' })
  async audit(
    @Req() req: any,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    await this.actors.resolve(req.user);
    return this.dashboard.auditTrail(versionId);
  }

  /** Step 21 section 74: the full validation report. */
  @Get(':versionId/validation')
  @ApiOperation({ summary: 'Latest validation run with findings' })
  async validation(
    @Req() req: any,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    await this.actors.resolve(req.user);
    const run = await this.dashboard.latestValidationRun(versionId);
    if (!run) {
      throw new ZunoException(ZunoErrorCode.NOT_FOUND, {
        message: 'This version has not been validated yet.',
      });
    }
    return ValidationRunView.from(run);
  }
}
