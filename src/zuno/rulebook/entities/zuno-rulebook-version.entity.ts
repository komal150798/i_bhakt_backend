import { Column, Entity, Index } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { RulebookReleaseType, RulebookStatus } from '../../common/enums';

/**
 * One uploaded version of the SME Astrology Rulebook.
 * Step 20 Data Model section 65, Step 10 sections 4 and 9.
 *
 * This is the table that makes Step 20 section 122's mandatory architectural
 * requirement real:
 *
 *   "The ZUNO Astrology SME Rulebook is a living, versioned knowledge asset and
 *    future approved versions can be uploaded by an authorized System Admin
 *    without requiring application code changes."
 *
 * Immutability: once a version reaches PRODUCTION its rules are frozen
 * (Step 20 section 68). A correction is a new version, never an edit - that is
 * what keeps a two-year-old response explainable.
 */
@Entity('zuno_rulebook_versions')
@Index('idx_zuno_rulebook_versions_version', ['version'], { unique: true })
@Index('idx_zuno_rulebook_versions_status', ['status'])
export class ZunoRulebookVersion extends ZunoBaseEntity {
  /**
   * Semantic version, e.g. 1.5.0. Step 10 section 4.
   *
   * Note this entity extends ZunoBaseEntity rather than ZunoVersionedEntity:
   * `version` here is the SME's rulebook version, not an optimistic-lock
   * counter, and the two must not share a column name. Concurrency on the
   * lifecycle is guarded by explicit status transitions and the partial unique
   * index on is_production instead.
   */
  @Column({ type: 'varchar', length: 32 })
  version: string;

  @Column({ type: 'varchar', length: 200, name: 'release_name' })
  release_name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 16, name: 'release_type' })
  release_type: RulebookReleaseType;

  @Column({ type: 'varchar', length: 40, default: RulebookStatus.UPLOADED })
  status: RulebookStatus;

  // --- Source file provenance (Step 10 sections 9-10) ---

  @Column({ type: 'varchar', length: 300, name: 'source_file_name' })
  source_file_name: string;

  /**
   * SHA-256 of the uploaded workbook. Step 20 section 56 requires integrity
   * checks; this also detects a duplicate upload of an identical file.
   */
  @Column({ type: 'varchar', length: 64, name: 'source_file_hash' })
  source_file_hash: string;

  @Column({ type: 'bigint', name: 'source_file_size' })
  source_file_size: string;

  /**
   * Where the original workbook is retained. Step 20 section 92 keeps large
   * artifacts in object storage with metadata and hashes in PostgreSQL.
   * Holds a filesystem path today; becomes an object-storage key later.
   */
  @Column({ type: 'text', name: 'source_file_location', nullable: true })
  source_file_location: string | null;

  // --- Governance trail (Step 10 sections 25-28) ---

  /** SME who authored the astrological content. */
  @Column({ type: 'varchar', length: 120, name: 'sme_reference', nullable: true })
  sme_reference: string | null;

  @Column({ type: 'text', name: 'change_summary', nullable: true })
  change_summary: string | null;

  @Column({ type: 'uuid', name: 'uploaded_by', nullable: true })
  uploaded_by: string | null;

  @Column({ type: 'timestamptz', name: 'uploaded_at' })
  uploaded_at: Date;

  @Column({ type: 'uuid', name: 'reviewed_by', nullable: true })
  reviewed_by: string | null;

  @Column({ type: 'timestamptz', name: 'reviewed_at', nullable: true })
  reviewed_at: Date | null;

  /**
   * Who gave *astrological* approval. Step 10 section 25 keeps this separate
   * from activation so one person cannot take a rulebook end to end.
   */
  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approved_by: string | null;

  @Column({ type: 'timestamptz', name: 'approved_at', nullable: true })
  approved_at: Date | null;

  /** Who pushed it to production - a different person from approved_by. */
  @Column({ type: 'uuid', name: 'activated_by', nullable: true })
  activated_by: string | null;

  @Column({ type: 'timestamptz', name: 'activated_at', nullable: true })
  activated_at: Date | null;

  @Column({ type: 'timestamptz', name: 'superseded_at', nullable: true })
  superseded_at: Date | null;

  @Column({ type: 'uuid', name: 'supersedes_version_id', nullable: true })
  supersedes_version_id: string | null;

  // --- Compiled content counts, for the dashboard (Step 10 section 7) ---

  @Column({ type: 'int', name: 'total_rules', default: 0 })
  total_rules: number;

  @Column({ type: 'int', name: 'total_interpretations', default: 0 })
  total_interpretations: number;

  @Column({ type: 'int', name: 'total_remedies', default: 0 })
  total_remedies: number;

  @Column({ type: 'int', name: 'total_timing_rules', default: 0 })
  total_timing_rules: number;

  @Column({ type: 'int', name: 'total_golden_cases', default: 0 })
  total_golden_cases: number;

  @Column({ type: 'jsonb', name: 'domains_covered', default: () => "'[]'::jsonb" })
  domains_covered: string[];

  /** Free-text reason captured on rejection or rollback (Step 10 section 28). */
  @Column({ type: 'text', name: 'status_reason', nullable: true })
  status_reason: string | null;

  /**
   * Set when this version is the single active production rulebook.
   *
   * Redundant with `status`, and deliberately so: it backs a partial unique
   * index that makes "only one PRODUCTION version" a database guarantee
   * (Step 10 section 27) rather than something the service layer must never
   * get wrong.
   */
  @Column({ type: 'boolean', name: 'is_production', default: false })
  is_production: boolean;
}
