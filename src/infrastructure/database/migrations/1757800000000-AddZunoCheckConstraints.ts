import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the ZUNO CHECK constraints as standalone ALTER TABLE statements.
 *
 * WHY THIS MIGRATION EXISTS
 *
 * The two preceding ZUNO migrations declare their CHECK constraints inline
 * inside `CREATE TABLE IF NOT EXISTS`. That is correct on a truly empty
 * database, but this project's schema has historically been created by TypeORM
 * `synchronize`, and TypeORM does not emit CHECK constraints for these
 * entities. So on any database where synchronize ran first, the CREATE TABLE
 * was a no-op and the constraints were silently skipped - verified on ib_db,
 * which had 28 ZUNO tables, 78 indexes and zero CHECK constraints.
 *
 * Indexes were unaffected, because `CREATE INDEX IF NOT EXISTS` runs as its own
 * statement rather than as part of the table definition. Only inline table
 * constraints were lost.
 *
 * These three constraints are not cosmetic. Each enforces a rule the
 * specification treats as non-negotiable, and each is the last line of defence
 * if a service-layer check is ever bypassed or refactored away.
 */
export class AddZunoCheckConstraints1757800000000 implements MigrationInterface {
  name = 'AddZunoCheckConstraints1757800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * Build Rule 53: preserve uncertainty about birth time.
     *
     * An UNKNOWN accuracy must not carry a time, and a claimed precision
     * (EXACT / APPROXIMATE / RECTIFIED) must have one. Without this, a row
     * could assert EXACT precision with a NULL time, and the astrology engine
     * would be free to substitute midnight - a fabricated value flowing
     * straight into chart calculation.
     */
    await this.addCheck(
      queryRunner,
      'zuno_birth_profiles',
      'chk_zuno_birth_time_accuracy',
      `("time_accuracy" = 'UNKNOWN' AND "time_of_birth" IS NULL)
       OR ("time_accuracy" <> 'UNKNOWN' AND "time_of_birth" IS NOT NULL)`,
    );

    /**
     * Step 08 section 62: two-person review means two different people.
     *
     * High-impact rules - health, legal, marriage, financial distress - require
     * a second reviewer. A row where both reviewer columns hold the same person
     * would satisfy every count-based check while providing no second opinion
     * at all.
     */
    await this.addCheck(
      queryRunner,
      'zuno_rulebook_review_items',
      'chk_zuno_review_distinct_reviewers',
      `"secondary_reviewer_id" IS NULL
       OR "reviewer_id" IS NULL
       OR "secondary_reviewer_id" <> "reviewer_id"`,
    );

    /**
     * Step 20 section 119: a challenge link connects two distinct challenges.
     * A self-link would create a cycle in the WhatNow graph that Future Self
     * and Realignment traversal have no reason to expect.
     */
    await this.addCheck(
      queryRunner,
      'zuno_challenge_links',
      'chk_zuno_challenge_links_distinct',
      `"source_challenge_id" <> "target_challenge_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const constraints: [string, string][] = [
      ['zuno_challenge_links', 'chk_zuno_challenge_links_distinct'],
      ['zuno_rulebook_review_items', 'chk_zuno_review_distinct_reviewers'],
      ['zuno_birth_profiles', 'chk_zuno_birth_time_accuracy'],
    ];
    for (const [table, name] of constraints) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${name}"`,
      );
    }
  }

  /**
   * Adds a CHECK constraint only if it is absent.
   *
   * PostgreSQL has no `ADD CONSTRAINT IF NOT EXISTS`, so existence is checked
   * against pg_constraint first. This keeps the migration idempotent and safe
   * to run against a database where the earlier migrations did apply their
   * inline constraints.
   *
   * The table-existence guard matters too: this migration must not fail on a
   * database where a ZUNO table is somehow absent, since that would block every
   * later migration.
   */
  private async addCheck(
    queryRunner: QueryRunner,
    table: string,
    constraintName: string,
    expression: string,
  ): Promise<void> {
    const tableExists = await queryRunner.query(
      `SELECT to_regclass($1) IS NOT NULL AS present`,
      [`public.${table}`],
    );
    if (!tableExists?.[0]?.present) return;

    const exists = await queryRunner.query(
      `SELECT 1 FROM pg_constraint WHERE conname = $1 AND conrelid = $2::regclass`,
      [constraintName, `public.${table}`],
    );
    if (exists?.length) return;

    await queryRunner.query(
      `ALTER TABLE "${table}" ADD CONSTRAINT "${constraintName}" CHECK (${expression})`,
    );
  }
}
