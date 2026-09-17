import { MkaDimension } from '../../common/enums';
import { ZunoMkaItem } from '../entities/zuno-mka-item.entity';
import { ZunoMkaProgram } from '../entities/zuno-mka-program.entity';
import { ZunoMkaCompletion } from '../entities/zuno-mka-completion.entity';
import { MkaCompletionStatus, MkaFrequency, MkaPeriodType, MkaPriority, MkaProgramStatus } from '../enums/mka.enum';
export declare class GenerateMkaDto {
    challengeId: string;
    period?: MkaPeriodType;
    regenerate?: boolean;
}
export declare class CompleteMkaItemDto {
    date?: string;
    note?: string;
}
export declare class SkipMkaItemDto extends CompleteMkaItemDto {
}
export declare class ListMkaQueryDto {
    challengeId?: string;
}
export declare class MkaItemView {
    id: string;
    dimension: MkaDimension;
    title: string;
    description: string;
    purpose: string | null;
    frequency: MkaFrequency;
    durationMinutes: number | null;
    priority: MkaPriority;
    karmaEligible: boolean;
    planEligible: boolean;
    astrologyInformed: boolean;
    status: string;
    static from(item: ZunoMkaItem): MkaItemView;
}
export declare class MkaProgramView {
    programId: string;
    challengeId: string;
    status: MkaProgramStatus;
    periodType: MkaPeriodType;
    period: {
        start: string;
        end: string;
    };
    reviewAt: string | null;
    remedyStatus: string;
    items: MkaItemView[];
    static from(program: ZunoMkaProgram, items: ZunoMkaItem[]): MkaProgramView;
}
export declare class MkaCompletionView {
    id: string;
    itemId: string;
    completionDate: string;
    status: MkaCompletionStatus;
    karmaEligible: boolean;
    static from(completion: ZunoMkaCompletion): MkaCompletionView;
}
