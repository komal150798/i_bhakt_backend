import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

/**
 * Standard API Response Format
 */
export interface StandardApiResponse<T = any> {
  success: boolean;
  code: number;
  message?: string;
  data?: T;
  errors?: any;
}

/**
 * Response Interceptor
 * Wraps all successful responses in standard format:
 * {
 *   success: true,
 *   code: 200,
 *   message: "Request successful.",
 *   data: { ... }
 * }
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, StandardApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const method = request.method;

    return next.handle().pipe(
      map((data) => {
        // Get status code from response (may be set by @HttpCode decorator or default 200)
        const statusCode = response.statusCode || 200;

        // If response already has success, code, or message, do not double wrap
        if (
          data &&
          typeof data === 'object' &&
          ('success' in data || 'code' in data || 'message' in data)
        ) {
          // Ensure it has all required fields
          const existingResponse = data as any;
          if (!('code' in existingResponse)) {
            existingResponse.code = statusCode;
          }
          if (!('success' in existingResponse)) {
            existingResponse.success = true;
          }
          return existingResponse as StandardApiResponse<T>;
        }

        // Extract message from data if present
        let message: string | undefined;
        let responseData: any = data;

        if (data && typeof data === 'object') {
          // If data has a message property, extract it
          if ('message' in data && typeof data.message === 'string') {
            message = data.message;
            // Remove message from data if it exists
            const { message: _, ...rest } = data;
            responseData = Object.keys(rest).length > 0 ? rest : data.data || data;
          } else if ('data' in data) {
            // If data is already wrapped in { data: ... }, use it
            responseData = data.data;
            message = data.message;
          }
        }

        // Default message based on HTTP method and status code
        if (!message) {
          message = this.getDefaultMessage(method, statusCode);
        }

        // Build standard response
        return {
          success: true,
          code: statusCode,
          message,
          data: responseData,
        };
      }),
    );
  }

  /**
   * Get default message based on HTTP method and status code
   */
  private getDefaultMessage(method: string, statusCode: number): string {
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
}

