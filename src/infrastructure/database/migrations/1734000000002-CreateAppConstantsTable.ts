import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create App Constants Table
 * 
 * Creates the app_constants table for storing all keywords, words, sentences, and constants
 * used across the application. This ensures NO hardcoded words in any API.
 */
export class CreateAppConstantsTable1734000000002 implements MigrationInterface {
  name = 'CreateAppConstantsTable1734000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS app_constants CASCADE;`);
  }
}

