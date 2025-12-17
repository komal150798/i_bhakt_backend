import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create AI Prompts Table
 * 
 * Creates the ai_prompts table for centralized prompt management.
 * All AI prompts (ChatGPT, Gemini, Claude, etc.) will be stored here.
 */
export class CreateAIPromptsTable1734000000001 implements MigrationInterface {
  name = 'CreateAIPromptsTable1734000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ai_prompts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT UNIQUE NOT NULL,
        scope TEXT NOT NULL,
        model_hint TEXT,
        type TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'en',
        template TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        version INTEGER NOT NULL DEFAULT 1,
        updated_by UUID,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_prompts_key ON ai_prompts(key);
      CREATE INDEX IF NOT EXISTS idx_ai_prompts_scope ON ai_prompts(scope);
      CREATE INDEX IF NOT EXISTS idx_ai_prompts_type ON ai_prompts(type);
      CREATE INDEX IF NOT EXISTS idx_ai_prompts_is_active ON ai_prompts(is_active);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ai_prompts CASCADE;`);
  }
}
