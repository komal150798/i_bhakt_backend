import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  RuleReviewStatus,
  RulebookReleaseType,
  RulebookStatus,
} from '../../common/enums';
import { ZunoRulebookVersion } from '../entities/zuno-rulebook-version.entity';
import { ZunoRulebookValidationRun } from '../entities/zuno-rulebook-governance.entity';

/** Step 21 section 72 / Step 10 sections 8-9: upload metadata. */
export class UploadRulebookDto {
  @ApiProperty({ example: '1.0.0', description: 'Semantic version. Must be unique.' })
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, { message: 'version must be semantic, e.g. 1.0.0' })
  version: string;

  @ApiProperty({ example: 'Career domain baseline' })
  @IsString()
  @Length(1, 200)
  releaseName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @ApiProperty({
    enum: RulebookReleaseType,
    description:
      'PATCH for wording only. MINOR for new rules or remedies. MAJOR for methodology or schema change.',
  })
  @IsEnum(RulebookReleaseType)
  releaseType: RulebookReleaseType;

  @ApiPropertyOptional({ description: 'Who authored the astrological content.' })
  @IsOptional()
  @IsString()
  @Length(0, 120)
  smeReference?: string;

  @ApiPropertyOptional({ description: 'What changed since the previous version.' })
  @IsOptional()
  @IsString()
  @Length(0, 4000)
  changeSummary?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The .xlsx workbook. Macro-enabled files are rejected.',
  })
  file?: unknown;
}

export class ReviewRuleDto {
  @ApiProperty({ enum: RuleReviewStatus })
  @IsEnum(RuleReviewStatus)
  status: RuleReviewStatus;

  @ApiPropertyOptional({ description: 'Internal SME note. Never shown to users.' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  comment?: string;

  /**
   * Step 08 section 62: high-impact rules need a second reviewer, and it must
   * be a different person. The service enforces that.
   */
  @ApiPropertyOptional({
    description: 'Set when recording the second of two required reviews.',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isSecondaryReview?: boolean;
}

export class ApproveRulebookDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  comment?: string;
}

export class RejectRulebookDto {
  @ApiProperty({ description: 'Required. Recorded in the audit trail.' })
  @IsString()
  @Length(1, 2000)
  reason: string;
}

export class RollbackRulebookDto {
  @ApiProperty({
    description: 'Required. Step 10 section 28: a rollback must state why.',
  })
  @IsString()
  @Length(1, 2000)
  reason: string;
}

/** Step 10 sections 21-22: the Golden Case regression outcome. */
export class RecordRegressionDto {
  @ApiProperty()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  passed: boolean;

  @ApiProperty() @Type(() => Number) @IsInt() @Min(0) totalCases: number;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(0) unchanged: number;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(0) improvements: number;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(0) needsReview: number;

  @ApiProperty({
    description:
      'Any value above zero blocks activation (Step 10 section 22).',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  criticalRegressions: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 4000)
  notes?: string;
}

/**
 * Rulebook version view model.
 *
 * Step 21 Anti-Pattern 137 forbids returning database rows directly. The
 * source file location is deliberately withheld - it is infrastructure detail
 * (Step 21 section 110) and of no use to a client.
 */
export class RulebookVersionView {
  @ApiProperty() id: string;
  @ApiProperty() version: string;
  @ApiProperty() releaseName: string;
  @ApiProperty({ enum: RulebookStatus }) status: RulebookStatus;
  @ApiProperty({ enum: RulebookReleaseType }) releaseType: RulebookReleaseType;
  @ApiProperty() isProduction: boolean;
  @ApiProperty({ nullable: true }) description: string | null;
  @ApiProperty({ nullable: true }) smeReference: string | null;
  @ApiProperty({ nullable: true }) changeSummary: string | null;
  @ApiProperty() fileName: string;
  @ApiProperty({ description: 'SHA-256 of the uploaded workbook.' }) fileHash: string;
  @ApiProperty() totals: {
    rules: number;
    interpretations: number;
    remedies: number;
    timingRules: number;
    goldenCases: number;
  };
  @ApiProperty({ type: [String] }) domainsCovered: string[];
  @ApiProperty({ nullable: true }) statusReason: string | null;
  @ApiProperty() uploadedAt: string;
  @ApiProperty({ nullable: true }) approvedAt: string | null;
  @ApiProperty({ nullable: true }) activatedAt: string | null;
  @ApiProperty({ nullable: true }) supersededAt: string | null;

  static from(version: ZunoRulebookVersion): RulebookVersionView {
    return {
      id: version.id,
      version: version.version,
      releaseName: version.release_name,
      status: version.status,
      releaseType: version.release_type,
      isProduction: version.is_production,
      description: version.description,
      smeReference: version.sme_reference,
      changeSummary: version.change_summary,
      fileName: version.source_file_name,
      fileHash: version.source_file_hash,
      totals: {
        rules: version.total_rules,
        interpretations: version.total_interpretations,
        remedies: version.total_remedies,
        timingRules: version.total_timing_rules,
        goldenCases: version.total_golden_cases,
      },
      domainsCovered: version.domains_covered ?? [],
      statusReason: version.status_reason,
      uploadedAt: version.uploaded_at?.toISOString(),
      approvedAt: version.approved_at?.toISOString() ?? null,
      activatedAt: version.activated_at?.toISOString() ?? null,
      supersededAt: version.superseded_at?.toISOString() ?? null,
    };
  }
}

/**
 * Validation report.
 *
 * Findings are returned in full because they are precisely what makes a failed
 * upload actionable - each carries its sheet, row and column so the SME can go
 * straight to the cell.
 */
export class ValidationRunView {
  @ApiProperty() id: string;
  @ApiProperty() status: string;
  @ApiProperty() validatorVersion: string;
  @ApiProperty() totals: {
    rules: number;
    validRules: number;
    invalidRules: number;
    errors: number;
    warnings: number;
  };
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  findings: unknown[];
  @ApiProperty() startedAt: string;
  @ApiProperty({ nullable: true }) completedAt: string | null;

  static from(run: ZunoRulebookValidationRun): ValidationRunView {
    return {
      id: run.id,
      status: run.status,
      validatorVersion: run.validator_version,
      totals: {
        rules: run.total_rules,
        validRules: run.valid_rules,
        invalidRules: run.invalid_rules,
        errors: run.error_count,
        warnings: run.warning_count,
      },
      findings: run.findings ?? [],
      startedAt: run.started_at?.toISOString(),
      completedAt: run.completed_at?.toISOString() ?? null,
    };
  }
}
