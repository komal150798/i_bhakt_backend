"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordingAudit = exports.RecordingOutbox = exports.FakeEntityManager = exports.FakeRepository = exports.InMemoryStore = void 0;
exports.fakeDataSource = fakeDataSource;
const typeorm_1 = require("typeorm");
const crypto_1 = require("crypto");
class InMemoryStore {
    constructor() {
        this.tables = new Map();
    }
    rows(entityName) {
        if (!this.tables.has(entityName))
            this.tables.set(entityName, []);
        return this.tables.get(entityName);
    }
    seed(entityName, rows) {
        this.tables.set(entityName, rows);
    }
    clear() {
        this.tables.clear();
    }
}
exports.InMemoryStore = InMemoryStore;
function nameOf(target) {
    return typeof target === 'string' ? target : target.name;
}
function matches(row, where) {
    if (where === undefined || where === null)
        return true;
    if (Array.isArray(where)) {
        return where.some((clause) => matches(row, clause));
    }
    const clause = where;
    return Object.entries(clause).every(([key, expected]) => {
        const actual = row[key];
        if (expected instanceof typeorm_1.FindOperator) {
            return matchOperator(actual, expected);
        }
        if (expected instanceof Date && actual instanceof Date) {
            return expected.getTime() === actual.getTime();
        }
        return actual === expected;
    });
}
function matchOperator(actual, operator) {
    const type = operator.type;
    const value = operator.value;
    switch (type) {
        case 'isNull':
            return actual === null || actual === undefined;
        case 'not': {
            const inner = value;
            if (inner instanceof typeorm_1.FindOperator)
                return !matchOperator(actual, inner);
            return actual !== inner;
        }
        case 'in':
            return Array.isArray(value) && value.includes(actual);
        case 'lessThanOrEqual':
            return toTime(actual) <= toTime(value);
        case 'lessThan':
            return toTime(actual) < toTime(value);
        case 'moreThanOrEqual':
            return toTime(actual) >= toTime(value);
        case 'moreThan':
            return toTime(actual) > toTime(value);
        default:
            throw new Error(`InMemoryStore does not implement FindOperator "${type}"`);
    }
}
function toTime(value) {
    if (value instanceof Date)
        return value.getTime();
    if (typeof value === 'number')
        return value;
    if (typeof value === 'string')
        return new Date(value).getTime();
    return Number.NaN;
}
function applyOrder(rows, order) {
    if (!order)
        return rows;
    const entries = Object.entries(order);
    return [...rows].sort((a, b) => {
        for (const [key, direction] of entries) {
            const left = a[key];
            const right = b[key];
            if (left === right)
                continue;
            if (left === null || left === undefined)
                return 1;
            if (right === null || right === undefined)
                return -1;
            const cmp = toComparable(left) < toComparable(right) ? -1 : 1;
            return direction === 'DESC' ? -cmp : cmp;
        }
        return 0;
    });
}
function toComparable(value) {
    if (value instanceof Date)
        return value.getTime();
    if (typeof value === 'number')
        return value;
    return String(value);
}
class FakeRepository {
    constructor(store, entityName) {
        this.store = store;
        this.entityName = entityName;
    }
    create(entity) {
        return { ...entity };
    }
    async save(entity) {
        if (Array.isArray(entity)) {
            const saved = [];
            for (const one of entity)
                saved.push((await this.save(one)));
            return saved;
        }
        return persist(this.store, this.entityName, entity);
    }
    async find(options = {}) {
        const rows = this.store
            .rows(this.entityName)
            .filter((row) => matches(row, options.where));
        const ordered = applyOrder(rows, options.order);
        return (options.take ? ordered.slice(0, options.take) : ordered);
    }
    async findOne(options = {}) {
        const found = await this.find({ ...options, take: 1 });
        return found.length > 0 ? found[0] : null;
    }
    async count(options = {}) {
        return (await this.find(options)).length;
    }
}
exports.FakeRepository = FakeRepository;
class FakeEntityManager {
    constructor(store) {
        this.store = store;
    }
    create(target, entity) {
        return { ...entity };
    }
    async save(target, entity) {
        const name = nameOf(target);
        if (Array.isArray(entity)) {
            const saved = [];
            for (const one of entity) {
                saved.push(persist(this.store, name, one));
            }
            return saved;
        }
        return persist(this.store, name, entity);
    }
    async find(target, options = {}) {
        const rows = this.store
            .rows(nameOf(target))
            .filter((row) => matches(row, options.where));
        return applyOrder(rows, options.order);
    }
    async findOne(target, options = {}) {
        const found = await this.find(target, options);
        return found.length > 0 ? found[0] : null;
    }
    async delete(target, criteria) {
        const rows = this.store.rows(nameOf(target));
        const remaining = rows.filter((row) => !matches(row, criteria));
        this.store.seed(nameOf(target), remaining);
    }
}
exports.FakeEntityManager = FakeEntityManager;
function persist(store, entityName, entity) {
    const rows = store.rows(entityName);
    const now = new Date();
    if (!entity.id)
        entity.id = (0, crypto_1.randomUUID)();
    if (!entity.created_at)
        entity.created_at = now;
    entity.updated_at = now;
    if (entity.version === undefined)
        entity.version = 1;
    if (entity.deleted_at === undefined)
        entity.deleted_at = null;
    const index = rows.findIndex((row) => row.id === entity.id);
    if (index >= 0) {
        rows[index] = entity;
    }
    else {
        rows.push(entity);
    }
    return entity;
}
function fakeDataSource(store) {
    const manager = new FakeEntityManager(store);
    return {
        transaction: async (runner) => runner(manager),
    };
}
class RecordingOutbox {
    constructor() {
        this.events = [];
    }
    async enqueue(_manager, event) {
        this.events.push({
            eventType: String(event.eventType),
            aggregateId: event.aggregateId,
        });
    }
    async enqueueMany(manager, events) {
        for (const event of events)
            await this.enqueue(manager, event);
    }
    types() {
        return this.events.map((event) => event.eventType);
    }
}
exports.RecordingOutbox = RecordingOutbox;
class RecordingAudit {
    constructor() {
        this.actions = [];
    }
    async record(_manager, input) {
        this.actions.push(input.action);
    }
}
exports.RecordingAudit = RecordingAudit;
//# sourceMappingURL=memory-test-harness.js.map