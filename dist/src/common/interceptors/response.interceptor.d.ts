import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface StandardApiResponse<T = any> {
    success: boolean;
    code: number;
    message?: string;
    data?: T;
    errors?: any;
}
export declare class ResponseInterceptor<T> implements NestInterceptor<T, StandardApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<StandardApiResponse<T>>;
    private getDefaultMessage;
}
