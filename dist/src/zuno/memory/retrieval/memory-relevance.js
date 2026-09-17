"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVE_STATUS = exports.RETRIEVABLE_STATUSES = exports.PURPOSE_TYPE_PRIORITY = exports.RELEVANCE_WEIGHTS = exports.MEMORY_CONFIDENCE_FLOOR = exports.DEFAULT_MIN_RELEVANCE_SCORE = exports.DEFAULT_MEMORY_CHAR_BUDGET = exports.MAX_MEMORY_ITEMS_CEILING = exports.DEFAULT_MAX_MEMORY_ITEMS = void 0;
exports.admissibility = admissibility;
exports.scoreMemory = scoreMemory;
exports.selectRelevantMemories = selectRelevantMemories;
exports.purposeScore = purposeScore;
exports.recencyScore = recencyScore;
const memory_enum_1 = require("../enums/memory.enum");
exports.DEFAULT_MAX_MEMORY_ITEMS = 12;
exports.MAX_MEMORY_ITEMS_CEILING = 25;
exports.DEFAULT_MEMORY_CHAR_BUDGET = 1600;
exports.DEFAULT_MIN_RELEVANCE_SCORE = 0.35;
exports.MEMORY_CONFIDENCE_FLOOR = 0.3;
exports.RELEVANCE_WEIGHTS = Object.freeze({
    purpose: 0.3,
    scope: 0.2,
    authority: 0.15,
    importance: 0.15,
    confidence: 0.1,
    recency: 0.1,
});
const MAX_AUTHORITY = 100;
exports.PURPOSE_TYPE_PRIORITY = {
    [memory_enum_1.MemoryRequestContext.CAREER_WEEKLY_REVIEW]: [
        memory_enum_1.MemoryType.DECISION,
        memory_enum_1.MemoryType.PROGRESS,
        memory_enum_1.MemoryType.COMMITMENT,
        memory_enum_1.MemoryType.GOAL,
        memory_enum_1.MemoryType.CONSTRAINT,
        memory_enum_1.MemoryType.PREFERENCE,
        memory_enum_1.MemoryType.PATTERN,
    ],
    [memory_enum_1.MemoryRequestContext.CHALLENGE_GUIDANCE]: [
        memory_enum_1.MemoryType.CHALLENGE,
        memory_enum_1.MemoryType.DECISION,
        memory_enum_1.MemoryType.CONSTRAINT,
        memory_enum_1.MemoryType.GOAL,
        memory_enum_1.MemoryType.COMMITMENT,
        memory_enum_1.MemoryType.PREFERENCE,
        memory_enum_1.MemoryType.LIFE_EVENT,
    ],
    [memory_enum_1.MemoryRequestContext.FUTURE_SELF_DAILY]: [
        memory_enum_1.MemoryType.COMMITMENT,
        memory_enum_1.MemoryType.PROGRESS,
        memory_enum_1.MemoryType.PLAN_CONTEXT,
        memory_enum_1.MemoryType.TEMPORARY_CONTEXT,
        memory_enum_1.MemoryType.PREFERENCE,
    ],
    [memory_enum_1.MemoryRequestContext.FUTURE_SELF_WEEKLY]: [
        memory_enum_1.MemoryType.PROGRESS,
        memory_enum_1.MemoryType.DECISION,
        memory_enum_1.MemoryType.COMMITMENT,
        memory_enum_1.MemoryType.CHALLENGE,
        memory_enum_1.MemoryType.GOAL,
        memory_enum_1.MemoryType.CONSTRAINT,
        memory_enum_1.MemoryType.PREFERENCE,
    ],
    [memory_enum_1.MemoryRequestContext.FUTURE_SELF_MILESTONE]: [
        memory_enum_1.MemoryType.LIFE_EVENT,
        memory_enum_1.MemoryType.PROGRESS,
        memory_enum_1.MemoryType.DECISION,
        memory_enum_1.MemoryType.GOAL,
        memory_enum_1.MemoryType.CHALLENGE,
    ],
    [memory_enum_1.MemoryRequestContext.FUTURE_SELF_REALIGNMENT]: [
        memory_enum_1.MemoryType.LIFE_EVENT,
        memory_enum_1.MemoryType.DECISION,
        memory_enum_1.MemoryType.PLAN_CONTEXT,
        memory_enum_1.MemoryType.CONSTRAINT,
        memory_enum_1.MemoryType.GOAL,
    ],
    [memory_enum_1.MemoryRequestContext.FUTURE_SELF_REFLECTION]: [
        memory_enum_1.MemoryType.PATTERN,
        memory_enum_1.MemoryType.PROGRESS,
        memory_enum_1.MemoryType.DECISION,
        memory_enum_1.MemoryType.GOAL,
        memory_enum_1.MemoryType.PREFERENCE,
    ],
    [memory_enum_1.MemoryRequestContext.PLAN_GENERATION]: [
        memory_enum_1.MemoryType.CONSTRAINT,
        memory_enum_1.MemoryType.DECISION,
        memory_enum_1.MemoryType.GOAL,
        memory_enum_1.MemoryType.PREFERENCE,
        memory_enum_1.MemoryType.COMMITMENT,
        memory_enum_1.MemoryType.PATTERN,
    ],
    [memory_enum_1.MemoryRequestContext.USER_MEMORY_VIEW]: [],
};
function admissibility(memory, query, now) {
    if (memory.user_id !== query.userId)
        return 'NOT_OWNED';
    if (!memory_enum_1.RETRIEVABLE_MEMORY_STATUSES.includes(memory.status))
        return 'NOT_ACTIVE';
    if (memory.redacted_at)
        return 'REDACTED';
    if (memory.deleted_at)
        return 'SOFT_DELETED';
    if (memory.expires_at && memory.expires_at.getTime() <= now.getTime()) {
        return 'EXPIRED';
    }
    const allowedFactualities = query.includeFactualities ?? [];
    if (memory_enum_1.NON_FACTUAL_FACTUALITIES.includes(memory.factuality) &&
        !allowedFactualities.includes(memory.factuality)) {
        return 'NON_FACTUAL';
    }
    const ceiling = query.maxSensitivity ?? memory_enum_1.MemorySensitivity.STANDARD;
    if (memory_enum_1.SENSITIVITY_RANK[memory.sensitivity_class] > memory_enum_1.SENSITIVITY_RANK[ceiling]) {
        return 'TOO_SENSITIVE';
    }
    if (memory.scope === memory_enum_1.MemoryScope.CHALLENGE && memory.challenge_id) {
        if (query.challengeId && memory.challenge_id !== query.challengeId) {
            return 'OTHER_CHALLENGE';
        }
        if (!query.challengeId &&
            (query.closedChallengeIds ?? []).includes(memory.challenge_id)) {
            return 'CLOSED_CHALLENGE';
        }
        if (!query.challengeId && query.closedChallengeIds === undefined) {
            return 'OTHER_CHALLENGE';
        }
    }
    if (query.memoryTypes && query.memoryTypes.length > 0) {
        if (!query.memoryTypes.includes(memory.memory_type)) {
            return 'TYPE_NOT_REQUESTED';
        }
    }
    if (toNumber(memory.confidence) < exports.MEMORY_CONFIDENCE_FLOOR) {
        return 'BELOW_CONFIDENCE_FLOOR';
    }
    return null;
}
function scoreMemory(memory, query, now) {
    const purpose = purposeScore(memory.memory_type, query.requestContext);
    const scope = scopeScore(memory, query);
    const authority = (memory_enum_1.MEMORY_SOURCE_AUTHORITY[memory.source] ?? 40) / MAX_AUTHORITY;
    const importance = memory_enum_1.RETENTION_IMPORTANCE[memory.retention_class] ??
        memory_enum_1.RETENTION_IMPORTANCE[memory_enum_1.MemoryRetentionClass.SHORT_TERM];
    const confidence = clamp01(toNumber(memory.confidence));
    const recency = recencyScore(memory, now);
    const lexical = lexicalScore(memory, query.queryTerms);
    const weighted = exports.RELEVANCE_WEIGHTS.purpose * purpose +
        exports.RELEVANCE_WEIGHTS.scope * scope +
        exports.RELEVANCE_WEIGHTS.authority * authority +
        exports.RELEVANCE_WEIGHTS.importance * importance +
        exports.RELEVANCE_WEIGHTS.confidence * confidence +
        exports.RELEVANCE_WEIGHTS.recency * recency;
    const score = clamp01(weighted + lexical * 0.05);
    return {
        memory,
        score,
        factors: { purpose, scope, authority, importance, confidence, recency, lexical },
    };
}
function selectRelevantMemories(memories, query) {
    const now = query.now ?? new Date();
    const maxItems = Math.min(Math.max(1, query.maxItems ?? exports.DEFAULT_MAX_MEMORY_ITEMS), exports.MAX_MEMORY_ITEMS_CEILING);
    const charBudget = query.charBudget ?? exports.DEFAULT_MEMORY_CHAR_BUDGET;
    const minScore = query.minScore ?? exports.DEFAULT_MIN_RELEVANCE_SCORE;
    const perTypeCap = Math.max(1, Math.ceil(maxItems / 2));
    const admissible = memories.filter((memory) => admissibility(memory, query, now) === null);
    const scored = admissible
        .map((memory) => scoreMemory(memory, query, now))
        .filter((entry) => entry.score >= minScore)
        .sort((a, b) => {
        if (b.score !== a.score)
            return b.score - a.score;
        const authorityDelta = b.factors.authority - a.factors.authority;
        if (authorityDelta !== 0)
            return authorityDelta;
        const recencyDelta = b.factors.recency - a.factors.recency;
        if (recencyDelta !== 0)
            return recencyDelta;
        return a.memory.id < b.memory.id ? -1 : 1;
    });
    const perType = new Map();
    const items = [];
    let chars = 0;
    for (const entry of scored) {
        if (items.length >= maxItems)
            break;
        const typeCount = perType.get(entry.memory.memory_type) ?? 0;
        if (typeCount >= perTypeCap)
            continue;
        const cost = (entry.memory.memory_value?.statement ?? '').length + 1;
        if (chars + cost > charBudget && items.length > 0)
            continue;
        items.push(entry);
        perType.set(entry.memory.memory_type, typeCount + 1);
        chars += cost;
    }
    return {
        items,
        consideredCount: admissible.length,
        droppedCount: admissible.length - items.length,
        charBudgetUsed: chars,
    };
}
function purposeScore(type, requestContext) {
    const priority = exports.PURPOSE_TYPE_PRIORITY[requestContext] ?? [];
    if (priority.length === 0)
        return 0.6;
    const rank = priority.indexOf(type);
    if (rank < 0)
        return 0.25;
    const step = 0.75 / Math.max(1, priority.length - 1);
    return clamp01(1 - rank * step);
}
function scopeScore(memory, query) {
    if (memory.scope === memory_enum_1.MemoryScope.CHALLENGE &&
        query.challengeId &&
        memory.challenge_id === query.challengeId) {
        return 1;
    }
    if (memory.scope === memory_enum_1.MemoryScope.GLOBAL)
        return 0.6;
    return 0.4;
}
function recencyScore(memory, now) {
    const halfLife = memory_enum_1.RETENTION_RECENCY_HALF_LIFE_DAYS[memory.retention_class] ??
        memory_enum_1.RETENTION_RECENCY_HALF_LIFE_DAYS[memory_enum_1.MemoryRetentionClass.SHORT_TERM];
    if (!Number.isFinite(halfLife))
        return 1;
    const anchor = memory.last_confirmed_at ?? memory.updated_at ?? memory.created_at;
    if (!anchor)
        return 0.5;
    const ageDays = Math.max(0, (now.getTime() - new Date(anchor).getTime()) / 86_400_000);
    return clamp01(Math.pow(0.5, ageDays / halfLife));
}
function lexicalScore(memory, queryTerms) {
    if (!queryTerms || queryTerms.length === 0)
        return 0;
    const haystack = [
        memory.memory_value?.statement ?? '',
        memory.memory_value?.label ?? '',
        memory.memory_key,
    ]
        .join(' ')
        .toLowerCase();
    let hits = 0;
    for (const term of queryTerms) {
        const normalised = term.trim().toLowerCase();
        if (normalised.length < 4)
            continue;
        if (haystack.includes(normalised))
            hits++;
    }
    return clamp01(hits / Math.max(1, queryTerms.length));
}
function toNumber(value) {
    if (value === null || value === undefined)
        return 0;
    const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}
function clamp01(value) {
    if (!Number.isFinite(value))
        return 0;
    if (value < 0)
        return 0;
    if (value > 1)
        return 1;
    return value;
}
exports.RETRIEVABLE_STATUSES = memory_enum_1.RETRIEVABLE_MEMORY_STATUSES;
exports.ACTIVE_STATUS = memory_enum_1.MemoryStatus.ACTIVE;
//# sourceMappingURL=memory-relevance.js.map