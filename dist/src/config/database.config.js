"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('database', () => {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const synchronizeEnabled = isDevelopment || process.env.DB_SYNCHRONIZE === 'true';
    if (isDevelopment) {
        console.log('📊 Database Configuration:');
        console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
        console.log(`   Port: ${process.env.DB_PORT || '5432'}`);
        console.log(`   Database: ${process.env.DB_NAME || 'ib_db'}`);
        console.log(`   Synchronize: ${synchronizeEnabled} (NODE_ENV: ${process.env.NODE_ENV || 'not set'})`);
    }
    return {
        type: 'postgres',
        host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DB_USER || process.env.DATABASE_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DB_NAME || process.env.DATABASE_NAME || 'ib_db',
        synchronize: synchronizeEnabled,
        logging: isDevelopment,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        extra: {
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        },
    };
});
//# sourceMappingURL=database.config.js.map