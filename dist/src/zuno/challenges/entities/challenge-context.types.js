"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.factsOnly = factsOnly;
exports.fearsAndAssumptions = fearsAndAssumptions;
exports.emptyContextPayload = emptyContextPayload;
const enums_1 = require("../../common/enums");
function factsOnly(items) {
    return items.filter((item) => item.type === enums_1.ContextItemType.FACT ||
        item.type === enums_1.ContextItemType.EXTERNAL_EVENT);
}
function fearsAndAssumptions(items) {
    return items.filter((item) => item.type === enums_1.ContextItemType.FEAR ||
        item.type === enums_1.ContextItemType.ASSUMPTION ||
        item.type === enums_1.ContextItemType.USER_BELIEF);
}
function emptyContextPayload() {
    return {
        summary: '',
        items: [],
        dependencies: [],
        desired_outcomes: [],
        decisions: [],
        factors: { controllable: [], external: [] },
        temporal_anchors: [],
        missing_information: [],
        emotional_signals: [],
        subthemes: [],
    };
}
//# sourceMappingURL=challenge-context.types.js.map