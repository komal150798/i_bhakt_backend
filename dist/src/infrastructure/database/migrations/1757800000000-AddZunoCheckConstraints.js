"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddZunoCheckConstraints1757800000000 = void 0;
class AddZunoCheckConstraints1757800000000 {
    constructor() {
        this.name = 'AddZunoCheckConstraints1757800000000';
    }
    async up(queryRunner) {
        await this.addCheck(queryRunner, 'zuno_birth_profiles', 'chk_zuno_birth_time_accuracy', `("time_accuracy" = 'UNKNOWN' AND "time_of_birth" IS NULL)
       OR ("time_accuracy" <> 'UNKNOWN' AND "time_of_birth" IS NOT NULL)`);
        await this.addCheck(queryRunner, 'zuno_rulebook_review_items', 'chk_zuno_review_distinct_reviewers', `"secondary_reviewer_id" IS NULL
       OR "reviewer_id" IS NULL
       OR "secondary_reviewer_id" <> "reviewer_id"`);
        await this.addCheck(queryRunner, 'zuno_challenge_links', 'chk_zuno_challenge_links_distinct', `"source_challenge_id" <> "target_challenge_id"`);
    }
    async down(queryRunner) {
        const constraints = [
            ['zuno_challenge_links', 'chk_zuno_challenge_links_distinct'],
            ['zuno_rulebook_review_items', 'chk_zuno_review_distinct_reviewers'],
            ['zuno_birth_profiles', 'chk_zuno_birth_time_accuracy'],
        ];
        for (const [table, name] of constraints) {
            await queryRunner.query(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${name}"`);
        }
    }
    async addCheck(queryRunner, table, constraintName, expression) {
        const tableExists = await queryRunner.query(`SELECT to_regclass($1) IS NOT NULL AS present`, [`public.${table}`]);
        if (!tableExists?.[0]?.present)
            return;
        const exists = await queryRunner.query(`SELECT 1 FROM pg_constraint WHERE conname = $1 AND conrelid = $2::regclass`, [constraintName, `public.${table}`]);
        if (exists?.length)
            return;
        await queryRunner.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${constraintName}" CHECK (${expression})`);
    }
}
exports.AddZunoCheckConstraints1757800000000 = AddZunoCheckConstraints1757800000000;
//# sourceMappingURL=1757800000000-AddZunoCheckConstraints.js.map