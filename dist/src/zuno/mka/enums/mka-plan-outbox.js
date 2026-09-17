"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueMkaPlanEvent = enqueueMkaPlanEvent;
exports.enqueueMkaPlanEvents = enqueueMkaPlanEvents;
async function enqueueMkaPlanEvent(outbox, manager, event) {
    await outbox.enqueue(manager, {
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payload: event.payload,
        eventVersion: event.eventVersion,
    });
}
async function enqueueMkaPlanEvents(outbox, manager, events) {
    for (const event of events) {
        await enqueueMkaPlanEvent(outbox, manager, event);
    }
}
//# sourceMappingURL=mka-plan-outbox.js.map