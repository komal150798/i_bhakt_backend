import { Repository } from 'typeorm';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoChallengeContext } from '../../challenges/entities/zuno-challenge-context.entity';
import { ZunoChallengeDomain } from '../../challenges/entities/zuno-challenge-domain.entity';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
import { ZunoDomain } from '../../common/enums';
import { ScenarioAstroContext } from '../entities/scenario.types';
export interface ChallengeProjection {
    challenge: ZunoChallenge;
    context: ZunoChallengeContext | null;
    domains: ZunoDomain[];
    summary: string;
    facts: string[];
    concerns: string[];
    dependencies: {
        from: string;
        to: string;
        description?: string | null;
    }[];
    decisions: {
        question: string;
        options: string[];
    }[];
    controllable: string[];
    external: string[];
    temporalAnchors: {
        raw: string;
        normalized_date: string | null;
    }[];
    safetyText: string;
}
export declare class ScenarioContextService {
    private readonly challenges;
    private readonly contexts;
    private readonly challengeDomains;
    private readonly ownership;
    private readonly rulebook;
    private readonly logger;
    constructor(challenges: Repository<ZunoChallenge>, contexts: Repository<ZunoChallengeContext>, challengeDomains: Repository<ZunoChallengeDomain>, ownership: ZunoOwnershipService, rulebook: RulebookRepositoryService);
    requireOwnedChallenge(userId: string, challengeId: string): Promise<ZunoChallenge>;
    project(userId: string, challengeId: string): Promise<ChallengeProjection>;
    loadAstroContext(domains: ZunoDomain[]): Promise<ScenarioAstroContext | null>;
}
