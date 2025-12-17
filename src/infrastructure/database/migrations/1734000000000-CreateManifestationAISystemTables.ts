import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create Future-Proof Universal AI System Tables
 * 
 * Creates all tables for database-driven manifestation AI system:
 * - Categories and subcategories
 * - Keywords for detection
 * - Energy rules
 * - All template types (rituals, to_manifest, not_to_manifest, alignment, insights, summaries)
 * - Backend cache
 * - User logs
 */
export class CreateManifestationAISystemTables1734000000000
  implements MigrationInterface
{
  name = 'CreateManifestationAISystemTables1734000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. manifest_categories
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS manifest_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug TEXT UNIQUE NOT NULL,
        label TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_manifest_categories_slug ON manifest_categories(slug);
      CREATE INDEX IF NOT EXISTS idx_manifest_categories_is_active ON manifest_categories(is_active);
    `);

    // 2. manifest_subcategories
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS manifest_subcategories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        label TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_manifest_subcategories_category 
          FOREIGN KEY (category_id) 
          REFERENCES manifest_categories(id) 
          ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_manifest_subcategories_category_id ON manifest_subcategories(category_id);
      CREATE INDEX IF NOT EXISTS idx_manifest_subcategories_slug ON manifest_subcategories(slug);
      CREATE INDEX IF NOT EXISTS idx_manifest_subcategories_is_active ON manifest_subcategories(is_active);
    `);

    // 3. manifest_keywords
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS manifest_keywords (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        keyword TEXT NOT NULL,
        category_id UUID,
        subcategory_id UUID,
        weight INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_manifest_keywords_category 
          FOREIGN KEY (category_id) 
          REFERENCES manifest_categories(id) 
          ON DELETE CASCADE,
        CONSTRAINT fk_manifest_keywords_subcategory 
          FOREIGN KEY (subcategory_id) 
          REFERENCES manifest_subcategories(id) 
          ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_manifest_keywords_keyword ON manifest_keywords(keyword);
      CREATE INDEX IF NOT EXISTS idx_manifest_keywords_category_id ON manifest_keywords(category_id);
      CREATE INDEX IF NOT EXISTS idx_manifest_keywords_subcategory_id ON manifest_keywords(subcategory_id);
    `);

    // 4. manifest_energy_rules
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS manifest_energy_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        energy_state TEXT NOT NULL,
        pattern TEXT NOT NULL,
        weight INTEGER DEFAULT 1,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_manifest_energy_rules_energy_state ON manifest_energy_rules(energy_state);
    `);

    // 5. manifest_ritual_templates
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS manifest_ritual_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID,
        subcategory_id UUID,
        template_text TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_manifest_ritual_templates_category 
          FOREIGN KEY (category_id) 
          REFERENCES manifest_categories(id) 
          ON DELETE CASCADE,
        CONSTRAINT fk_manifest_ritual_templates_subcategory 
          FOREIGN KEY (subcategory_id) 
          REFERENCES manifest_subcategories(id) 
          ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_manifest_ritual_templates_category_id ON manifest_ritual_templates(category_id);
      CREATE INDEX IF NOT EXISTS idx_manifest_ritual_templates_subcategory_id ON manifest_ritual_templates(subcategory_id);
      CREATE INDEX IF NOT EXISTS idx_manifest_ritual_templates_is_active ON manifest_ritual_templates(is_active);
      CREATE INDEX IF NOT EXISTS idx_manifest_ritual_templates_priority ON manifest_ritual_templates(priority);
    `);

    // 6. manifest_to_manifest_templates
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS manifest_to_manifest_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID,
        subcategory_id UUID,
        template_text TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_manifest_to_manifest_templates_category 
          FOREIGN KEY (category_id) 
          REFERENCES manifest_categories(id) 
          ON DELETE CASCADE,
        CONSTRAINT fk_manifest_to_manifest_templates_subcategory 
          FOREIGN KEY (subcategory_id) 
          REFERENCES manifest_subcategories(id) 
          ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_manifest_to_manifest_templates_category_id ON manifest_to_manifest_templates(category_id);
      CREATE INDEX IF NOT EXISTS idx_manifest_to_manifest_templates_subcategory_id ON manifest_to_manifest_templates(subcategory_id);
      CREATE INDEX IF NOT EXISTS idx_manifest_to_manifest_templates_is_active ON manifest_to_manifest_templates(is_active);
      CREATE INDEX IF NOT EXISTS idx_manifest_to_manifest_templates_priority ON manifest_to_manifest_templates(priority);
    `);

    // 7. manifest_not_to_manifest_templates
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS manifest_not_to_manifest_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID,
        subcategory_id UUID,
        template_text TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_manifest_not_to_manifest_templates_category 
          FOREIGN KEY (category_id) 
          REFERENCES manifest_categories(id) 
          ON DELETE CASCADE,
        CONSTRAINT fk_manifest_not_to_manifest_templates_subcategory 
          FOREIGN KEY (subcategory_id) 
          REFERENCES manifest_subcategories(id) 
          ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_manifest_not_to_manifest_templates_category_id ON manifest_not_to_manifest_templates(category_id);
      CREATE INDEX IF NOT EXISTS idx_manifest_not_to_manifest_templates_subcategory_id ON manifest_not_to_manifest_templates(subcategory_id);
      CREATE INDEX IF NOT EXISTS idx_manifest_not_to_manifest_templates_is_active ON manifest_not_to_manifest_templates(is_active);
      CREATE INDEX IF NOT EXISTS idx_manifest_not_to_manifest_templates_priority ON manifest_not_to_manifest_templates(priority);
    `);

    // 8. manifest_alignment_templates
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS manifest_alignment_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID,
        subcategory_id UUID,
        template_text TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_manifest_alignment_templates_category 
          FOREIGN KEY (category_id) 
          REFERENCES manifest_categories(id) 
          ON DELETE CASCADE,
        CONSTRAINT fk_manifest_alignment_templates_subcategory 
          FOREIGN KEY (subcategory_id) 
          REFERENCES manifest_subcategories(id) 
          ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_manifest_alignment_templates_category_id ON manifest_alignment_templates(category_id);
      CREATE INDEX IF NOT EXISTS idx_manifest_alignment_templates_subcategory_id ON manifest_alignment_templates(subcategory_id);
      CREATE INDEX IF NOT EXISTS idx_manifest_alignment_templates_is_active ON manifest_alignment_templates(is_active);
      CREATE INDEX IF NOT EXISTS idx_manifest_alignment_templates_priority ON manifest_alignment_templates(priority);
    `);

    // 9. manifest_insight_templates
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS manifest_insight_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID,
        template_text TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_manifest_insight_templates_category 
          FOREIGN KEY (category_id) 
          REFERENCES manifest_categories(id) 
          ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_manifest_insight_templates_category_id ON manifest_insight_templates(category_id);
      CREATE INDEX IF NOT EXISTS idx_manifest_insight_templates_is_active ON manifest_insight_templates(is_active);
      CREATE INDEX IF NOT EXISTS idx_manifest_insight_templates_priority ON manifest_insight_templates(priority);
    `);

    // 10. manifest_summary_templates
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS manifest_summary_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID,
        template_text TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_manifest_summary_templates_category 
          FOREIGN KEY (category_id) 
          REFERENCES manifest_categories(id) 
          ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_manifest_summary_templates_category_id ON manifest_summary_templates(category_id);
      CREATE INDEX IF NOT EXISTS idx_manifest_summary_templates_is_active ON manifest_summary_templates(is_active);
      CREATE INDEX IF NOT EXISTS idx_manifest_summary_templates_priority ON manifest_summary_templates(priority);
    `);

    // 11. manifest_backend_cache
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS manifest_backend_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        config_json JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 12. manifest_user_logs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS manifest_user_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        manifestation_title TEXT NOT NULL,
        manifestation_text TEXT NOT NULL,
        detected_category TEXT NOT NULL,
        detected_subcategory TEXT,
        energy_state TEXT NOT NULL,
        ai_output_json JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_manifest_user_logs_user_id ON manifest_user_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_manifest_user_logs_detected_category ON manifest_user_logs(detected_category);
      CREATE INDEX IF NOT EXISTS idx_manifest_user_logs_created_at ON manifest_user_logs(created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting foreign key constraints)
    await queryRunner.query(`DROP TABLE IF EXISTS manifest_user_logs CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS manifest_backend_cache CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS manifest_summary_templates CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS manifest_insight_templates CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS manifest_alignment_templates CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS manifest_not_to_manifest_templates CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS manifest_to_manifest_templates CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS manifest_ritual_templates CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS manifest_energy_rules CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS manifest_keywords CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS manifest_subcategories CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS manifest_categories CASCADE;`);
  }
}
