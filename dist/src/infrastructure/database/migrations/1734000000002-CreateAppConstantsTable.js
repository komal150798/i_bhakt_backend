"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAppConstantsTable1734000000002 = void 0;
class CreateAppConstantsTable1734000000002 {
    constructor() {
        this.name = 'CreateAppConstantsTable1734000000002';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS app_constants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE UNIQUE INDEX IF NOT EXISTS idx_app_constants_key ON app_constants(key);
      CREATE INDEX IF NOT EXISTS idx_app_constants_category ON app_constants(category);
      CREATE INDEX IF NOT EXISTS idx_app_constants_is_active ON app_constants(is_active);
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS app_constants CASCADE;`);
    }
}
exports.CreateAppConstantsTable1734000000002 = CreateAppConstantsTable1734000000002;
//# sourceMappingURL=1734000000002-CreateAppConstantsTable.js.map