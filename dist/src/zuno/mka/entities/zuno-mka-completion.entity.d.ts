import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { MkaCompletionSource, MkaCompletionStatus } from '../enums/mka.enum';
export declare class ZunoMkaCompletion extends ZunoImmutableEntity {
    mka_item_id: string;
    mka_program_id: string;
    user_id: string;
    completion_date: string;
    status: MkaCompletionStatus;
    user_note: string | null;
    source: MkaCompletionSource;
    karma_eligible: boolean;
}
