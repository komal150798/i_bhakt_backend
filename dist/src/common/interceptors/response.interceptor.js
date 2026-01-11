"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let ResponseInterceptor = class ResponseInterceptor {
    intercept(context, next) {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const method = request.method;
        return next.handle().pipe((0, operators_1.map)((data) => {
            const statusCode = response.statusCode || 200;
            if (data &&
                typeof data === 'object' &&
                ('success' in data || 'code' in data || 'message' in data)) {
                const existingResponse = data;
                if (!('code' in existingResponse)) {
                    existingResponse.code = statusCode;
                }
                if (!('success' in existingResponse)) {
                    existingResponse.success = true;
                }
                return existingResponse;
            }
            let message;
            let responseData = data;
            if (data && typeof data === 'object') {
                if ('message' in data && typeof data.message === 'string') {
                    message = data.message;
                    const { message: _, ...rest } = data;
                    responseData = Object.keys(rest).length > 0 ? rest : data.data || data;
                }
                else if ('data' in data) {
                    responseData = data.data;
                    message = data.message;
                }
            }
            if (!message) {
                message = this.getDefaultMessage(method, statusCode);
            }
            return {
                success: true,
                code: statusCode,
                message,
                data: responseData,
            };
        }));
    }
    getDefaultMessage(method, statusCode) {
        if (statusCode === 201) {
            return 'Created successfully.';
        }
        switch (method.toUpperCase()) {
            case 'GET':
                return 'Request successful.';
            case 'POST':
                return 'Created successfully.';
            case 'PUT':
            case 'PATCH':
                return 'Updated successfully.';
            case 'DELETE':
                return 'Deleted successfully.';
            default:
                return 'Request successful.';
        }
    }
};
exports.ResponseInterceptor = ResponseInterceptor;
exports.ResponseInterceptor = ResponseInterceptor = __decorate([
    (0, common_1.Injectable)()
], ResponseInterceptor);
//# sourceMappingURL=response.interceptor.js.map