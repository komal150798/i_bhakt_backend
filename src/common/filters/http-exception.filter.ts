import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

/**
 * Standard API Error Response Format
 */
export interface StandardApiErrorResponse {
  success: false;
  code: number;
  message: string;
  errors?: any;
}

/**
 * HttpExceptionFilter
 * Catches all exceptions and formats them in standard format:
 * {
 *   success: false,
 *   code: 400,
 *   message: "Something went wrong",
 *   errors: { ...optional extra details... }
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      // Handle HttpException (includes BadRequestException, UnauthorizedException, etc.)
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;

        // Extract message
        if (Array.isArray(responseObj.message)) {
          // Validation errors from class-validator
          message = responseObj.message[0] || 'Validation failed';
          errors = {
            validation: responseObj.message,
            fields: this.extractValidationErrors(responseObj.message),
          };
        } else {
          message = responseObj.message || exception.message || 'An error occurred';
          // Include error details if available
          if (responseObj.error) {
            errors = {
              type: responseObj.error,
              details: responseObj,
            };
          }
        }
      } else {
        message = exception.message || 'An error occurred';
      }
    } else {
      // Handle unknown errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';

      // Log the full error in development
      if (process.env.NODE_ENV !== 'production') {
        this.logger.error('Unhandled exception:', exception);
        if (exception instanceof Error) {
          errors = {
            name: exception.name,
            message: exception.message,
            stack: exception.stack,
          };
        }
      } else {
        // In production, only log, don't send stack trace
        this.logger.error('Unhandled exception:', exception instanceof Error ? exception.message : String(exception));
      }
    }

    // Build standard error response
    const errorResponse: StandardApiErrorResponse = {
      success: false,
      code: status,
      message,
    };

    // Add errors object only if it has content
    if (errors) {
      errorResponse.errors = errors;
    }

    // Log error details
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(errorResponse);
  }

  /**
   * Extract validation errors from class-validator messages
   */
  private extractValidationErrors(messages: string[]): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};

    messages.forEach((msg) => {
      // Try to extract field name from message (e.g., "email must be an email" -> "email")
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
}
