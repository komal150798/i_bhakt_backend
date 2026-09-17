import { ZunoEventType } from '../common/enums';
export declare const SCENARIO_EVENT_TYPES: {
    readonly SCENARIO_SET_GENERATED: "zuno.scenario.set_generated";
    readonly SCENARIO_CHANGED: "zuno.scenario.changed";
    readonly SCENARIO_TRIGGERED: "zuno.scenario.triggered";
    readonly WHAT_IF_EXPLORED: "zuno.what_if.explored";
};
export type ScenarioEventName = (typeof SCENARIO_EVENT_TYPES)[keyof typeof SCENARIO_EVENT_TYPES];
export declare function scenarioEvent(name: ScenarioEventName): ZunoEventType;
