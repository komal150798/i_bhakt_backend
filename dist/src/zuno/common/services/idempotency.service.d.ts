import { Repository } from 'typeorm';
import { ZunoIdempotencyKey } from '../entities/zuno-idempotency-key.entity';
import { ClockService } from './clock.service';
export declare class IdempotencyService {
    private readonly keys;
    private readonly clock;
    constructor(keys: Repository<ZunoIdempotencyKey>, clock: ClockService);
    execute<T extends Record<string, unknown>>(params: {
        operation: string;
        key: string | undefined;
        userId: string | null;
        requestBody: unknown;
        ttlMs?: number;
    }, work: () => Promise<T>): Promise<T>;
}
