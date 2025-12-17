import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import redisConfig from '../../config/redis.config';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule.forFeature(redisConfig)],
      useFactory: async (configService: ConfigService) => {
        const config = configService.get('redis');
        
        try {
          // Try to use Redis if available
          // Note: cache-manager-redis-store v2 uses different API
          return {
            store: redisStore,
            host: config.host,
            port: config.port,
            password: config.password,
            db: config.db,
            ttl: config.ttl,
            max: 100,
          };
        } catch (error) {
          // Fallback to in-memory cache if Redis is unavailable
          console.warn('Redis connection failed, falling back to in-memory cache:', error.message);
          return {
            ttl: config.ttl,
            max: 100,
          };
        }
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  exports: [NestCacheModule],
})
export class RedisModule {}

