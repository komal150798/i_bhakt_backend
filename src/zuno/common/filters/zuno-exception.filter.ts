import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZunoException, ZunoErrorBody } from '../errors/zuno.exception';
import {
  ZunoErrorCode,
  ZUNO_ERROR_DEFAULT_MESSAGE,
  ZUNO_ERROR_HTTP_STATUS,
} from '../errors/error-codes.enum';
import { RequestContextService } from '../services/request-context.service';
import { ZUNO_API_VERSION } from '../interceptors/zuno-response.interceptor';

/**
 * Renders every ZUNO failure as the Step 21 section 12 error envelope.
 *
 * The hard rule this filter exists to enforce (Step 21 section 12, Build Rule
 * 23): a client must never receive a stack trace, a database error, an internal
 * prompt, a credential or private reasoning. Anything not already a known,
 * safe error is logged server-side and reported as INTERNAL_ERROR with a
 * generic message - including in development, unlike the legacy iBhakt filter
 * which returns `exception.stack` to the caller when NODE_ENV is not production.
 */
@Catch()
export class ZunoExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ZunoApi');

  constructor(private readonly requestContext: RequestContextService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = this.requestContext.requestId;

    const { status, body, internalDetail } = this.normalise(exception);

    // Step 21 section 114: log route, status and code - never the request body,
    // challenge text, birth details or token.
    this.logger.error(
      `${request.method} ${stripQuery(request.url)} -> ${status} ${body.code} [${requestId}]` +
        (internalDetail ? ` :: ${internalDetail}` : ''),
    );
    if (status >= 500 && exception instanceof Error) {
      // Stack goes to the server log only.
      this.logger.error(exception.stack);
    }

    response.status(status).json({
      error: body,
      meta: { requestId, apiVersion: ZUNO_API_VERSION },
    });
  }

  private normalise(exception: unknown): {
    status: number;
    body: ZunoErrorBody;
    internalDetail?: string;
  } {
    if (exception instanceof ZunoException) {
      return {
        status: exception.getStatus(),
        body: (exception.getResponse() as { error: ZunoErrorBody }).error,
        internalDetail: exception.internalDetail,
      };
    }

    // class-validator rejections arrive as BadRequestException with a string[]
    // message. Translate them into the typed `fields` contract.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const code = this.codeForStatus(status);

      if (raw && typeof raw === 'object' && Array.isArray((raw as any).message)) {
        return {
          status: ZUNO_ERROR_HTTP_STATUS[ZunoErrorCode.VALIDATION_ERROR],
          body: {
            code: ZunoErrorCode.VALIDATION_ERROR,
            message: ZUNO_ERROR_DEFAULT_MESSAGE[ZunoErrorCode.VALIDATION_ERROR],
            fields: (raw as any).message.map((m: string) => ({
              field: fieldFromValidationMessage(m),
              code: 'INVALID',
            })),
          },
          internalDetail: (raw as any).message.join('; '),
        };
      }

      return {
        status,
        body: { code, message: ZUNO_ERROR_DEFAULT_MESSAGE[code] },
        internalDetail: exception.message,
      };
    }

    return {
      status: 500,
      body: {
        code: ZunoErrorCode.INTERNAL_ERROR,
        message: ZUNO_ERROR_DEFAULT_MESSAGE[ZunoErrorCode.INTERNAL_ERROR],
      },
      internalDetail:
        exception instanceof Error ? exception.message : String(exception),
    };
  }

  private codeForStatus(status: number): ZunoErrorCode {
    switch (status) {
      case 400:
        return ZunoErrorCode.VALIDATION_ERROR;
      case 401:
        return ZunoErrorCode.AUTHENTICATION_REQUIRED;
      case 403:
        return ZunoErrorCode.FORBIDDEN;
      case 404:
        return ZunoErrorCode.NOT_FOUND;
      case 409:
        return ZunoErrorCode.CONFLICT;
      case 422:
        return ZunoErrorCode.VALIDATION_ERROR;
      case 429:
        return ZunoErrorCode.RATE_LIMITED;
      case 503:
        return ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE;
      default:
        return ZunoErrorCode.INTERNAL_ERROR;
    }
  }
}

function stripQuery(url: string): string {
  return url.split('?')[0];
}

function fieldFromValidationMessage(message: string): string {
  const match = message.match(/^([A-Za-z0-9_.]+)\s/);
  return match ? match[1] : 'unknown';
}
