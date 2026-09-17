import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns eight NOT NULL JSONB columns with the defaults their migrations declare.
 *
 * Same root cause as the CHECK constraint migration: these tables were created
 * by TypeORM `synchronize` before the migrations ran, and the entity definitions
 * did not declare a default, so `CREATE TABLE IF NOT EXISTS` was a no-op and the
 * defaults were never applied.
 *
 * Detected by comparing the DEFAULT clauses in the ZUNO migrations against
 * `information_schema.columns`: 119 columns declare a default, 8 were missing it.
 *
 * Nothing was broken by this - every one of these columns is always populated
 * explicitly by the service that writes it. The value of fixing it is that
 * entity, migration and database now agree, so the next person to read any one
 * of the three is not misled, and a future `synchronize` produces no spurious
 * diff. The entity definitions were updated in the same change.
 */
export class AlignZunoJsonbDefaults1757800000001 implements MigrationInterface {
  name = 'AlignZunoJsonbDefaults1757800000001';

  /** table -> columns that should default to an empty JSON array. */
  private readonly columns: Readonly<Record<string, readonly string[]>> = {
    zuno_safety_decisions: [
      'domains',
      'flags',
      'actions',
      'blocked_capabilities',
      'matched_rule_ids',
    ],
    zuno_safety_incidents: ['violations'],
    zuno_rulebook_rules: ['conditions'],
    zuno_rulebook_timing_rules: ['conditions'],
  };

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [table, columns] of Object.entries(this.columns)) {
      const present = await queryRunner.query(
        `SELECT to_regclass($1) IS NOT NULL AS present`,
        [`public.${table}`],
      );
      if (!present?.[0]?.present) continue;

      for (const column of columns) {
        // Guard on the column existing so the migration cannot fail and block
        // everything after it on a database in an unexpected shape.
        const exists = await queryRunner.query(
          `SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
          [table, column],
        );
        if (!exists?.length) continue;

        await queryRunner.query(
          `ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '[]'::jsonb`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, columns] of Object.entries(this.columns)) {
      for (const column of columns) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT`,
        );
      }
    }
  }
}
