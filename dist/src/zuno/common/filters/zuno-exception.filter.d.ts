import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { RequestContextService } from '../services/request-context.service';
export declare class ZunoExceptionFilter implements ExceptionFilter {
    private readonly requestContext;
    private readonly logger;
    constructor(requestContext: RequestContextService);
    catch(exception: unknown, host: ArgumentsHost): void;
    private normalise;
    private codeForStatus;
}
