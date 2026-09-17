import { FutureSelfMode } from '../enums/future-self.enum';
import { ZunoFutureSelfNarrative } from '../entities/zuno-future-self-narrative.entity';
export declare class GenerateFutureSelfDto {
    challengeId?: string;
    mode: FutureSelfMode;
}
export declare class ListFutureSelfQueryDto {
    challengeId?: string;
    mode?: FutureSelfMode;
    limit?: number;
}
export declare class FutureSelfView {
    id: string;
    mode: FutureSelfMode;
    message: string;
    progressThemes: string[];
    openLoops: string[];
    strengthsObserved: string[];
    nextFocus: string[];
    challengeId: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    sourceCount: number;
    createdAt: string;
    static from(narrative: ZunoFutureSelfNarrative, sourceCount: number): FutureSelfView;
}
