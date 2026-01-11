"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(HttpExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status;
        let message;
        let errors = undefined;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (typeof exceptionResponse === 'object') {
                const responseObj = exceptionResponse;
                if (Array.isArray(responseObj.message)) {
                    message = responseObj.message[0] || 'Validation failed';
                    errors = {
                        validation: responseObj.message,
                        fields: this.extractValidationErrors(responseObj.message),
                    };
                }
                else {
                    message = responseObj.message || exception.message || 'An error occurred';
                    if (responseObj.error) {
                        errors = {
                            type: responseObj.error,
                            details: responseObj,
                        };
                    }
                }
            }
            else {
                message = exception.message || 'An error occurred';
            }
        }
        else {
            status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
            if (process.env.NODE_ENV !== 'production') {
                this.logger.error('Unhandled exception:', exception);
                if (exception instanceof Error) {
                    errors = {
                        name: exception.name,
                        message: exception.message,
                        stack: exception.stack,
                    };
                }
            }
            else {
                this.logger.error('Unhandled exception:', exception instanceof Error ? exception.message : String(exception));
            }
        }
        const errorResponse = {
            success: false,
            code: status,
            message,
        };
        if (errors) {
            errorResponse.errors = errors;
        }
        this.logger.error(`${request.method} ${request.url} - ${status} - ${message}`, exception instanceof Error ? exception.stack : undefined);
        response.status(status).json(errorResponse);
    }
    extractValidationErrors(messages) {
        const fieldErrors = {};
        messages.forEach((msg) => {
            const match = msg.match(/^(\w+)\s/);
            if (match) {
                const field = match[1];
                if (!fieldErrors[field]) {
                    fieldErrors[field] = [];
                }
                fieldErrors[field].push(msg);
            }
        });
        return Object.keys(fieldErrors).length > 0 ? fieldErrors : {};
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map