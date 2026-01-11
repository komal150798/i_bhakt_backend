import { Cache } from 'cache-manager';
import { RedisConfigService } from './redis-config.service';
export declare class CacheService {
    private cacheManager;
    private redisConfig;
    constructor(cacheManager: Cache, redisConfig: RedisConfigService);
    get<T>(key: string): Promise<T | undefined>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    reset(): Promise<void>;
    private getKey;
    productKey(id: string): string;
    productListKey(filters: Record<string, any>): string;
    planKey(id: string): string;
    userSubscriptionKey(userId: number): string;
    cmsPageKey(slug: string): string;
    kundliKey(userId: number, kundliId: string): string;
}
