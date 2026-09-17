import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
export interface ZunoRequestContext {
    requestId: string;
    traceId: string;
    userRef?: string;
    challengeRef?: string;
    appVersion?: string;
    platform?: string;
}
export declare class RequestContextService {
    get(): ZunoRequestContext | undefined;
    get requestId(): string;
    setUserRef(userRef: string): void;
    setChallengeRef(challengeRef: string): void;
    run<T>(context: ZunoRequestContext, fn: () => T): T;
}
export declare class RequestContextMiddleware implements NestMiddleware {
    private readonly requestContext;
    constructor(requestContext: RequestContextService);
    use(req: Request, res: Response, next: NextFunction): void;
}
