import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisConfigService } from './redis-config.service';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisConfig = configService.get('redis');
        
        // Try to use Redis if available, fallback to memory
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
              ttl: redisConfig.ttl, // In seconds for redis-store
            };
          } catch (error) {
            console.warn('Redis connection failed, using memory cache:', error.message);
            // Fallback to memory cache
            return {
              ttl: redisConfig.ttl * 1000, // In milliseconds for memory store
            };
          }
        }
        
        // Use memory cache by default
        console.log('Using in-memory cache (Redis not configured)');
        return {
          ttl: redisConfig.ttl * 1000, // In milliseconds for memory store
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  providers: [RedisConfigService, CacheService],
  exports: [NestCacheModule, CacheService, RedisConfigService], // Export RedisConfigService for use in other modules
})
export class CacheModule {}

