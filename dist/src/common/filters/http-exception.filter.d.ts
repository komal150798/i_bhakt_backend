import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export interface StandardApiErrorResponse {
    success: false;
    code: number;
    message: string;
    errors?: any;
}
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
    private extractValidationErrors;
}
