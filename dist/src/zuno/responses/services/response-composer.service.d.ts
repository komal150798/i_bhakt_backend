import { ResponseDepth } from '../../common/enums';
import { ZunoResponsePayload } from '../entities/response.types';
import { ChallengeContextPayload } from '../../challenges/entities/challenge-context.types';
import { SafetyAssessment } from '../../safety/services/safety.service';
export declare const RESPONSE_COMPOSER_VERSION = "response-composer-1.0.0";
export interface ComposeInput {
    context: ChallengeContextPayload;
    clarificationRequired: boolean;
    responseDepth: ResponseDepth;
    safety: SafetyAssessment;
    preferredName?: string | null;
}
export declare class ResponseComposerService {
    compose(input: ComposeInput): ZunoResponsePayload;
    private contextSection;
    private clarificationSection;
    private takeawaySection;
    private prioritiesSection;
    private safetySection;
    private title;
    private itemLimit;
}
