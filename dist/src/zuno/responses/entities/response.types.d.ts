import { ResponseSectionType, SectionEmphasis } from '../../common/enums';
export interface ZunoResponseSection<TPayload = unknown> {
    id: string;
    type: ResponseSectionType;
    order: number;
    title?: string;
    emphasis: SectionEmphasis;
    payload: TPayload;
}
export interface ZunoResponsePayload {
    title: string;
    sections: ZunoResponseSection[];
}
export interface ContextValidationPayload {
    summary: string;
    understood: string[];
    concerns: string[];
    correction_invited: boolean;
}
export interface ClarificationPayload {
    questions: {
        id: string;
        question: string;
    }[];
    reason: string;
}
export interface KeyTakeawayPayload {
    headline: string;
    detail?: string;
}
export interface FocusPrioritiesPayload {
    priorities: {
        id: string;
        title: string;
        why: string;
    }[];
}
export interface SafetyBoundaryPayload {
    message: string;
    disposition: string;
    domain?: string;
    suggested_support?: string;
}
