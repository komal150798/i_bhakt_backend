"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const redis_config_service_1 = require("./redis-config.service");
let CacheService = class CacheService {
    constructor(cacheManager, redisConfig) {
        this.cacheManager = cacheManager;
        this.redisConfig = redisConfig;
    }
    async get(key) {
        const fullKey = this.getKey(key);
        return this.cacheManager.get(fullKey);
    }
    async set(key, value, ttl) {
        const fullKey = this.getKey(key);
        const cacheTtl = ttl || this.redisConfig.ttl;
        await this.cacheManager.set(fullKey, value, cacheTtl * 1000);
    }
    async del(key) {
        const fullKey = this.getKey(key);
        await this.cacheManager.del(fullKey);
    }
    async reset() {
        await this.cacheManager.reset();
    }
    getKey(key) {
        return `${this.redisConfig.keyPrefix}${key}`;
    }
    productKey(id) {
        return `product:${id}`;
    }
    productListKey(filters) {
        const filterStr = JSON.stringify(filters);
        return `products:list:${Buffer.from(filterStr).toString('base64')}`;
    }
    planKey(id) {
        return `plan:${id}`;
    }
    userSubscriptionKey(userId) {
        return `user:${userId}:subscription`;
    }
    cmsPageKey(slug) {
        return `cms:page:${slug}`;
    }
    kundliKey(userId, kundliId) {
        return `kundli:${userId}:${kundliId}`;
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, redis_config_service_1.RedisConfigService])
], CacheService);
//# sourceMappingURL=cache.service.js.map