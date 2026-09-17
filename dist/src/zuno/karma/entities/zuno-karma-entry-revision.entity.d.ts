import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { KarmaRevisionActor } from '../enums/karma.enum';
export declare class ZunoKarmaEntryRevision extends ZunoImmutableEntity {
    karma_entry_id: string;
    user_id: string;
    previous_value: Record<string, unknown>;
    new_value: Record<string, unknown>;
    changed_by: KarmaRevisionActor;
    reason: string | null;
    raw_text_changed: boolean;
}
