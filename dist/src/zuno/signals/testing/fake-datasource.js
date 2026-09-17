"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeDataSource = exports.FakeRepository = exports.FakeEntityManager = exports.FakeStore = void 0;
const crypto_1 = require("crypto");
const typeorm_1 = require("typeorm");
class FakeStore {
    constructor() {
        this.tables = new Map();
    }
    table(entity) {
        const key = entity.name;
        if (!this.tables.has(key))
            this.tables.set(key, new Map());
        return this.tables.get(key);
    }
    rows(entity) {
        return Array.from(this.table(entity).values());
    }
    count(entity) {
        return this.table(entity).size;
    }
    seed(entity, row) {
        const stored = row;
        if (!stored.id)
            stored.id = (0, crypto_1.randomUUID)();
        this.table(entity).set(stored.id, stored);
        return row;
    }
}
exports.FakeStore = FakeStore;
class FakeEntityManager {
    constructor(store) {
        this.store = store;
        this.staged = [];
    }
    create(entity, data) {
        return Object.assign(new entity(), data);
    }
    async save(entity, data) {
        const rows = Array.isArray(data) ? data : [data];
        for (const row of rows) {
            const stored = row;
            if (!stored.id)
                stored.id = (0, crypto_1.randomUUID)();
            if (!stored.created_at)
                stored.created_at = new Date();
            stored.updated_at = new Date();
            if (stored.version === undefined)
                stored.version = 1;
            this.staged.push({ entity, row: stored });
        }
        return data;
    }
    async find(entity, options) {
        return queryRows(this.visible(entity), options);
    }
    async findOne(entity, options) {
        const rows = queryRows(this.visible(entity), options);
        return rows[0] ?? null;
    }
    async delete(entity, criteria) {
        for (const row of this.visible(entity)) {
            if (matchesWhere(row, criteria))
                this.store.table(entity).delete(row.id);
        }
    }
    visible(entity) {
        const committed = new Map(this.store.table(entity));
        for (const write of this.staged) {
            if (write.entity.name === entity.name)
                committed.set(write.row.id, write.row);
        }
        return Array.from(committed.values());
    }
    commit() {
        for (const write of this.staged) {
            this.store.table(write.entity).set(write.row.id, write.row);
        }
        this.staged.length = 0;
    }
}
exports.FakeEntityManager = FakeEntityManager;
class FakeRepository {
    constructor(store, entity) {
        this.store = store;
        this.entity = entity;
    }
    async find(options) {
        return queryRows(this.store.rows(this.entity), options);
    }
    async findOne(options) {
        const rows = queryRows(this.store.rows(this.entity), options);
        return rows[0] ?? null;
    }
    async save() {
        throw new Error(`FakeRepository.save called for ${this.entity.name}: this write would escape the enclosing transaction. Use the transaction's EntityManager.`);
    }
}
exports.FakeRepository = FakeRepository;
class FakeDataSource {
    constructor() {
        this.store = new FakeStore();
        this.transactionCount = 0;
        this.transaction = async (work) => {
            this.transactionCount += 1;
            const manager = new FakeEntityManager(this.store);
            const result = await work(manager);
            manager.commit();
            return result;
        };
    }
    getRepository(entity) {
        return new FakeRepository(this.store, entity);
    }
    repositoryFor(entity) {
        return new FakeRepository(this.store, entity);
    }
}
exports.FakeDataSource = FakeDataSource;
function queryRows(rows, options) {
    let result = rows;
    if (options?.where) {
        const clauses = Array.isArray(options.where) ? options.where : [options.where];
        result = result.filter((row) => clauses.some((clause) => matchesWhere(row, clause)));
    }
    if (options?.order) {
        const [field, direction] = Object.entries(options.order)[0];
        result = [...result].sort((a, b) => {
            const left = sortable(a[field]);
            const right = sortable(b[field]);
            if (left === right)
                return 0;
            const cmp = left < right ? -1 : 1;
            return direction === 'DESC' ? -cmp : cmp;
        });
    }
    if (options?.take !== undefined)
        result = result.slice(0, options.take);
    return result;
}
function sortable(value) {
    if (value instanceof Date)
        return value.getTime();
    if (typeof value === 'number' || typeof value === 'string')
        return value;
    return '';
}
function matchesWhere(row, where) {
    return Object.entries(where).every(([field, condition]) => matchesValue(row[field], condition));
}
function matchesValue(value, condition) {
    if (condition instanceof typeorm_1.FindOperator) {
        const operator = condition;
        switch (operator.type) {
            case 'in':
                return operator.value.includes(value);
            case 'not':
                return !matchesValue(value, operator.child ?? operator.value);
            case 'isNull':
                return value === null || value === undefined;
            case 'lessThan':
                return compare(value, operator.value) < 0;
            case 'moreThan':
                return compare(value, operator.value) > 0;
            default:
                throw new Error(`FakeDataSource: unsupported operator ${operator.type}`);
        }
    }
    if (condition === undefined)
        return true;
    return value === condition;
}
function compare(left, right) {
    const a = left instanceof Date ? left.getTime() : Number(left);
    const b = right instanceof Date ? right.getTime() : Number(right);
    if (a === b)
        return 0;
    return a < b ? -1 : 1;
}
//# sourceMappingURL=fake-datasource.js.map