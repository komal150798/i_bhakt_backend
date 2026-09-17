import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ZunoUserResolverService } from '../../identity/services/zuno-user-resolver.service';
import { RequestContextService } from '../services/request-context.service';
export declare const ZUNO_USER_REQUEST_KEY = "zunoUser";
export declare class ZunoUserGuard implements CanActivate {
    private readonly resolver;
    private readonly requestContext;
    constructor(resolver: ZunoUserResolverService, requestContext: RequestContextService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
