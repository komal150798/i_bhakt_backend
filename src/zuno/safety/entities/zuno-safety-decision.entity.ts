import { Column, Entity, Index } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import {
  SafetyAction,
  SafetyBlockedCapability,
  SafetyDisposition,
  SafetyFlag,
  ZunoDomain,
  ZunoRiskClass,
} from '../../common/enums';

/**
 * A recorded safety decision. Step 20 Data Model section 62,
 * Step 19 Safety & Trust section 17.
 *
 * Immutable by design: a safety decision is the evidence for why ZUNO answered
 * the way it did. Step 00 section 37 requires the system to be able to answer
 * "what did we tell the user, what information did we use, which rule
 * contributed" - rewriting a past decision would destroy that.
 *
 * Step 19 section 51 warns against storing more sensitive content than
 * necessary, so this records the *decision*, not the text that triggered it.
 */
@Entity('zuno_safety_decisions')
@Index('idx_zuno_safety_decisions_user', ['user_id', 'created_at'])
@Index('idx_zuno_safety_decisions_challenge', ['challenge_id'])
export class ZunoSafetyDecision extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'uuid', name: 'challenge_id', nullable: true })
  challenge_id: string | null;

  /** Which pipeline stage asked, e.g. WHATNOW_PRE_CHECK, RESPONSE_POST_CHECK. */
  @Column({ type: 'varchar', length: 48 })
  operation: string;

  @Column({ type: 'varchar', length: 24, name: 'risk_level' })
  risk_level: ZunoRiskClass;

  @Column({ type: 'varchar', length: 40 })
  disposition: SafetyDisposition;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  domains: ZunoDomain[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  flags: SafetyFlag[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  actions: SafetyAction[];

  @Column({
    type: 'jsonb',
    name: 'blocked_capabilities',
    default: () => "'[]'::jsonb",
  })
  blocked_capabilities: SafetyBlockedCapability[];

  /**
   * Which deterministic policy rules fired (Step 19 section 54).
   * Stored as rule ids such as SAFE-FIN-001 so a decision is explainable
   * without replaying an LLM.
   */
  @Column({
    type: 'jsonb',
    name: 'matched_rule_ids',
    default: () => "'[]'::jsonb",
  })
  matched_rule_ids: string[];

  /** Step 19 section 53: pin the policy that produced this decision. */
  @Column({ type: 'varchar', length: 16, name: 'policy_version' })
  policy_version: string;
}
