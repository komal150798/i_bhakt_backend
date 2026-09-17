"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KARMA_ACTION_LABEL_MAX_LENGTH = exports.NullKarmaSourceAdapter = exports.KARMA_SOURCE_PORT = exports.KARMA_CONSUMED_EVENT_TYPES = exports.KARMA_ACTION_COMPLETED_EVENTS = void 0;
exports.validateActionCompletedPayload = validateActionCompletedPayload;
const karma_enum_1 = require("../enums/karma.enum");
exports.KARMA_ACTION_COMPLETED_EVENTS = {
    PLAN_ITEM_COMPLETED: 'zuno.plan_item.completed',
    MKA_ITEM_COMPLETED: 'zuno.mka_item.completed',
};
exports.KARMA_CONSUMED_EVENT_TYPES = Object.values(exports.KARMA_ACTION_COMPLETED_EVENTS);
exports.KARMA_SOURCE_PORT = Symbol('KARMA_SOURCE_PORT');
class NullKarmaSourceAdapter {
    async describeCompletedAction() {
        return null;
    }
}
exports.NullKarmaSourceAdapter = NullKarmaSourceAdapter;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
exports.KARMA_ACTION_LABEL_MAX_LENGTH = 200;
function validateActionCompletedPayload(payload) {
    const problems = [];
    if (!payload || typeof payload !== 'object') {
        return ['payload is not an object'];
    }
    const value = payload;
    if (typeof value.event_id !== 'string' || value.event_id.length === 0) {
        problems.push('event_id');
    }
    if (typeof value.user_id !== 'string' || !UUID_PATTERN.test(value.user_id)) {
        problems.push('user_id');
    }
    if (value.source !== karma_enum_1.KarmaEntrySource.PLAN_COMPLETION &&
        value.source !== karma_enum_1.KarmaEntrySource.MKA_COMPLETION) {
        problems.push('source');
    }
    if (typeof value.outcome !== 'string' ||
        !Object.values(karma_enum_1.KarmaActionOutcome).includes(value.outcome)) {
        problems.push('outcome');
    }
    if (typeof value.completed_at !== 'string' ||
        Number.isNaN(Date.parse(value.completed_at))) {
        problems.push('completed_at');
    }
    if (typeof value.karma_ledger_eligible !== 'boolean') {
        problems.push('karma_ledger_eligible');
    }
    const hasPlan = typeof value.plan_item_id === 'string';
    const hasMka = typeof value.mka_item_id === 'string';
    if (hasPlan === hasMka) {
        problems.push('plan_item_id|mka_item_id');
    }
    else if ((value.source === karma_enum_1.KarmaEntrySource.PLAN_COMPLETION && !hasPlan) ||
        (value.source === karma_enum_1.KarmaEntrySource.MKA_COMPLETION && !hasMka)) {
        problems.push('source/reference mismatch');
    }
    return problems;
}
//# sourceMappingURL=karma-source.port.js.map