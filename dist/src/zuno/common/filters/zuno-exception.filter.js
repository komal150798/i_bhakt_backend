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
exports.ZunoExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const zuno_exception_1 = require("../errors/zuno.exception");
const error_codes_enum_1 = require("../errors/error-codes.enum");
const request_context_service_1 = require("../services/request-context.service");
const zuno_response_interceptor_1 = require("../interceptors/zuno-response.interceptor");
let ZunoExceptionFilter = class ZunoExceptionFilter {
    constructor(requestContext) {
        this.requestContext = requestContext;
        this.logger = new common_1.Logger('ZunoApi');
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const requestId = this.requestContext.requestId;
        const { status, body, internalDetail } = this.normalise(exception);
        this.logger.error(`${request.method} ${stripQuery(request.url)} -> ${status} ${body.code} [${requestId}]` +
            (internalDetail ? ` :: ${internalDetail}` : ''));
        if (status >= 500 && exception instanceof Error) {
            this.logger.error(exception.stack);
        }
        response.status(status).json({
            error: body,
            meta: { requestId, apiVersion: zuno_response_interceptor_1.ZUNO_API_VERSION },
        });
    }
    normalise(exception) {
        if (exception instanceof zuno_exception_1.ZunoException) {
            return {
                status: exception.getStatus(),
                body: exception.getResponse().error,
                internalDetail: exception.internalDetail,
            };
        }
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const raw = exception.getResponse();
            const code = this.codeForStatus(status);
            if (raw && typeof raw === 'object' && Array.isArray(raw.message)) {
                return {
                    status: error_codes_enum_1.ZUNO_ERROR_HTTP_STATUS[error_codes_enum_1.ZunoErrorCode.VALIDATION_ERROR],
                    body: {
                        code: error_codes_enum_1.ZunoErrorCode.VALIDATION_ERROR,
                        message: error_codes_enum_1.ZUNO_ERROR_DEFAULT_MESSAGE[error_codes_enum_1.ZunoErrorCode.VALIDATION_ERROR],
                        fields: raw.message.map((m) => ({
                            field: fieldFromValidationMessage(m),
                            code: 'INVALID',
                        })),
                    },
                    internalDetail: raw.message.join('; '),
                };
            }
            return {
                status,
                body: { code, message: error_codes_enum_1.ZUNO_ERROR_DEFAULT_MESSAGE[code] },
                internalDetail: exception.message,
            };
        }
        return {
            status: 500,
            body: {
                code: error_codes_enum_1.ZunoErrorCode.INTERNAL_ERROR,
                message: error_codes_enum_1.ZUNO_ERROR_DEFAULT_MESSAGE[error_codes_enum_1.ZunoErrorCode.INTERNAL_ERROR],
            },
            internalDetail: exception instanceof Error ? exception.message : String(exception),
        };
    }
    codeForStatus(status) {
        switch (status) {
            case 400:
                return error_codes_enum_1.ZunoErrorCode.VALIDATION_ERROR;
            case 401:
                return error_codes_enum_1.ZunoErrorCode.AUTHENTICATION_REQUIRED;
            case 403:
                return error_codes_enum_1.ZunoErrorCode.FORBIDDEN;
            case 404:
                return error_codes_enum_1.ZunoErrorCode.NOT_FOUND;
            case 409:
                return error_codes_enum_1.ZunoErrorCode.CONFLICT;
            case 422:
                return error_codes_enum_1.ZunoErrorCode.VALIDATION_ERROR;
            case 429:
                return error_codes_enum_1.ZunoErrorCode.RATE_LIMITED;
            case 503:
                return error_codes_enum_1.ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE;
            default:
                return error_codes_enum_1.ZunoErrorCode.INTERNAL_ERROR;
        }
    }
};
exports.ZunoExceptionFilter = ZunoExceptionFilter;
exports.ZunoExceptionFilter = ZunoExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [request_context_service_1.RequestContextService])
], ZunoExceptionFilter);
function stripQuery(url) {
    return url.split('?')[0];
}
function fieldFromValidationMessage(message) {
    const match = message.match(/^([A-Za-z0-9_.]+)\s/);
    return match ? match[1] : 'unknown';
}
//# sourceMappingURL=zuno-exception.filter.js.map