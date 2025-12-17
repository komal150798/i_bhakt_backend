import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache.service';
import { Reflector } from '@nestjs/core';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '../decorators/cache.decorator';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Get cache key and TTL from decorator
    const cacheKey = this.reflector.get<string>(CACHE_KEY_METADATA, context.getHandler());
    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler());

    if (!cacheKey) {
      return next.handle(); // No cache decorator, skip caching
    }

    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return of(cached); // Return cached response
    }

    // If not cached, proceed and cache the response
    return next.handle().pipe(
      tap((response) => {
        // Only cache successful responses
        if (response && response.success !== false) {
          this.cacheService.set(cacheKey, response, ttl);
        }
      }),
    );
  }
}







