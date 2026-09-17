import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ZunoLifeSignal } from './zuno-life-signal.entity';
import { SignalConfirmationActor, SignalConfirmationStatus } from '../enums';
export declare class ZunoLifeSignalConfirmation extends ZunoImmutableEntity {
    life_signal_id: string;
    user_id: string;
    from_status: SignalConfirmationStatus;
    to_status: SignalConfirmationStatus;
    actor_type: SignalConfirmationActor;
    actor_id: string | null;
    prompt_text: string | null;
    response_note: string | null;
    signal?: ZunoLifeSignal;
}
