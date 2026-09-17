import { Module, Logger } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createConnection } from 'net';
import * as redisStore from 'cache-manager-redis-store';
import redisConfig from '../../config/redis.config';

/**
 * Probes whether a TCP port is accepting connections.
 *
 * The previous implementation wrapped the store *configuration object* in a
 * try/catch and claimed that was a fallback. It never worked: building a plain
 * object cannot throw, and the actual connection happens later and
 * asynchronously, so an unavailable Redis crashed the whole application at
 * boot with ECONNREFUSED rather than degrading.
 *
 * Actually probing the socket is the only way to decide this before handing a
 * store to cache-manager.
 */
function canConnect(host: string, port: number, timeoutMs = 700): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    const done = (ok: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

/**
 * Cache layer.
 *
 * Redis is used when it is actually reachable, and an in-memory store
 * otherwise. Step 20 Data Model section 91 treats Redis as secondary
 * infrastructure and never the source of truth, so running without it is a
 * legitimate degraded mode rather than a failure - which is exactly what
 * Step 21 section 99 means by graceful degradation.
 *
 * The in-memory store is per-process and does not survive a restart. That is
 * fine for local development; a multi-instance deployment should run Redis so
 * cache invalidation reaches every instance.
 */
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule.forFeature(redisConfig)],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('CacheModule');
        const config = configService.get('redis');

        const disabled = process.env.REDIS_DISABLED === 'true';
        const reachable = disabled
          ? false
          : await canConnect(config.host, config.port);

        if (!reachable) {
          logger.warn(
            disabled
              ? 'REDIS_DISABLED=true - using in-memory cache.'
              : `Redis unreachable at ${config.host}:${config.port} - using in-memory cache.`,
          );
          logger.warn(
            'Cache is per-process and will not survive a restart. Fine locally; run Redis for multi-instance deployments.',
          );
          return { ttl: config.ttl, max: 500 };
        }

        logger.log(`Redis connected at ${config.host}:${config.port}`);
        return {
          store: redisStore,
          host: config.host,
          port: config.port,
          password: config.password,
          db: config.db,
          ttl: config.ttl,
          max: 100,
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  exports: [NestCacheModule],
})
export class RedisModule {}
