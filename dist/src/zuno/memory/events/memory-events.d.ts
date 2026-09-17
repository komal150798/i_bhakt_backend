import { ZunoAggregateType, ZunoEventType } from '../../common/enums';
export declare const MemoryEventType: {
    readonly CANDIDATE_CREATED: "zuno.memory.candidate_created";
    readonly CREATED: "zuno.memory.created";
    readonly UPDATED: "zuno.memory.updated";
    readonly SUPERSEDED: "zuno.memory.superseded";
    readonly EXPIRED: "zuno.memory.expired";
    readonly DELETED: "zuno.memory.deleted";
    readonly CONFLICT_DETECTED: "zuno.memory.conflict_detected";
    readonly CORRECTED: "zuno.memory.corrected";
    readonly PATTERN_CANDIDATE_CREATED: "zuno.pattern.candidate_created";
    readonly PATTERN_CONFIRMED: "zuno.pattern.confirmed";
    readonly FUTURE_SELF_GENERATED: "zuno.future_self.generated";
    readonly FUTURE_SELF_VIEWED: "zuno.future_self.viewed";
    readonly FUTURE_SELF_FEEDBACK_RECEIVED: "zuno.future_self.feedback_received";
};
export type MemoryEventTypeValue = (typeof MemoryEventType)[keyof typeof MemoryEventType];
export declare const MemoryAggregateType: {
    readonly MEMORY: "MEMORY";
    readonly MEMORY_CANDIDATE: "MEMORY_CANDIDATE";
    readonly FUTURE_SELF: "FUTURE_SELF";
};
export type MemoryAggregateTypeValue = (typeof MemoryAggregateType)[keyof typeof MemoryAggregateType];
export declare function asEventType(value: MemoryEventTypeValue): ZunoEventType;
export declare function asAggregateType(value: MemoryAggregateTypeValue): ZunoAggregateType;
