import { Column, Entity, Index } from 'typeorm';
import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';

/**
 * AI provenance for one model call. Step 20 Data Model section 80.
 *
 * The defining constraint is Step 20 section 81 and Build Rule 87:
 * DO NOT persist hidden chain-of-thought. This table therefore stores
 * *references and telemetry*, never the prompt body and never the model's
 * private reasoning:
 *
 *   input_reference   - ids and a hash of what went in, not the text itself
 *   output_reference  - id of the artifact produced, plus validation outcome
 *
 * Step 20 section 103 adds the reason: a prompt assembled from a user's memory,
 * birth data and private challenge is exactly the payload we must not casually
 * store. The hash still lets us prove two runs had identical input.
 */
@Entity('zuno_ai_generation_runs')
@Index('idx_zuno_ai_runs_operation', ['operation_type', 'created_at'])
@Index('idx_zuno_ai_runs_challenge', ['challenge_id'])
export class ZunoAiGenerationRun extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  user_id: string | null;

  @Column({ type: 'uuid', name: 'challenge_id', nullable: true })
  challenge_id: string | null;

  /** e.g. WHATNOW_EXTRACT, SAFETY_CLASSIFY. */
  @Column({ type: 'varchar', length: 48, name: 'operation_type' })
  operation_type: string;

  @Column({ type: 'varchar', length: 32, name: 'model_provider' })
  model_provider: string;

  @Column({ type: 'varchar', length: 64, name: 'model_name' })
  model_name: string;

  @Column({ type: 'varchar', length: 64, name: 'model_version', nullable: true })
  model_version: string | null;

  @Column({
    type: 'varchar',
    length: 64,
    name: 'prompt_template_version',
  })
  prompt_template_version: string;

  /** References and hashes only - never raw prompt text. */
  @Column({ type: 'jsonb', name: 'input_reference' })
  input_reference: {
    input_hash: string;
    challenge_id?: string;
    context_version?: number;
    /** Rough size, for cost analysis without storing content. */
    input_chars: number;
  };

  @Column({ type: 'jsonb', name: 'output_reference', nullable: true })
  output_reference: {
    artifact_type?: string;
    artifact_id?: string;
    schema_valid: boolean;
    /** Populated when schema validation rejected the output. */
    validation_errors?: string[];
  } | null;

  @Column({ type: 'varchar', length: 24 })
  status: 'SUCCESS' | 'SCHEMA_INVALID' | 'TIMEOUT' | 'PROVIDER_ERROR' | 'BLOCKED';

  @Column({ type: 'int', name: 'latency_ms', nullable: true })
  latency_ms: number | null;

  @Column({ type: 'int', name: 'attempt_count', default: 1 })
  attempt_count: number;

  /** Build Rule 91: record approved usage/cost telemetry. */
  @Column({ type: 'jsonb', name: 'token_usage', nullable: true })
  token_usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null;

  /**
   * What this call cost, in integer micro-USD (1e-6 USD).
   *
   * Integer, not numeric/float: money accumulated as floating point drifts, and
   * these rows are summed across millions of calls to produce cost-per-WhatNow.
   * `bigint` rather than `int` so a very large context call cannot overflow;
   * the transformer keeps TypeScript honest, since TypeORM otherwise hands back
   * a string for bigint columns and `a + b` would silently concatenate.
   *
   * NULL means "not known", never "free". A model with no configured price, or
   * a provider that returned no usage block, is recorded null and excluded from
   * totals, with the exclusion reported alongside every aggregate.
   */
  @Column({
    type: 'bigint',
    name: 'cost_micro_usd',
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  cost_micro_usd: number | null;

  /**
   * Which price list produced `cost_micro_usd`, or UNPRICED.
   *
   * Stamped per row so a historical cost stays interpretable after prices
   * change. Without it, re-pricing history would be indistinguishable from the
   * original figures (Step 20 section 80: traceability).
   */
  @Column({
    type: 'varchar',
    length: 32,
    name: 'pricing_version',
    nullable: true,
  })
  pricing_version: string | null;
}
