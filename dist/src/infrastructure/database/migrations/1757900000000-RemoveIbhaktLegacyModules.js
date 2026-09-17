"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveIbhaktLegacyModules1757900000000 = void 0;
class RemoveIbhaktLegacyModules1757900000000 {
    constructor() {
        this.name = 'RemoveIbhaktLegacyModules1757900000000';
        this.tables = [
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
            'karma_score_summaries',
            'karma_patterns',
            'karma_habit_suggestions',
            'karma_weight_rules',
            'karma_entries',
            'karma_master_good',
            'karma_master_bad',
            'karma_categories',
            'cms_pages',
            'testimonials',
            'contact_inquiries',
            'challenges',
            'user_challenges',
            'journal_entries',
        ];
    }
    async up(queryRunner) {
        for (const table of this.tables) {
            const present = await queryRunner.query(`SELECT to_regclass($1) IS NOT NULL AS present`, [`public.${table}`]);
            if (!present?.[0]?.present)
                continue;
            const rows = await queryRunner.query(`SELECT count(*)::int AS n FROM "${table}"`);
            const count = rows?.[0]?.n ?? 0;
            if (count > 0 && process.env.ZUNO_ALLOW_LEGACY_DATA_LOSS !== 'true') {
                throw new Error(`Refusing to drop "${table}": it contains ${count} row(s). ` +
                    `Export the data first, then re-run with ZUNO_ALLOW_LEGACY_DATA_LOSS=true.`);
            }
            await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        }
    }
    async down() {
        throw new Error('RemoveIbhaktLegacyModules is not reversible. Restore from a backup taken ' +
            'before the migration, and revert the corresponding code removal.');
    }
}
exports.RemoveIbhaktLegacyModules1757900000000 = RemoveIbhaktLegacyModules1757900000000;
//# sourceMappingURL=1757900000000-RemoveIbhaktLegacyModules.js.map