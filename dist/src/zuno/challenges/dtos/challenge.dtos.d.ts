import { ChallengeStatus } from '../../common/enums';
import { ZunoChallenge } from '../entities/zuno-challenge.entity';
import { ZunoChallengeContext } from '../entities/zuno-challenge-context.entity';
import { ZunoResponse } from '../../responses/entities/zuno-response.entity';
export declare class CreateChallengeDto {
    statement: string;
}
export declare class ResolveChallengeDto {
    note?: string;
    version?: number;
}
export declare class ReopenChallengeDto {
    version?: number;
}
export declare class ListChallengesQueryDto {
    status?: ChallengeStatus;
    limit?: number;
    cursor?: string;
}
export declare class ChallengeView {
    id: string;
    title: string | null;
    status: ChallengeStatus;
    primaryDomain: string | null;
    theme: string | null;
    mode: string | null;
    urgency: string | null;
    contextVersion: number;
    version: number;
    openedAt: string;
    resolvedAt: string | null;
    static from(challenge: ZunoChallenge): ChallengeView;
}
export declare class ChallengeDetailView extends ChallengeView {
    summary: string | null;
    clarificationRequired: boolean;
    understood: string[];
    concerns: string[];
    static fromDetail(challenge: ZunoChallenge, context: ZunoChallengeContext | null): ChallengeDetailView;
}
export declare class ZunoResponseView {
    responseId: string;
    challengeId: string | null;
    title: string;
    sections: unknown[];
    generatedAt: string;
    static from(response: ZunoResponse): ZunoResponseView;
}
