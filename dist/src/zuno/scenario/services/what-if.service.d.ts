import { DataSource, Repository } from 'typeorm';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoWhatIfSession } from '../entities/zuno-what-if-session.entity';
import { ZunoWhatIfAssumption } from '../entities/zuno-what-if-assumption.entity';
import { IWhatIfEngine } from '../ports/what-if.port';
import { ScenarioContextService } from './scenario-context.service';
import { ScenarioService } from './scenario.service';
import { SafetyService } from '../../safety/services/safety.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
export declare const WHAT_IF_HYPOTHETICAL_NOTICE = "This is a hypothetical. Your current plan is unchanged.";
export interface ExploreWhatIfParams {
    user: ZunoUser;
    challengeId: string;
    question: string;
}
export declare class WhatIfService {
    private readonly sessions;
    private readonly assumptions;
    private readonly engine;
    private readonly context;
    private readonly scenarios;
    private readonly safety;
    private readonly outbox;
    private readonly audit;
    private readonly ownership;
    private readonly clock;
    private readonly dataSource;
    private readonly logger;
    constructor(sessions: Repository<ZunoWhatIfSession>, assumptions: Repository<ZunoWhatIfAssumption>, engine: IWhatIfEngine, context: ScenarioContextService, scenarios: ScenarioService, safety: SafetyService, outbox: OutboxService, audit: ZunoAuditService, ownership: ZunoOwnershipService, clock: ClockService, dataSource: DataSource);
    explore(params: ExploreWhatIfParams): Promise<{
        session: ZunoWhatIfSession;
        assumptions: ZunoWhatIfAssumption[];
    }>;
    findOwnedSession(user: ZunoUser, sessionId: string): Promise<{
        session: ZunoWhatIfSession;
        assumptions: ZunoWhatIfAssumption[];
    }>;
    discard(user: ZunoUser, sessionId: string): Promise<void>;
    private recordBlocked;
}
