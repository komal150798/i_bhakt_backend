import { HttpException } from '@nestjs/common';
import { ZunoErrorCode } from './error-codes.enum';
export interface ZunoFieldError {
    field: string;
    code: string;
}
export interface ZunoErrorBody {
    code: ZunoErrorCode;
    message: string;
    fields?: ZunoFieldError[];
    safety?: {
        disposition: string;
        domain?: string;
    };
}
export declare class ZunoException extends HttpException {
    readonly code: ZunoErrorCode;
    readonly fields?: ZunoFieldError[];
    readonly safety?: ZunoErrorBody['safety'];
    readonly internalDetail?: string;
    constructor(code: ZunoErrorCode, options?: {
        message?: string;
        fields?: ZunoFieldError[];
        safety?: ZunoErrorBody['safety'];
        internalDetail?: string;
    });
    static validation(fields: ZunoFieldError[], message?: string): ZunoException;
    static notFound(internalDetail?: string): ZunoException;
    static staleVersion(expected: number, actual: number): ZunoException;
    static internal(internalDetail?: string): ZunoException;
}
