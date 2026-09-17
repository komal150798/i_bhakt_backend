import { EntityManager } from 'typeorm';
import { RequestContextService } from './request-context.service';
export interface AuditInput {
    actorType: 'USER' | 'ADMIN' | 'SYSTEM' | 'SERVICE';
    actorId?: string | null;
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    before?: unknown;
    after?: unknown;
    metadata?: Record<string, unknown>;
}
export declare class ZunoAuditService {
    private readonly requestContext;
    constructor(requestContext: RequestContextService);
    record(manager: EntityManager, input: AuditInput): Promise<void>;
}
