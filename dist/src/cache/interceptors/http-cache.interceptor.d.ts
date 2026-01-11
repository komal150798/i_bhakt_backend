import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CacheService } from '../cache.service';
import { Reflector } from '@nestjs/core';
export declare class HttpCacheInterceptor implements NestInterceptor {
    private cacheService;
    private reflector;
    constructor(cacheService: CacheService, reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
}
