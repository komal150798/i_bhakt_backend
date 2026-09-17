"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAiCostColumns1758000000000 = void 0;
class AddAiCostColumns1758000000000 {
    constructor() {
        this.name = 'AddAiCostColumns1758000000000';
    }
    async up(queryRunner) {
        const present = await queryRunner.query(`SELECT to_regclass('public.zuno_ai_generation_runs') IS NOT NULL AS present`);
        if (!present?.[0]?.present)
            return;
        await queryRunner.query(`
      ALTER TABLE zuno_ai_generation_runs
        ADD COLUMN IF NOT EXISTS cost_micro_usd  bigint,
        ADD COLUMN IF NOT EXISTS pricing_version varchar(32)
    `);
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
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_zuno_ai_runs_challenge_cost`);
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
exports.AddAiCostColumns1758000000000 = AddAiCostColumns1758000000000;
//# sourceMappingURL=1758000000000-AddAiCostColumns.js.map