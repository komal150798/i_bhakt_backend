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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZunoAuditService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const zuno_audit_event_entity_1 = require("../entities/zuno-audit-event.entity");
const request_context_service_1 = require("./request-context.service");
let ZunoAuditService = class ZunoAuditService {
    constructor(requestContext) {
        this.requestContext = requestContext;
    }
    async record(manager, input) {
        const row = manager.create(zuno_audit_event_entity_1.ZunoAuditEvent, {
            actor_type: input.actorType,
            actor_id: input.actorId ?? null,
            user_id: input.userId ?? null,
            action: input.action,
            entity_type: input.entityType,
            entity_id: input.entityId ?? null,
            before_hash: input.before === undefined ? null : hashValue(input.before),
            after_hash: input.after === undefined ? null : hashValue(input.after),
            metadata: {
                ...(input.metadata ?? {}),
                requestId: this.requestContext.get()?.requestId ?? null,
            },
            redacted_at: null,
        });
        await manager.save(zuno_audit_event_entity_1.ZunoAuditEvent, row);
    }
};
exports.ZunoAuditService = ZunoAuditService;
exports.ZunoAuditService = ZunoAuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [request_context_service_1.RequestContextService])
], ZunoAuditService);
function hashValue(value) {
    return (0, crypto_1.createHash)('sha256')
        .update(JSON.stringify(value ?? null))
        .digest('hex');
}
//# sourceMappingURL=zuno-audit.service.js.map