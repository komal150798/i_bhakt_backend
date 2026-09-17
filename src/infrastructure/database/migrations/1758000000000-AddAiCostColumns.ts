import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds cost attribution to AI provenance rows.
 *
 * Build Rule 91 asks for usage and cost telemetry. Token counts were already
 * recorded; this turns them into money so that cost-per-WhatNow - the figure
 * that decides whether the product can be priced profitably - can be measured
 * rather than estimated.
 *
 *   cost_micro_usd   integer micro-USD (1e-6 USD), NULL when not determinable
 *   pricing_version  which price list produced the figure, or 'UNPRICED'
 *
 * Two design points are load-bearing:
 *
 * BIGINT, NOT NUMERIC OR DOUBLE. These rows are summed across every model call
 * the platform has ever made. Floating point accumulates error over large sums,
 * and `numeric` would cost more per row than an integer count of a unit small
 * enough that rounding is irrelevant (one micro-USD is one ten-thousandth of a
 * cent).
 *
 * NULLABLE, AND NULL MEANS "UNKNOWN" - NEVER "FREE". A model with no configured
 * price records NULL and is excluded from totals, with the exclusion reported
 * alongside every aggregate. A default of 0 would have made an unpriced model
 * look free, which is the failure mode most likely to go unnoticed precisely
 * when a new model is rolled out.
 *
 * Existing rows keep NULL: their cost is genuinely unknown, because the token
 * counts were captured under a price list that was never recorded. Back-filling
 * them from today's prices would invent history.
 */
export class AddAiCostColumns1758000000000 implements MigrationInterface {
  name = 'AddAiCostColumns1758000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const present = await queryRunner.query(
      `SELECT to_regclass('public.zuno_ai_generation_runs') IS NOT NULL AS present`,
    );
    if (!present?.[0]?.present) return;

    await queryRunner.query(`
      ALTER TABLE zuno_ai_generation_runs
        ADD COLUMN IF NOT EXISTS cost_micro_usd  bigint,
        ADD COLUMN IF NOT EXISTS pricing_version varchar(32)
    `);

    // Money is never negative. Cheap to enforce, and it catches a sign error in
    // a future pricing change at write time rather than in a quarterly report.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_zuno_ai_runs_cost_non_negative'
        ) THEN
          ALTER TABLE zuno_ai_generation_runs
            ADD CONSTRAINT chk_zuno_ai_runs_cost_non_negative
            CHECK (cost_micro_usd IS NULL OR cost_micro_usd >= 0);
        END IF;
      END $$;
    `);

    // Every cost query filters by created_at and groups by challenge_id or
    // operation_type. The partial index keeps the common "priced runs only"
    // scan off the unpriced rows.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_zuno_ai_runs_cost_window
        ON zuno_ai_generation_runs (created_at)
        INCLUDE (cost_micro_usd)
        WHERE cost_micro_usd IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_zuno_ai_runs_challenge_cost
        ON zuno_ai_generation_runs (challenge_id, created_at)
        WHERE challenge_id IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_zuno_ai_runs_challenge_cost`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_zuno_ai_runs_cost_window`);
    await queryRunner.query(`
      ALTER TABLE zuno_ai_generation_runs
        DROP CONSTRAINT IF EXISTS chk_zuno_ai_runs_cost_non_negative
    `);
    await queryRunner.query(`
      ALTER TABLE zuno_ai_generation_runs
        DROP COLUMN IF EXISTS pricing_version,
        DROP COLUMN IF EXISTS cost_micro_usd
    `);
  }
}
