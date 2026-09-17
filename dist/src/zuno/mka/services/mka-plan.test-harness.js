"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeEntityManager = exports.FakeRepository = void 0;
exports.fakeDataSource = fakeDataSource;
exports.realSafety = realSafety;
exports.realOutbox = realOutbox;
exports.realAudit = realAudit;
exports.realOwnership = realOwnership;
exports.fixedClock = fixedClock;
exports.fakeRulebook = fakeRulebook;
const crypto_1 = require("crypto");
const typeorm_1 = require("typeorm");
const request_context_service_1 = require("../../common/services/request-context.service");
const outbox_service_1 = require("../../common/services/outbox.service");
const zuno_audit_service_1 = require("../../common/services/zuno-audit.service");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const clock_service_1 = require("../../common/services/clock.service");
const safety_service_1 = require("../../safety/services/safety.service");
const safety_signal_detector_1 = require("../../safety/services/safety-signal-detector");
function matches(row, where) {
    return Object.entries(where).every(([key, expected]) => {
        const actual = row[key];
        if (expected instanceof typeorm_1.FindOperator) {
            switch (expected.type) {
                case 'isNull':
                    return actual === null || actual === undefined;
                case 'in':
                    return expected.value.includes(actual);
                case 'not': {
                    const inner = expected.child;
                    if (inner && inner.type === 'isNull') {
                        return actual !== null && actual !== undefined;
                    }
                    return actual !== expected.value;
                }
                default:
                    throw new Error(`FakeRepository does not implement the "${expected.type}" operator.`);
            }
        }
        return actual === expected;
    });
}
function applyOrder(rows, order) {
    if (!order)
        return rows;
    const entries = Object.entries(order);
    return [...rows].sort((a, b) => {
        for (const [key, direction] of entries) {
            const dir = String(direction).toUpperCase() === 'DESC' ? -1 : 1;
            const av = a[key];
            const bv = b[key];
            if (av === bv)
                continue;
            if (av === null || av === undefined)
                return 1;
            if (bv === null || bv === undefined)
                return -1;
            return (av > bv ? 1 : -1) * dir;
        }
        return 0;
    });
}
class FakeRepository {
    constructor(defaults = {}) {
        this.defaults = defaults;
        this.rows = [];
    }
    create(input) {
        return { ...this.defaults, ...input };
    }
    async findOne(options) {
        const found = applyOrder(this.rows.filter((row) => matches(row, options.where ?? {})), options.order);
        return found[0] ?? null;
    }
    async find(options = {}) {
        const found = applyOrder(this.rows.filter((row) => matches(row, options.where ?? {})), options.order);
        return options.take ? found.slice(0, options.take) : found;
    }
    async count(options = {}) {
        return this.rows.filter((row) => matches(row, options.where ?? {})).length;
    }
    async save(input) {
        if (Array.isArray(input))
            return input.map((one) => this.saveOne(one));
        return this.saveOne(input);
    }
    async update(criteria, patch) {
        for (const row of this.rows) {
            if (matches(row, criteria))
                Object.assign(row, patch);
        }
    }
    saveOne(input) {
        const existingIndex = input.id
            ? this.rows.findIndex((row) => row.id === input.id)
            : -1;
        if (existingIndex >= 0) {
            Object.assign(this.rows[existingIndex], input);
            if (typeof this.rows[existingIndex].version === 'number') {
                this.rows[existingIndex].version += 1;
            }
            return this.rows[existingIndex];
        }
        const row = {
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
            version: 1,
            ...input,
            id: input.id ?? (0, crypto_1.randomUUID)(),
        };
        this.rows.push(row);
        return row;
    }
    asRepository() {
        return this;
    }
}
exports.FakeRepository = FakeRepository;
class FakeEntityManager {
    constructor(registry) {
        this.registry = registry;
    }
    repo(entity) {
        const found = this.registry.get(entity);
        if (!found) {
            const name = entity?.name ?? String(entity);
            throw new Error(`FakeEntityManager has no repository registered for ${name}`);
        }
        return found;
    }
    create(entity, input) {
        return this.repo(entity).create(input);
    }
    async save(entity, input) {
        return this.repo(entity).save(input);
    }
    async find(entity, options = {}) {
        return this.repo(entity).find(options);
    }
    async findOne(entity, options = {}) {
        return this.repo(entity).findOne(options);
    }
    async count(entity, options = {}) {
        return this.repo(entity).count(options);
    }
    async update(entity, criteria, patch) {
        return this.repo(entity).update(criteria, patch);
    }
    asEntityManager() {
        return this;
    }
}
exports.FakeEntityManager = FakeEntityManager;
function fakeDataSource(manager) {
    return {
        transaction: async (work) => work(manager.asEntityManager()),
    };
}
function realSafety() {
    return new safety_service_1.SafetyService(new safety_signal_detector_1.SafetySignalDetector());
}
function realOutbox() {
    return new outbox_service_1.OutboxService(new request_context_service_1.RequestContextService());
}
function realAudit() {
    return new zuno_audit_service_1.ZunoAuditService(new request_context_service_1.RequestContextService());
}
function realOwnership() {
    return new zuno_ownership_service_1.ZunoOwnershipService();
}
function fixedClock(iso = '2026-09-17T09:00:00.000Z') {
    return new clock_service_1.FixedClockService(new Date(iso));
}
function fakeRulebook(options = {}) {
    const active = options.active ?? null;
    return {
        async getActive() {
            return active
                ? { ...active, activatedAt: new Date(), hash: 'test-hash' }
                : null;
        },
        async requireActive() {
            if (!active)
                throw new Error('no active rulebook');
            return { ...active, activatedAt: new Date(), hash: 'test-hash' };
        },
        async isAstrologyAvailable() {
            return active !== null;
        },
        async findRules() {
            if (options.throwUnavailable) {
                const { ZunoException } = await Promise.resolve().then(() => require('../../common/errors/zuno.exception'));
                const { ZunoErrorCode } = await Promise.resolve().then(() => require('../../common/errors/error-codes.enum'));
                throw new ZunoException(ZunoErrorCode.RULEBOOK_UNAVAILABLE, {});
            }
            return options.rules ?? [];
        },
        async findRemedies() {
            return options.remedies ?? [];
        },
    };
}
//# sourceMappingURL=mka-plan.test-harness.js.map