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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const zuno_idempotency_key_entity_1 = require("../entities/zuno-idempotency-key.entity");
const zuno_exception_1 = require("../errors/zuno.exception");
const error_codes_enum_1 = require("../errors/error-codes.enum");
const clock_service_1 = require("./clock.service");
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
let IdempotencyService = class IdempotencyService {
    constructor(keys, clock) {
        this.keys = keys;
        this.clock = clock;
    }
    async execute(params, work) {
        const { operation, key, userId, requestBody } = params;
        if (!key) {
            return work();
        }
        const requestHash = hashBody(requestBody);
        const existing = await this.keys.findOne({
            where: { operation, idempotency_key: key },
        });
        if (existing) {
            if (existing.request_hash !== requestHash) {
                throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
                    internalDetail: `idempotency key reused with a different request body for ${operation}`,
                });
            }
            if (existing.status === 'COMPLETED' && existing.response_reference) {
                return existing.response_reference;
            }
            if (existing.status === 'IN_PROGRESS') {
                throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.PROCESSING, {
                    internalDetail: `duplicate in-flight request for ${operation}`,
                });
            }
            await this.keys.delete({ id: existing.id });
        }
        const reservation = await this.keys.save(this.keys.create({
            operation,
            idempotency_key: key,
            user_id: userId,
            request_hash: requestHash,
            status: 'IN_PROGRESS',
            response_reference: null,
            expires_at: new Date(this.clock.now().getTime() + (params.ttlMs ?? DEFAULT_TTL_MS)),
        }));
        try {
            const result = await work();
            await this.keys.update({ id: reservation.id }, { status: 'COMPLETED', response_reference: result });
            return result;
        }
        catch (error) {
            await this.keys.update({ id: reservation.id }, { status: 'FAILED' });
            throw error;
        }
    }
};
exports.IdempotencyService = IdempotencyService;
exports.IdempotencyService = IdempotencyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_idempotency_key_entity_1.ZunoIdempotencyKey)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        clock_service_1.ClockService])
], IdempotencyService);
function hashBody(body) {
    return (0, crypto_1.createHash)('sha256')
        .update(JSON.stringify(body ?? null))
        .digest('hex');
}
//# sourceMappingURL=idempotency.service.js.map