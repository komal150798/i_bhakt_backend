"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheModule = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const config_1 = require("@nestjs/config");
const redis_config_service_1 = require("./redis-config.service");
const cache_service_1 = require("./cache.service");
let CacheModule = class CacheModule {
};
exports.CacheModule = CacheModule;
exports.CacheModule = CacheModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            cache_manager_1.CacheModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => {
                    const redisConfig = configService.get('redis');
                    const useRedis = process.env.REDIS_HOST && process.env.REDIS_HOST !== '';
                    if (useRedis) {
                        try {
                            const redisStore = require('cache-manager-redis-store');
                            return {
                                store: redisStore,
                                host: redisConfig.host,
                                port: redisConfig.port,
                                password: redisConfig.password,
                                db: redisConfig.db,
                                ttl: redisConfig.ttl,
                            };
                        }
                        catch (error) {
                            console.warn('Redis connection failed, using memory cache:', error.message);
                            return {
                                ttl: redisConfig.ttl * 1000,
                            };
                        }
                    }
                    console.log('Using in-memory cache (Redis not configured)');
                    return {
                        ttl: redisConfig.ttl * 1000,
                    };
                },
                inject: [config_1.ConfigService],
                isGlobal: true,
            }),
        ],
        providers: [redis_config_service_1.RedisConfigService, cache_service_1.CacheService],
        exports: [cache_manager_1.CacheModule, cache_service_1.CacheService, redis_config_service_1.RedisConfigService],
    })
], CacheModule);
//# sourceMappingURL=cache.module.js.map