"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = require("dotenv");
const typeorm_1 = require("typeorm");
const zuno_entities_1 = require("./src/zuno/zuno-entities");
(0, dotenv_1.config)();
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DB_USER || process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DB_NAME || process.env.DATABASE_NAME || 'ib_db',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    synchronize: false,
    logging: ['error', 'migration', 'schema'],
    entities: zuno_entities_1.ZUNO_ENTITIES,
    migrations: ['src/infrastructure/database/migrations/*.ts'],
    migrationsTableName: 'migrations_history',
});
//# sourceMappingURL=ormconfig.js.map