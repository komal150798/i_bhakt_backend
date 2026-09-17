import { Repository } from 'typeorm';
import { ZunoRulebookVersion } from '../entities/zuno-rulebook-version.entity';
import { ZunoRulebookRule } from '../entities/zuno-rulebook-rule.entity';
import { ZunoRulebookInterpretation, ZunoRulebookRemedy, ZunoRulebookDomainConfig, ZunoRulebookConflictRule } from '../entities/zuno-rulebook-knowledge.entity';
import { ClockService } from '../../common/services/clock.service';
import { ZunoDomain } from '../../common/enums';
export interface ActiveRulebook {
    versionId: string;
    version: string;
    activatedAt: Date | null;
    hash: string;
}
export interface RuleMatchQuery {
    domains: ZunoDomain[];
    referenceDate?: string;
}
export declare class RulebookRepositoryService {
    private readonly versions;
    private readonly rules;
    private readonly interpretations;
    private readonly remedies;
    private readonly domainConfigs;
    private readonly conflictRules;
    private readonly clock;
    private readonly logger;
    private cachedActive;
    private cacheLoadedAt;
    private static readonly CACHE_TTL_MS;
    constructor(versions: Repository<ZunoRulebookVersion>, rules: Repository<ZunoRulebookRule>, interpretations: Repository<ZunoRulebookInterpretation>, remedies: Repository<ZunoRulebookRemedy>, domainConfigs: Repository<ZunoRulebookDomainConfig>, conflictRules: Repository<ZunoRulebookConflictRule>, clock: ClockService);
    getActive(): Promise<ActiveRulebook | null>;
    requireActive(): Promise<ActiveRulebook>;
    isAstrologyAvailable(): Promise<boolean>;
    findRules(query: RuleMatchQuery): Promise<ZunoRulebookRule[]>;
    findInterpretations(keys: string[]): Promise<Map<string, ZunoRulebookInterpretation>>;
    findRemedies(keys: string[]): Promise<ZunoRulebookRemedy[]>;
    findDomainConfigs(domains: ZunoDomain[]): Promise<Map<ZunoDomain, ZunoRulebookDomainConfig>>;
    findConflictRules(ruleKeys: string[]): Promise<ZunoRulebookConflictRule[]>;
    findRuleForAudit(versionId: string, externalRuleKey: string): Promise<ZunoRulebookRule | null>;
    invalidateCache(): void;
}
