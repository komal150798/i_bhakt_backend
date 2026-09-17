import { DataSource, Repository } from 'typeorm';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoScenarioSet } from '../entities/zuno-scenario-set.entity';
import { ZunoScenario } from '../entities/zuno-scenario.entity';
import { ZunoScenarioCondition } from '../entities/zuno-scenario-condition.entity';
import { IScenarioEngine } from '../ports/scenario.port';
import { ScenarioContextService } from './scenario-context.service';
import { SafetyService } from '../../safety/services/safety.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { ScenarioStatus } from '../enums/scenario.enum';
export interface GenerateScenariosParams {
    user: ZunoUser;
    challengeId: string;
    reason?: string;
}
export interface ScenarioSetResult {
    set: ZunoScenarioSet;
    scenarios: ZunoScenario[];
}
export declare class ScenarioService {
    private readonly sets;
    private readonly scenarios;
    private readonly conditions;
    private readonly engine;
    private readonly context;
    private readonly safety;
    private readonly outbox;
    private readonly audit;
    private readonly ownership;
    private readonly clock;
    private readonly dataSource;
    private readonly logger;
    constructor(sets: Repository<ZunoScenarioSet>, scenarios: Repository<ZunoScenario>, conditions: Repository<ZunoScenarioCondition>, engine: IScenarioEngine, context: ScenarioContextService, safety: SafetyService, outbox: OutboxService, audit: ZunoAuditService, ownership: ZunoOwnershipService, clock: ClockService, dataSource: DataSource);
    generate(params: GenerateScenariosParams): Promise<ScenarioSetResult>;
    currentSet(challengeId: string): Promise<ZunoScenarioSet | null>;
    listCurrent(user: ZunoUser, challengeId: string, options?: {
        includeAll?: boolean;
    }): Promise<ScenarioSetResult | null>;
    findOwnedScenario(userId: string, scenarioId: string): Promise<ZunoScenario>;
    decide(user: ZunoUser, scenarioId: string, status: ScenarioStatus.USER_ADOPTED | ScenarioStatus.USER_REJECTED | ScenarioStatus.DISMISSED, note: string | undefined, expectedVersion: number | undefined): Promise<ZunoScenario>;
    markTriggered(user: ZunoUser, scenarioId: string, note: string | undefined, expectedVersion: number | undefined): Promise<ZunoScenario>;
    private shape;
    private isSupported;
    private deduplicate;
    private isSemanticDuplicate;
    private assess;
    private deriveSharedPreparation;
    private buildDiff;
    private buildPayload;
    private probabilityLabel;
    private rejectedPaths;
    private recordBlocked;
}
