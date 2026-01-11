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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const core_1 = require("@nestjs/core");
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    constructor(reflector) {
        super();
        this.reflector = reflector;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            const request = context.switchToHttp().getRequest();
            const authHeader = request.headers?.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const result = super.canActivate(context);
                if (result instanceof Promise) {
                    return result.catch(() => {
                        return true;
                    });
                }
                return result;
            }
            return true;
        }
        return super.canActivate(context);
    }
    handleRequest(err, user, info, context) {
        const isPublic = this.reflector.getAllAndOverride('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            if (err || !user) {
                return null;
            }
            return user;
        }
        if (err || !user) {
            if (err) {
                console.error('JWT Auth Error:', {
                    message: err.message,
                    name: err.name,
                    stack: err.stack,
                });
            }
            if (info) {
                console.error('JWT Info:', {
                    message: info.message,
                    name: info.name,
                });
            }
            let errorMessage = 'Invalid or expired token';
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    errorMessage = 'Token has expired. Please refresh or login again.';
                }
                else if (err.name === 'JsonWebTokenError') {
                    errorMessage = 'Invalid token format or signature.';
                }
                else if (err.name === 'NotBeforeError') {
                    errorMessage = 'Token not yet valid.';
                }
                else {
                    errorMessage = err.message || errorMessage;
                }
            }
            else if (info) {
                if (info.message === 'jwt expired') {
                    errorMessage = 'Token has expired. Please refresh or login again.';
                }
                else if (info.message === 'jwt malformed') {
                    errorMessage = 'Invalid token format.';
                }
                else {
                    errorMessage = info.message || errorMessage;
                }
            }
            throw err || new common_1.UnauthorizedException(errorMessage);
        }
        return user;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map