import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the iBhakt modules that ZUNO replaces.
 *
 * Product decision, 2026-09-12: ZUNO supersedes iBhakt rather than running
 * alongside it, so the modules with no place in the ZUNO specification are
 * removed from both the codebase and the schema.
 *
 * What went, and why:
 *
 *   manifestation (15 tables)
 *     No ZUNO equivalent. ZUNO's behavioural layer is Mind-Karma-Action
 *     (Step 15), which is generated from a challenge and an approved rulebook
 *     rather than authored by the user as an affirmation.
 *
 *   karma (8 tables)
 *     Replaced, not deleted as a concept. ZUNO has a Karma Ledger (Step 17),
 *     but it is a different model - a private record of intentional actions
 *     with deterministic versioned scoring and a
 *     CONSTRUCTIVE/UNCONSTRUCTIVE/NEUTRAL/MIXED/UNCERTAIN taxonomy - and it
 *     arrives in Roadmap Phase 8 as `zuno_karma_*`. The iBhakt good/bad master
 *     tables and weight rules do not carry forward.
 *
 *   cms_pages, testimonials, contact_inquiries
 *     Not present anywhere in the ZUNO specification set.
 *
 * Also removed in the same change, with no schema impact because their entities
 * were never registered with TypeORM and their tables were therefore never
 * created: the `challenges` module (7/30/108-day devotional programmes -
 * unrelated to a ZUNO WhatNow, despite the name), the `journal` module, the
 * `twin` and `horoscope` modules, and 14 orphaned entity classes under
 * `src/database/entities`.
 *
 * Horoscope deserves its own note: Master Index section 2 lists "a horoscope
 * application" as something ZUNO is explicitly NOT. Login no longer attaches a
 * daily horoscope to the user response.
 *
 * SAFETY: verified before running that every table below was empty. This drops
 * data irreversibly and must not be run against a database holding live iBhakt
 * content without an export first - see `down()`.
 */
export class RemoveIbhaktLegacyModules1757900000000 implements MigrationInterface {
  name = 'RemoveIbhaktLegacyModules1757900000000';

  /** Child tables first, so foreign keys do not block the drop. */
  private readonly tables: readonly string[] = [
    // manifestation
    'manifestation_progress_entries',
    'manifestation_logs',
    'manifest_user_logs',
    'manifest_backend_cache',
    'manifest_summary_templates',
    'manifest_insight_templates',
    'manifest_alignment_templates',
    'manifest_not_to_manifest_templates',
    'manifest_to_manifest_templates',
    'manifest_ritual_templates',
    'manifest_energy_rules',
    'manifest_keywords',
    'manifest_subcategories',
    'manifest_categories',
    'manifestations',
    // karma (iBhakt model)
    'karma_score_summaries',
    'karma_patterns',
    'karma_habit_suggestions',
    'karma_weight_rules',
    'karma_entries',
    'karma_master_good',
    'karma_master_bad',
    'karma_categories',
    // content and support
    'cms_pages',
    'testimonials',
    'contact_inquiries',
    // never created (entities were unregistered), listed for completeness
    'challenges',
    'user_challenges',
    'journal_entries',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      const present = await queryRunner.query(
        `SELECT to_regclass($1) IS NOT NULL AS present`,
        [`public.${table}`],
      );
      if (!present?.[0]?.present) continue;

      // Refuse to silently destroy data. On a database where these modules were
      // in real use, this migration must be preceded by a deliberate export;
      // failing loudly is the right behaviour, not dropping anyway.
      const rows = await queryRunner.query(
        `SELECT count(*)::int AS n FROM "${table}"`,
      );
      const count = rows?.[0]?.n ?? 0;
      if (count > 0 && process.env.ZUNO_ALLOW_LEGACY_DATA_LOSS !== 'true') {
        throw new Error(
          `Refusing to drop "${table}": it contains ${count} row(s). ` +
            `Export the data first, then re-run with ZUNO_ALLOW_LEGACY_DATA_LOSS=true.`,
        );
      }

      await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
  }

  /**
   * No rollback.
   *
   * Recreating empty tables would be misleading - it would restore the shape of
   * the iBhakt modules without their data, code, controllers or services, none
   * of which exist any more. Step 20 section 97 asks that every migration
   * consider rollback; the considered answer here is that recovery means
   * restoring a database backup and reverting the code, not running a `down()`.
   */
  public async down(): Promise<void> {
    throw new Error(
      'RemoveIbhaktLegacyModules is not reversible. Restore from a backup taken ' +
        'before the migration, and revert the corresponding code removal.',
    );
  }
}
