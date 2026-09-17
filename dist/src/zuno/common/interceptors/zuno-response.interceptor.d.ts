import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContextService } from '../services/request-context.service';
export declare const ZUNO_API_VERSION = "v1";
export interface ZunoEnvelope<T> {
    data: T;
    meta: {
        requestId: string;
        apiVersion: string;
        [key: string]: unknown;
    };
}
export declare class ZunoPayload<T> {
    readonly data: T;
    readonly meta: Record<string, unknown>;
    constructor(data: T, meta?: Record<string, unknown>);
}
export declare class ZunoResponseInterceptor<T> implements NestInterceptor<T, ZunoEnvelope<T>> {
    private readonly requestContext;
    constructor(requestContext: RequestContextService);
    intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ZunoEnvelope<T>>;
}
