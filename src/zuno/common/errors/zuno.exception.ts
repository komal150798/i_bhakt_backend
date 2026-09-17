import { HttpException } from '@nestjs/common';
import {
  ZunoErrorCode,
  ZUNO_ERROR_HTTP_STATUS,
  ZUNO_ERROR_DEFAULT_MESSAGE,
} from './error-codes.enum';

export interface ZunoFieldError {
  field: string;
  code: string;
}

export interface ZunoErrorBody {
  code: ZunoErrorCode;
  message: string;
  fields?: ZunoFieldError[];
  /**
   * Machine-readable safety disposition, present when a response is shaped by
   * the safety layer (Step 21 section 14/70).
   */
  safety?: { disposition: string; domain?: string };
}

/**
 * The only exception type ZUNO controllers should throw.
 *
 * Carrying a ZunoErrorCode rather than a bare HTTP status keeps the public
 * contract stable (Step 21 section 13) and keeps clients off status-code
 * sniffing. `internalDetail` never reaches the client - it exists so the
 * exception filter can log a useful cause without leaking it (Build Rule 23).
 */
export class ZunoException extends HttpException {
  readonly code: ZunoErrorCode;
  readonly fields?: ZunoFieldError[];
  readonly safety?: ZunoErrorBody['safety'];
  readonly internalDetail?: string;

  constructor(
    code: ZunoErrorCode,
    options: {
      message?: string;
      fields?: ZunoFieldError[];
      safety?: ZunoErrorBody['safety'];
      internalDetail?: string;
    } = {},
  ) {
    const body: ZunoErrorBody = {
      code,
      message: options.message ?? ZUNO_ERROR_DEFAULT_MESSAGE[code],
      ...(options.fields ? { fields: options.fields } : {}),
      ...(options.safety ? { safety: options.safety } : {}),
    };
    super({ error: body }, ZUNO_ERROR_HTTP_STATUS[code]);
    this.code = code;
    this.fields = options.fields;
    this.safety = options.safety;
    this.internalDetail = options.internalDetail;
  }

  static validation(fields: ZunoFieldError[], message?: string): ZunoException {
    return new ZunoException(ZunoErrorCode.VALIDATION_ERROR, { fields, message });
  }

  /**
   * Step 21 section 125 / Golden Contract Test - user A asking for user B's
   * resource must not be able to tell the difference between "exists but not
   * yours" and "does not exist". Both paths funnel here.
   */
  static notFound(internalDetail?: string): ZunoException {
    return new ZunoException(ZunoErrorCode.NOT_FOUND, { internalDetail });
  }

  /** Step 21 section 108: stale optimistic-lock write. */
  static staleVersion(expected: number, actual: number): ZunoException {
    return new ZunoException(ZunoErrorCode.CONFLICT, {
      internalDetail: `optimistic lock: client sent version ${expected}, server at ${actual}`,
    });
  }

  static internal(internalDetail?: string): ZunoException {
    return new ZunoException(ZunoErrorCode.INTERNAL_ERROR, { internalDetail });
  }
}
