import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { ZUNO_ENTITIES } from './src/zuno/zuno-entities';

loadEnv();

/**
 * TypeORM CLI DataSource.
 *
 * Every migration script in package.json already points at this file
 * (`typeorm-ts-node-commonjs -d ormconfig.ts`), but the file itself did not
 * exist, so `npm run migration:run` and `migration:generate` could never have
 * worked. That is a large part of why the schema has been maintained by
 * `synchronize` instead of by migrations.
 *
 * Required by ZUNO Data Model (Step 20) section 96 and Build Rule 25: schema
 * changes go through version-controlled migrations.
 *
 * `synchronize` is hard-coded false here and must stay false: this DataSource
 * exists to run migrations, and a CLI session that silently reshaped the schema
 * by reflection would defeat the point.
 *
 * Entities are listed so `migration:generate` can diff the model against the
 * database. Only the ZUNO entities are registered: generating a diff against
 * the 81 legacy entities would produce an enormous migration reconciling years
 * of accumulated synchronize drift, which is a separate, deliberate exercise
 * and not something to trigger by accident.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DB_USER || process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DB_NAME || process.env.DATABASE_NAME || 'ib_db',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: ['error', 'migration', 'schema'],
  entities: ZUNO_ENTITIES,
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  migrationsTableName: 'migrations_history',
});
