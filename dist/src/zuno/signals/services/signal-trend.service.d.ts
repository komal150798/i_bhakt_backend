import { Repository } from 'typeorm';
import { ZunoLifeSignal } from '../entities/zuno-life-signal.entity';
import { ClockService } from '../../common/services/clock.service';
import { ZunoDomain } from '../../common/enums';
import { SignalPatternType, SignalTrendDirection } from '../enums';
export interface CategoryTrend {
    category: ZunoDomain | null;
    direction: SignalTrendDirection;
    pattern: SignalPatternType;
    confirmedCount: number;
    improvingCount: number;
    decliningCount: number;
    unconfirmedCount: number;
    lastMaterialChangeAt: string | null;
    basis: 'CONFIRMED_ONLY';
}
export interface CategoryTrendsResult {
    trends: CategoryTrend[];
    overall: SignalTrendDirection;
    totalConfirmed: number;
    totalUnconfirmed: number;
    generatedAt: string;
}
export declare class SignalTrendService {
    private readonly signals;
    private readonly clock;
    constructor(signals: Repository<ZunoLifeSignal>, clock: ClockService);
    categoryTrends(userId: string, challengeId?: string | null): Promise<CategoryTrendsResult>;
    private buildTrend;
    private direction;
    private pattern;
    private polarity;
    private isStale;
}
