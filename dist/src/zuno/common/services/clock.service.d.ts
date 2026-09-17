export declare class ClockService {
    now(): Date;
    nowIso(): string;
    today(): string;
}
export declare class FixedClockService extends ClockService {
    private current;
    constructor(current: Date);
    now(): Date;
    set(date: Date | string): void;
    advanceMs(ms: number): void;
}
