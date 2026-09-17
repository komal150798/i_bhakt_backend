"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlignZunoJsonbDefaults1757800000001 = void 0;
class AlignZunoJsonbDefaults1757800000001 {
    constructor() {
        this.name = 'AlignZunoJsonbDefaults1757800000001';
        this.columns = {
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
    }
    async up(queryRunner) {
        for (const [table, columns] of Object.entries(this.columns)) {
            const present = await queryRunner.query(`SELECT to_regclass($1) IS NOT NULL AS present`, [`public.${table}`]);
            if (!present?.[0]?.present)
                continue;
            for (const column of columns) {
                const exists = await queryRunner.query(`SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`, [table, column]);
                if (!exists?.length)
                    continue;
                await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '[]'::jsonb`);
            }
        }
    }
    async down(queryRunner) {
        for (const [table, columns] of Object.entries(this.columns)) {
            for (const column of columns) {
                await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT`);
            }
        }
    }
}
exports.AlignZunoJsonbDefaults1757800000001 = AlignZunoJsonbDefaults1757800000001;
//# sourceMappingURL=1757800000001-AlignZunoJsonbDefaults.js.map