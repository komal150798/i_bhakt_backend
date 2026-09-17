import { SchemaValidation } from '../../ai/services/zuno-ai-gateway.service';
import { ScenarioGeneration } from '../ports/scenario.port';
export declare function validateScenarioGeneration(raw: unknown): SchemaValidation<ScenarioGeneration>;
