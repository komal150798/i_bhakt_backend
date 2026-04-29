"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateManifestationProgressEntriesTable1734000000003 = void 0;
class CreateManifestationProgressEntriesTable1734000000003 {
    constructor() {
        this.name = 'CreateManifestationProgressEntriesTable1734000000003';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS manifestation_progress_entries (
        id BIGSERIAL PRIMARY KEY,
        unique_id UUID NOT NULL DEFAULT gen_random_uuid(),
        added_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        modify_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        added_by BIGINT NULL,
        modify_by BIGINT NULL,
        manifestation_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        entry_date DATE NOT NULL,
        action_text TEXT NOT NULL,
        CONSTRAINT uq_manifestation_progress_entries_unique_id UNIQUE (unique_id),
        CONSTRAINT fk_manifestation_progress_entries_manifestation
          FOREIGN KEY (manifestation_id)
          REFERENCES manifestations(id)
          ON DELETE CASCADE
      );
    `);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_manifestation_progress_entries_single_entry
      ON manifestation_progress_entries (manifestation_id, entry_date, is_deleted);
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_manifestation_progress_entries_manifestation_deleted
      ON manifestation_progress_entries (manifestation_id, is_deleted);
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_manifestation_progress_entries_user_deleted
      ON manifestation_progress_entries (user_id, is_deleted);
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS manifestation_progress_entries CASCADE;`);
    }
}
exports.CreateManifestationProgressEntriesTable1734000000003 = CreateManifestationProgressEntriesTable1734000000003;
//# sourceMappingURL=1734000000003-CreateManifestationProgressEntriesTable.js.map