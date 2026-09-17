import { DataSource, Repository } from 'typeorm';
import { ZunoChallenge } from '../entities/zuno-challenge.entity';
import { ZunoChallengeContext } from '../entities/zuno-challenge-context.entity';
import { ZunoResponse } from '../../responses/entities/zuno-response.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoUserProfile } from '../../identity/entities/zuno-user-profile.entity';
import { WhatNowService } from '../../whatnow/services/whatnow.service';
import { ResponseComposerService } from '../../responses/services/response-composer.service';
import { SafetyService } from '../../safety/services/safety.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { ChallengeStatus } from '../../common/enums';
export interface CreateChallengeParams {
    user: ZunoUser;
    statement: string;
}
export interface ListChallengesParams {
    userId: string;
    status?: ChallengeStatus;
    limit: number;
    cursor?: string;
}
export declare class ChallengeService {
    private readonly challenges;
    private readonly contexts;
    private readonly responses;
    private readonly profiles;
    private readonly whatNow;
    private readonly composer;
    private readonly safety;
    private readonly outbox;
    private readonly audit;
    private readonly ownership;
    private readonly clock;
    private readonly dataSource;
    private readonly logger;
    constructor(challenges: Repository<ZunoChallenge>, contexts: Repository<ZunoChallengeContext>, responses: Repository<ZunoResponse>, profiles: Repository<ZunoUserProfile>, whatNow: WhatNowService, composer: ResponseComposerService, safety: SafetyService, outbox: OutboxService, audit: ZunoAuditService, ownership: ZunoOwnershipService, clock: ClockService, dataSource: DataSource);
    create(params: CreateChallengeParams): Promise<ZunoChallenge>;
    analyze(user: ZunoUser, challengeId: string): Promise<{
        challenge: ZunoChallenge;
        context: ZunoChallengeContext;
        response: ZunoResponse;
    }>;
    private handleBlockedAnalysis;
    latestResponse(user: ZunoUser, challengeId: string): Promise<ZunoResponse>;
    list(params: ListChallengesParams): Promise<{
        items: ZunoChallenge[];
        nextCursor: string | null;
    }>;
    findOwned(userId: string, challengeId: string): Promise<ZunoChallenge>;
    latestContext(challengeId: string): Promise<ZunoChallengeContext | null>;
    resolve(user: ZunoUser, challengeId: string, note: string | undefined, expectedVersion: number | undefined): Promise<ZunoChallenge>;
    reopen(user: ZunoUser, challengeId: string, expectedVersion: number | undefined): Promise<ZunoChallenge>;
    private transition;
}
