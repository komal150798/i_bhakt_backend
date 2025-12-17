import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RedisConfigService } from './redis-config.service';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private redisConfig: RedisConfigService,
  ) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    const fullKey = this.getKey(key);
    return this.cacheManager.get<T>(fullKey);
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const fullKey = this.getKey(key);
    const cacheTtl = ttl || this.redisConfig.ttl;
    await this.cacheManager.set(fullKey, value, cacheTtl * 1000); // Convert to milliseconds
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    const fullKey = this.getKey(key);
    await this.cacheManager.del(fullKey);
  }

  /**
   * Reset entire cache
   */
  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  /**
   * Get cache key with prefix
   */
  private getKey(key: string): string {
    return `${this.redisConfig.keyPrefix}${key}`;
  }

  /**
   * Generate cache key for products
   */
  productKey(id: string): string {
    return `product:${id}`;
  }

  /**
   * Generate cache key for product list
   */
  productListKey(filters: Record<string, any>): string {
    const filterStr = JSON.stringify(filters);
    return `products:list:${Buffer.from(filterStr).toString('base64')}`;
  }

  /**
   * Generate cache key for plans
   */
  planKey(id: string): string {
    return `plan:${id}`;
  }

  /**
   * Generate cache key for user subscription
   */
  userSubscriptionKey(userId: number): string {
    return `user:${userId}:subscription`;
  }

  /**
   * Generate cache key for CMS pages
   */
  cmsPageKey(slug: string): string {
    return `cms:page:${slug}`;
  }

  /**
   * Generate cache key for kundli
   */
  kundliKey(userId: number, kundliId: string): string {
    return `kundli:${userId}:${kundliId}`;
  }
}







