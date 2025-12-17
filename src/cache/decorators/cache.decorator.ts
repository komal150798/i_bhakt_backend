import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

/**
 * Cache decorator for endpoints
 * @param key Cache key
 * @param ttl Time to live in seconds (default: 3600)
 */
export const Cache = (key: string, ttl: number = 3600) =>
  SetMetadata(CACHE_KEY_METADATA, key) && SetMetadata(CACHE_TTL_METADATA, ttl);







