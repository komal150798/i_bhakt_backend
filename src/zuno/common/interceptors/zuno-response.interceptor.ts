import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestContextService } from '../services/request-context.service';

export const ZUNO_API_VERSION = 'v1';

/** Step 21 API Contracts section 11. */
export interface ZunoEnvelope<T> {
  data: T;
  meta: {
    requestId: string;
    apiVersion: string;
    [key: string]: unknown;
  };
}

/**
 * Marker a service can return to add fields to `meta` (for example the cursor
 * pagination block from Step 21 section 17) without polluting `data`.
 */
export class ZunoPayload<T> {
  constructor(
    readonly data: T,
    readonly meta: Record<string, unknown> = {},
  ) {}
}

/**
 * Wraps ZUNO handler results in the `{ data, meta }` envelope.
 *
 * Applied per-controller rather than globally: the app already installs the
 * legacy iBhakt `{success, code, message, data}` interceptor for every other
 * route, and Step 21 section 11 mandates a different shape for ZUNO. The legacy
 * interceptor defers to this one via `isZunoRoute()`.
 */
@Injectable()
export class ZunoResponseInterceptor<T>
  implements NestInterceptor<T, ZunoEnvelope<T>>
{
  constructor(private readonly requestContext: RequestContextService) {}

  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ZunoEnvelope<T>> {
    return next.handle().pipe(
      map((result) => {
        const extraMeta =
          result instanceof ZunoPayload ? result.meta : ({} as Record<string, unknown>);
        const data = result instanceof ZunoPayload ? result.data : result;

        return {
          data: data as T,
          meta: {
            requestId: this.requestContext.requestId,
            apiVersion: ZUNO_API_VERSION,
            ...extraMeta,
          },
        };
      }),
    );
  }
}
