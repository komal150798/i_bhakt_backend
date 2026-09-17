"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OutboxService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxService = void 0;
const common_1 = require("@nestjs/common");
const zuno_event_outbox_entity_1 = require("../entities/zuno-event-outbox.entity");
const enums_1 = require("../enums");
const request_context_service_1 = require("./request-context.service");
let OutboxService = OutboxService_1 = class OutboxService {
    constructor(requestContext) {
        this.requestContext = requestContext;
        this.logger = new common_1.Logger(OutboxService_1.name);
    }
    async enqueue(manager, event) {
        const row = manager.create(zuno_event_outbox_entity_1.ZunoEventOutbox, {
            aggregate_type: event.aggregateType,
            aggregate_id: event.aggregateId,
            event_type: event.eventType,
            event_version: event.eventVersion ?? '1',
            payload: this.assertNoSensitiveKeys(event.payload),
            status: enums_1.OutboxStatus.PENDING,
            published_at: null,
            retry_count: 0,
            last_error: null,
            request_id: this.requestContext.get()?.requestId ?? null,
        });
        return manager.save(zuno_event_outbox_entity_1.ZunoEventOutbox, row);
    }
    async enqueueMany(manager, events) {
        for (const event of events) {
            await this.enqueue(manager, event);
        }
    }
    assertNoSensitiveKeys(payload) {
        const forbidden = [
            'raw_user_statement',
            'statement',
            'date_of_birth',
            'time_of_birth',
            'latitude',
            'longitude',
            'password',
            'token',
            'content',
            'message',
        ];
        const offending = Object.keys(payload).filter((key) => forbidden.includes(key));
        if (offending.length > 0) {
            this.logger.warn(`Outbox payload contained disallowed key(s): ${offending.join(', ')}. Dropping them; publish ids instead.`);
            const cleaned = { ...payload };
            for (const key of offending)
                delete cleaned[key];
            return cleaned;
        }
        return payload;
    }
};
exports.OutboxService = OutboxService;
exports.OutboxService = OutboxService = OutboxService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [request_context_service_1.RequestContextService])
], OutboxService);
//# sourceMappingURL=outbox.service.js.map