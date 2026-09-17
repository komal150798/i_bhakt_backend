import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ResponseType } from '../../common/enums';
import { ZunoResponsePayload } from './response.types';
export declare class ZunoResponse extends ZunoImmutableEntity {
    user_id: string;
    challenge_id: string | null;
    conversation_id: string | null;
    response_type: ResponseType;
    structured_payload: ZunoResponsePayload;
    rendered_text: string | null;
    context_version: number | null;
    model_version: string | null;
    prompt_version: string | null;
    engine_version: string;
    rulebook_version_id: string | null;
    safety_decision_id: string | null;
}
