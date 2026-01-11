"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisModule = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const config_1 = require("@nestjs/config");
const redisStore = require("cache-manager-redis-store");
const redis_config_1 = require("../../config/redis.config");
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cache_manager_1.CacheModule.registerAsync({
                imports: [config_1.ConfigModule.forFeature(redis_config_1.default)],
                useFactory: async (configService) => {
                    const config = configService.get('redis');
                    try {
                        return {
                            store: redisStore,
                            host: config.host,
                            port: config.port,
                            password: config.password,
                            db: config.db,
                            ttl: config.ttl,
                            max: 100,
                        };
                    }
                    catch (error) {
                        console.warn('Redis connection failed, falling back to in-memory cache:', error.message);
                        return {
                            ttl: config.ttl,
                            max: 100,
                        };
                    }
                },
                inject: [config_1.ConfigService],
                isGlobal: true,
            }),
        ],
        exports: [cache_manager_1.CacheModule],
    })
], RedisModule);
//# sourceMappingURL=redis.module.js.map