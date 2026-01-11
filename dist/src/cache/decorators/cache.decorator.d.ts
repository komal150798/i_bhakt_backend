export declare const CACHE_KEY_METADATA = "cache:key";
export declare const CACHE_TTL_METADATA = "cache:ttl";
export declare const Cache: (key: string, ttl?: number) => import("@nestjs/common").CustomDecorator<string>;
