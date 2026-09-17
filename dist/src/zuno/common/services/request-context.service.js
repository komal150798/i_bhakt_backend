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
exports.RequestContextMiddleware = exports.RequestContextService = void 0;
const common_1 = require("@nestjs/common");
const async_hooks_1 = require("async_hooks");
const crypto_1 = require("crypto");
const storage = new async_hooks_1.AsyncLocalStorage();
let RequestContextService = class RequestContextService {
    get() {
        return storage.getStore();
    }
    get requestId() {
        return storage.getStore()?.requestId ?? 'req_unknown';
    }
    setUserRef(userRef) {
        const store = storage.getStore();
        if (store)
            store.userRef = userRef;
    }
    setChallengeRef(challengeRef) {
        const store = storage.getStore();
        if (store)
            store.challengeRef = challengeRef;
    }
    run(context, fn) {
        return storage.run(context, fn);
    }
};
exports.RequestContextService = RequestContextService;
exports.RequestContextService = RequestContextService = __decorate([
    (0, common_1.Injectable)()
], RequestContextService);
let RequestContextMiddleware = class RequestContextMiddleware {
    constructor(requestContext) {
        this.requestContext = requestContext;
    }
    use(req, res, next) {
        const inbound = req.headers['x-request-id'];
        const requestId = typeof inbound === 'string' && inbound.length > 0 && inbound.length <= 128
            ? inbound
            : `req_${(0, crypto_1.randomUUID)()}`;
        const inboundTrace = req.headers['x-trace-id'];
        const traceId = typeof inboundTrace === 'string' && inboundTrace.length > 0
            ? inboundTrace
            : requestId;
        const context = {
            requestId,
            traceId,
            appVersion: singleHeader(req.headers['x-zuno-app-version']),
            platform: singleHeader(req.headers['x-zuno-platform']),
        };
        res.setHeader('x-request-id', requestId);
        this.requestContext.run(context, () => next());
    }
};
exports.RequestContextMiddleware = RequestContextMiddleware;
exports.RequestContextMiddleware = RequestContextMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [RequestContextService])
], RequestContextMiddleware);
function singleHeader(value) {
    if (Array.isArray(value))
        return value[0];
    return value;
}
//# sourceMappingURL=request-context.service.js.map