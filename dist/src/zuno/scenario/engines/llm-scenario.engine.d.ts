import { ZunoAiGateway } from '../../ai/services/zuno-ai-gateway.service';
import { IScenarioEngine, ScenarioGenerationRequest, ScenarioGenerationResult } from '../ports/scenario.port';
export declare const SCENARIO_PROMPT_VERSION = "scenario-generate-v1.0.0";
export declare const SCENARIO_ENGINE_VERSION = "scenario-llm-1.0.0";
export declare class LlmScenarioEngine implements IScenarioEngine {
    private readonly gateway;
    private readonly logger;
    constructor(gateway: ZunoAiGateway);
    generate(request: ScenarioGenerationRequest): Promise<ScenarioGenerationResult>;
}
