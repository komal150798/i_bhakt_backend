import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../../subscriptions/services/subscriptions.service';

export const MODULE_SLUG_KEY = 'module_slug';

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    private subscriptionsService: SubscriptionsService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const moduleSlug = this.reflector.getAllAndOverride<string>(MODULE_SLUG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!moduleSlug) {
      return true; // No module restriction
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const hasAccess = await this.subscriptionsService.hasModuleAccess(user.id, moduleSlug);

    if (!hasAccess) {
      throw new ForbiddenException(`Access denied. You need an active subscription to access this module.`);
    }

    return true;
  }
}







