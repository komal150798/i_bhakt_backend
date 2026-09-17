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
exports.ZunoUserGuard = exports.ZUNO_USER_REQUEST_KEY = void 0;
const common_1 = require("@nestjs/common");
const zuno_user_resolver_service_1 = require("../../identity/services/zuno-user-resolver.service");
const zuno_exception_1 = require("../errors/zuno.exception");
const error_codes_enum_1 = require("../errors/error-codes.enum");
const request_context_service_1 = require("../services/request-context.service");
exports.ZUNO_USER_REQUEST_KEY = 'zunoUser';
let ZunoUserGuard = class ZunoUserGuard {
    constructor(resolver, requestContext) {
        this.resolver = resolver;
        this.requestContext = requestContext;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const principal = request.user;
        if (!principal) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.AUTHENTICATION_REQUIRED);
        }
        const zunoUser = await this.resolver.resolve(principal);
        request[exports.ZUNO_USER_REQUEST_KEY] = zunoUser;
        this.requestContext.setUserRef(zunoUser.id);
        return true;
    }
};
exports.ZunoUserGuard = ZunoUserGuard;
exports.ZunoUserGuard = ZunoUserGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [zuno_user_resolver_service_1.ZunoUserResolverService,
        request_context_service_1.RequestContextService])
], ZunoUserGuard);
//# sourceMappingURL=zuno-user.guard.js.map