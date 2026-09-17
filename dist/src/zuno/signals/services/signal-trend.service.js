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
exports.SignalTrendService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_life_signal_entity_1 = require("../entities/zuno-life-signal.entity");
const clock_service_1 = require("../../common/services/clock.service");
const enums_1 = require("../enums");
let SignalTrendService = class SignalTrendService {
    constructor(signals, clock) {
        this.signals = signals;
        this.clock = clock;
    }
    async categoryTrends(userId, challengeId) {
        const rows = await this.signals.find({
            where: {
                user_id: userId,
                ...(challengeId ? { challenge_id: challengeId } : {}),
                deleted_at: (0, typeorm_2.IsNull)(),
            },
            order: { detected_at: 'ASC' },
            take: 1000,
        });
        const now = this.clock.now();
        const live = rows.filter((row) => row.status !== enums_1.LifeSignalStatus.ARCHIVED &&
            row.status !== enums_1.LifeSignalStatus.DISMISSED &&
            !this.isStale(row, now));
        const confirmed = live.filter((row) => (0, enums_1.isConfirmedSignal)(row.confirmation_status));
        const unconfirmed = live.filter((row) => !(0, enums_1.isConfirmedSignal)(row.confirmation_status));
        const categories = new Set([
            ...confirmed.map((row) => row.domain),
            ...unconfirmed.map((row) => row.domain),
        ]);
        const trends = Array.from(categories)
            .map((category) => this.buildTrend(category, confirmed.filter((row) => row.domain === category), unconfirmed.filter((row) => row.domain === category)))
            .sort((a, b) => b.confirmedCount - a.confirmedCount);
        return {
            trends,
            overall: this.direction(confirmed),
            totalConfirmed: confirmed.length,
            totalUnconfirmed: unconfirmed.length,
            generatedAt: now.toISOString(),
        };
    }
    buildTrend(category, confirmed, unconfirmed) {
        const improving = confirmed.filter((row) => this.polarity(row) > 0);
        const declining = confirmed.filter((row) => this.polarity(row) < 0);
        const material = confirmed
            .filter((row) => enums_1.MATERIALITY_RANK[row.materiality] >=
            enums_1.MATERIALITY_RANK[enums_1.LifeSignalMateriality.HIGH])
            .sort((a, b) => b.detected_at.getTime() - a.detected_at.getTime());
        return {
            category,
            direction: this.direction(confirmed),
            pattern: this.pattern(confirmed),
            confirmedCount: confirmed.length,
            improvingCount: improving.length,
            decliningCount: declining.length,
            unconfirmedCount: unconfirmed.length,
            lastMaterialChangeAt: material[0]?.detected_at.toISOString() ?? null,
            basis: 'CONFIRMED_ONLY',
        };
    }
    direction(confirmed) {
        if (confirmed.length < enums_1.TREND_MIN_OBSERVATIONS) {
            return enums_1.SignalTrendDirection.INSUFFICIENT_EVIDENCE;
        }
        const scores = confirmed.map((row) => this.polarity(row));
        const positive = scores.filter((score) => score > 0).length;
        const negative = scores.filter((score) => score < 0).length;
        if (positive === 0 && negative === 0)
            return enums_1.SignalTrendDirection.STEADY;
        if (positive > 0 && negative > 0) {
            const dominant = Math.max(positive, negative);
            const other = Math.min(positive, negative);
            if (dominant < other * 2)
                return enums_1.SignalTrendDirection.MIXED;
        }
        if (positive > negative)
            return enums_1.SignalTrendDirection.IMPROVING;
        if (negative > positive)
            return enums_1.SignalTrendDirection.DECLINING;
        return enums_1.SignalTrendDirection.STEADY;
    }
    pattern(confirmed) {
        if (confirmed.length <= 1)
            return enums_1.SignalPatternType.SINGLE_EVENT;
        const ordered = [...confirmed].sort((a, b) => a.detected_at.getTime() - b.detected_at.getTime());
        const scores = ordered.map((row) => this.polarity(row));
        const nonZero = scores.filter((score) => score !== 0);
        if (nonZero.length >= 2) {
            const last = nonZero[nonZero.length - 1];
            const earlier = nonZero.slice(0, -1);
            if (earlier.every((score) => Math.sign(score) === -Math.sign(last))) {
                return enums_1.SignalPatternType.REVERSAL;
            }
        }
        if (nonZero.length >= enums_1.TREND_MIN_OBSERVATIONS &&
            nonZero.every((score) => Math.sign(score) === Math.sign(nonZero[0]))) {
            return enums_1.SignalPatternType.TREND;
        }
        const types = new Set(ordered.map((row) => row.signal_type));
        if (types.size < ordered.length)
            return enums_1.SignalPatternType.REPEATED_PATTERN;
        if (ordered.some((row) => row.materiality === enums_1.LifeSignalMateriality.CRITICAL)) {
            return enums_1.SignalPatternType.MILESTONE;
        }
        return enums_1.SignalPatternType.SINGLE_EVENT;
    }
    polarity(signal) {
        if (signal.urgency_change === enums_1.UrgencyChange.DECREASE)
            return 1;
        if (signal.urgency_change === enums_1.UrgencyChange.INCREASE)
            return -1;
        switch (signal.signal_type) {
            case enums_1.LifeSignalType.OPPORTUNITY:
            case enums_1.LifeSignalType.PLAN_PROGRESS:
                return 1;
            case enums_1.LifeSignalType.SETBACK:
            case enums_1.LifeSignalType.PLAN_BLOCKER:
                return -1;
            default:
                return 0;
        }
    }
    isStale(signal, now) {
        if (signal.status === enums_1.LifeSignalStatus.STALE)
            return true;
        if (!signal.stale_after)
            return false;
        return signal.stale_after.getTime() <= now.getTime();
    }
};
exports.SignalTrendService = SignalTrendService;
exports.SignalTrendService = SignalTrendService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_life_signal_entity_1.ZunoLifeSignal)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        clock_service_1.ClockService])
], SignalTrendService);
//# sourceMappingURL=signal-trend.service.js.map