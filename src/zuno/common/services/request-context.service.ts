import { Injectable, NestMiddleware } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * Per-request correlation data.
 *
 * Step 21 section 15: every request carries a requestId, propagated to internal
 * calls together with traceId and *references* to user/challenge context -
 * never the raw sensitive content itself.
 */
export interface ZunoRequestContext {
  requestId: string;
  traceId: string;
  /** ZUNO user id, populated once the user has been resolved. */
  userRef?: string;
  challengeRef?: string;
  appVersion?: string;
  platform?: string;
}

const storage = new AsyncLocalStorage<ZunoRequestContext>();

@Injectable()
export class RequestContextService {
  get(): ZunoRequestContext | undefined {
    return storage.getStore();
  }

  get requestId(): string {
    return storage.getStore()?.requestId ?? 'req_unknown';
  }

  /**
   * Attach a resolved identity to the live context so downstream logs and
   * internal calls can be correlated without re-threading parameters.
   */
  setUserRef(userRef: string): void {
    const store = storage.getStore();
    if (store) store.userRef = userRef;
  }

  setChallengeRef(challengeRef: string): void {
    const store = storage.getStore();
    if (store) store.challengeRef = challengeRef;
  }

  run<T>(context: ZunoRequestContext, fn: () => T): T {
    return storage.run(context, fn);
  }
}

/**
 * Establishes the correlation context for every ZUNO request.
 *
 * Honours an inbound `x-request-id` so a correlation id created upstream (API
 * gateway, mobile client) survives into our logs, and echoes it back on the
 * response. Step 21 section 103 treats the client version headers as telemetry
 * only - they are recorded here but must never influence authorization.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const inbound = req.headers['x-request-id'];
    const requestId =
      typeof inbound === 'string' && inbound.length > 0 && inbound.length <= 128
        ? inbound
        : `req_${randomUUID()}`;

    const inboundTrace = req.headers['x-trace-id'];
    const traceId =
      typeof inboundTrace === 'string' && inboundTrace.length > 0
        ? inboundTrace
        : requestId;

    const context: ZunoRequestContext = {
      requestId,
      traceId,
      appVersion: singleHeader(req.headers['x-zuno-app-version']),
      platform: singleHeader(req.headers['x-zuno-platform']),
    };

    res.setHeader('x-request-id', requestId);
    this.requestContext.run(context, () => next());
  }
}

function singleHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
