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
exports.ZunoResponseInterceptor = exports.ZunoPayload = exports.ZUNO_API_VERSION = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const request_context_service_1 = require("../services/request-context.service");
exports.ZUNO_API_VERSION = 'v1';
class ZunoPayload {
    constructor(data, meta = {}) {
        this.data = data;
        this.meta = meta;
    }
}
exports.ZunoPayload = ZunoPayload;
let ZunoResponseInterceptor = class ZunoResponseInterceptor {
    constructor(requestContext) {
        this.requestContext = requestContext;
    }
    intercept(_context, next) {
        return next.handle().pipe((0, operators_1.map)((result) => {
            const extraMeta = result instanceof ZunoPayload ? result.meta : {};
            const data = result instanceof ZunoPayload ? result.data : result;
            return {
                data: data,
                meta: {
                    requestId: this.requestContext.requestId,
                    apiVersion: exports.ZUNO_API_VERSION,
                    ...extraMeta,
                },
            };
        }));
    }
};
exports.ZunoResponseInterceptor = ZunoResponseInterceptor;
exports.ZunoResponseInterceptor = ZunoResponseInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [request_context_service_1.RequestContextService])
], ZunoResponseInterceptor);
//# sourceMappingURL=zuno-response.interceptor.js.map