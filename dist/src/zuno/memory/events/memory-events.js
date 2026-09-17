"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryAggregateType = exports.MemoryEventType = void 0;
exports.asEventType = asEventType;
exports.asAggregateType = asAggregateType;
exports.MemoryEventType = {
    CANDIDATE_CREATED: 'zuno.memory.candidate_created',
    CREATED: 'zuno.memory.created',
    UPDATED: 'zuno.memory.updated',
    SUPERSEDED: 'zuno.memory.superseded',
    EXPIRED: 'zuno.memory.expired',
    DELETED: 'zuno.memory.deleted',
    CONFLICT_DETECTED: 'zuno.memory.conflict_detected',
    CORRECTED: 'zuno.memory.corrected',
    PATTERN_CANDIDATE_CREATED: 'zuno.pattern.candidate_created',
    PATTERN_CONFIRMED: 'zuno.pattern.confirmed',
    FUTURE_SELF_GENERATED: 'zuno.future_self.generated',
    FUTURE_SELF_VIEWED: 'zuno.future_self.viewed',
    FUTURE_SELF_FEEDBACK_RECEIVED: 'zuno.future_self.feedback_received',
};
exports.MemoryAggregateType = {
    MEMORY: 'MEMORY',
    MEMORY_CANDIDATE: 'MEMORY_CANDIDATE',
    FUTURE_SELF: 'FUTURE_SELF',
};
function asEventType(value) {
    return value;
}
function asAggregateType(value) {
    return value;
}
//# sourceMappingURL=memory-events.js.map