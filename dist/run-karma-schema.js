"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs = require("fs");
const path = require("path");
const logger = {
    log: (message) => console.log(`✅ ${message}`),
    error: (message) => console.error(`❌ ${message}`),
    warn: (message) => console.warn(`⚠️  ${message}`),
    info: (message) => console.log(`ℹ️  ${message}`),
};
async function runKarmaSchema() {
    const client = new pg_1.Client({
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
        }
        catch (error) {
            await client.query('ROLLBACK');
            if (error.message.includes('already exists') || error.code === '42P07' || error.code === '42710') {
                logger.warn('⚠️  Some objects already exist (this is okay if running again)');
                logger.log('✅ Schema creation completed (some objects already existed)\n');
            }
            else {
                throw error;
            }
        }
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
            tablesResult.rows.forEach((row) => {
                logger.log(`   - ${row.table_name}`);
            });
        }
        else {
            logger.warn(`⚠️  Only ${tablesResult.rows.length} of 3 tables found`);
        }
        logger.log('\n✅ Karma schema setup completed!');
    }
    catch (error) {
        logger.error(`Execution failed: ${error.message}`);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
    finally {
        await client.end();
        logger.info('\n🔌 Database connection closed');
    }
}
runKarmaSchema()
    .then(() => {
    logger.log('✅ Script completed');
    process.exit(0);
})
    .catch((error) => {
    logger.error(`Script failed: ${error.message}`);
    process.exit(1);
});
//# sourceMappingURL=run-karma-schema.js.map