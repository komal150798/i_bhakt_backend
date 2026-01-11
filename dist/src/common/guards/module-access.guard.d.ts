import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../../subscriptions/services/subscriptions.service';
export declare const MODULE_SLUG_KEY = "module_slug";
export declare class ModuleAccessGuard implements CanActivate {
    private subscriptionsService;
    private reflector;
    constructor(subscriptionsService: SubscriptionsService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
