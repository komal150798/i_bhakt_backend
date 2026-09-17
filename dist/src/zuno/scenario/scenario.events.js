"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCENARIO_EVENT_TYPES = void 0;
exports.scenarioEvent = scenarioEvent;
exports.SCENARIO_EVENT_TYPES = {
    SCENARIO_SET_GENERATED: 'zuno.scenario.set_generated',
    SCENARIO_CHANGED: 'zuno.scenario.changed',
    SCENARIO_TRIGGERED: 'zuno.scenario.triggered',
    WHAT_IF_EXPLORED: 'zuno.what_if.explored',
};
function scenarioEvent(name) {
    return name;
}
//# sourceMappingURL=scenario.events.js.map