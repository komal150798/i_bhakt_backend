import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoScenario } from './zuno-scenario.entity';
import { ScenarioConditionType } from '../enums/scenario.enum';
export declare class ZunoScenarioCondition extends ZunoBaseEntity {
    scenario_id: string;
    user_id: string;
    condition_type: ScenarioConditionType;
    description: string;
    signal_definition: Record<string, unknown>;
    scenario?: ZunoScenario;
}
