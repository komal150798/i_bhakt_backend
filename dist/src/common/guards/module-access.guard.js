"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleAccessGuard = exports.MODULE_SLUG_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const subscriptions_service_1 = require("../../subscriptions/services/subscriptions.service");
exports.MODULE_SLUG_KEY = 'module_slug';
let ModuleAccessGuard = class ModuleAccessGuard {
    constructor(subscriptionsService, reflector) {
        this.subscriptionsService = subscriptionsService;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const moduleSlug = this.reflector.getAllAndOverride(exports.MODULE_SLUG_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!moduleSlug) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        const hasAccess = await this.subscriptionsService.hasModuleAccess(user.id, moduleSlug);
        if (!hasAccess) {
            throw new common_1.ForbiddenException(`Access denied. You need an active subscription to access this module.`);
        }
        return true;
    }
};
exports.ModuleAccessGuard = ModuleAccessGuard;
exports.ModuleAccessGuard = ModuleAccessGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService,
        core_1.Reflector])
], ModuleAccessGuard);
//# sourceMappingURL=module-access.guard.js.map