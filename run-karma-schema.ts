/**
 * Run Karma Unified Schema SQL
 * 
 * Creates the unified karma schema tables (3 core tables replacing 24+ tables)
 * 
 * Usage: npm run karma:schema:create
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const logger = {
  log: (message: string) => console.log(`✅ ${message}`),
  error: (message: string) => console.error(`❌ ${message}`),
  warn: (message: string) => console.warn(`⚠️  ${message}`),
  info: (message: string) => console.log(`ℹ️  ${message}`),
};

async function runKarmaSchema() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'ib_db',
  });

  try {
    logger.info('🔌 Connecting to database...');
    await client.connect();
    logger.log('Connected to database!\n');

    const schemaFile = path.join(__dirname, 'src/karma/schema-redesign/karma-schema.sql');
    
    if (!fs.existsSync(schemaFile)) {
      throw new Error(`Schema file not found: ${schemaFile}`);
    }

    const schemaSQL = fs.readFileSync(schemaFile, 'utf8');
    logger.info(`📄 Reading schema file: ${schemaFile} (${schemaSQL.length} chars)\n`);
    logger.info('📊 Creating unified karma schema tables...\n');

    try {
      await client.query('BEGIN');
      await client.query(schemaSQL);
      await client.query('COMMIT');
      logger.log('✅ Schema creation completed successfully!\n');
    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.message.includes('already exists') || error.code === '42P07' || error.code === '42710') {
        logger.warn('⚠️  Some objects already exist (this is okay if running again)');
        logger.log('✅ Schema creation completed (some objects already existed)\n');
      } else {
        throw error;
      }
    }

    // Verify tables
    logger.info('🔍 Verifying tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('karma_manifest_master_data', 'user_life_actions', 'user_scores_cache')
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length === 3) {
      logger.log('✅ All tables created successfully:');
      tablesResult.rows.forEach((row: any) => {
        logger.log(`   - ${row.table_name}`);
      });
    } else {
      logger.warn(`⚠️  Only ${tablesResult.rows.length} of 3 tables found`);
    }

    logger.log('\n✅ Karma schema setup completed!');

  } catch (error: any) {
    logger.error(`Execution failed: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    logger.info('\n🔌 Database connection closed');
  }
}

// Run schema creation
runKarmaSchema()
  .then(() => {
    logger.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Script failed: ${error.message}`);
    process.exit(1);
  });











