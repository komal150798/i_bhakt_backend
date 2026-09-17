import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { ScenarioService } from '../services/scenario.service';
import { WhatIfService } from '../services/what-if.service';
import { GenerateScenariosDto, ListScenariosQueryDto, ScenarioDecisionDto, ScenarioSetView, ScenarioTriggeredDto, ScenarioView, WhatIfRequestDto, WhatIfView } from '../dtos/scenario.dtos';
export declare class ZunoScenarioController {
    private readonly scenarios;
    private readonly whatIf;
    private readonly idempotency;
    constructor(scenarios: ScenarioService, whatIf: WhatIfService, idempotency: IdempotencyService);
    generate(user: ZunoUser, dto: GenerateScenariosDto, idempotencyKey?: string): Promise<{
        scenarioSetId: string;
        challengeId: string;
        version: number;
        scenarios: ScenarioView[];
        sharedPreparation: string[];
        watchSignals: string[];
        decisionReadiness: string | null;
        generatedAt: string;
        astrologyAvailable: boolean;
    }>;
    list(user: ZunoUser, query: ListScenariosQueryDto): Promise<ScenarioSetView>;
    decide(user: ZunoUser, scenarioId: string, dto: ScenarioDecisionDto): Promise<ScenarioView>;
    triggered(user: ZunoUser, scenarioId: string, dto: ScenarioTriggeredDto): Promise<ScenarioView>;
    explore(user: ZunoUser, dto: WhatIfRequestDto, idempotencyKey?: string): Promise<{
        sessionId: string;
        mode: string;
        hypothetical: boolean;
        assumptions: string[];
        implications: string[];
        controllableFactors: string[];
        existingPreparationThatHelps: string[];
        recommendedPreparation: string[];
        impact: string;
        currentPlanChanged: boolean;
        notice: string;
        createdAt: string;
    }>;
    readWhatIf(user: ZunoUser, sessionId: string): Promise<WhatIfView>;
    discardWhatIf(user: ZunoUser, sessionId: string): Promise<{
        discarded: boolean;
    }>;
}
