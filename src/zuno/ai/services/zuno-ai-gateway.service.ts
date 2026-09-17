import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { LLMService } from '../../../common/ai/services/llm.service';
import { ZunoAiGenerationRun } from '../entities/zuno-ai-generation-run.entity';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { AiPricingService } from './ai-pricing.service';

/**
 * Result of validating a model's structured output.
 * A validator returns the typed value or a list of human-readable problems.
 */
export type SchemaValidationOk<T> = { ok: true; value: T };
export type SchemaValidationError = { ok: false; errors: string[] };
export type SchemaValidation<T> = SchemaValidationOk<T> | SchemaValidationError;

/**
 * Explicit type guard.
 *
 * This project compiles with `strictNullChecks: false`, under which TypeScript
 * does not reliably narrow a discriminated union from `if (!value.ok)`. A guard
 * keeps the narrowing correct without changing the compiler settings for the
 * whole repository, which would be an unrequested change to every existing
 * module (Build Rule 152).
 */
export function isSchemaValid<T>(
  validation: SchemaValidation<T>,
): validation is SchemaValidationOk<T> {
  return validation.ok === true;
}

export interface StructuredCallOptions<T> {
  /** e.g. WHATNOW_EXTRACT. Recorded on the provenance row. */
  operationType: string;
  systemPrompt: string;
  userPrompt: string;
  promptTemplateVersion: string;
  validate: (raw: unknown) => SchemaValidation<T>;
  userId?: string | null;
  challengeId?: string | null;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** Bounded retries. Build Rule 85: retries must be bounded and observable. */
  maxAttempts?: number;
}

export interface StructuredCallResult<T> {
  value: T;
  runId: string;
  modelProvider: string;
  modelName: string;
  promptTemplateVersion: string;
}

/**
 * The governed AI gateway. Step 30 Phase 1 section 15, Build Rules 81-87.
 *
 * Every ZUNO model call goes through here. Build Rule 81 forbids scattering
 * provider SDK calls across the codebase, and this is also the only place that
 * knows how to turn a model response into trusted structured data.
 *
 * The non-negotiable rule it enforces is Master Index rule 11:
 *   "Never allow LLM output to silently become trusted structured business
 *    data without validation."
 * A caller supplies a validator; output that fails it is retried within a
 * bounded budget and then rejected. There is no path by which unvalidated model
 * output reaches a domain entity.
 *
 * Provenance is written for every attempt, success or failure, because
 * Build Rule 91 requires usage telemetry and Step 20 section 80 requires
 * traceability - including of the calls that went wrong.
 *
 * It deliberately wraps the project's existing LLMService rather than replacing
 * it: that service already provides the provider abstraction Step 00 section 35
 * asks for (OpenAI / Gemini / Claude behind one interface), and Build Rule 153
 * forbids replacing a working module out of preference.
 */
@Injectable()
export class ZunoAiGateway {
  private readonly logger = new Logger(ZunoAiGateway.name);

  constructor(
    private readonly llm: LLMService,
    @InjectRepository(ZunoAiGenerationRun)
    private readonly runs: Repository<ZunoAiGenerationRun>,
    private readonly pricing: AiPricingService,
  ) {}

  /**
   * Calls the model and returns validated, typed output.
   *
   * Throws INTELLIGENCE_SERVICE_UNAVAILABLE when the provider fails or the
   * output cannot be validated within the retry budget. Callers are expected to
   * degrade gracefully (Step 21 section 99) rather than fabricate - Build Rule
   * 129 forbids passing off a canned result as personalised.
   */
  async callStructured<T>(
    options: StructuredCallOptions<T>,
  ): Promise<StructuredCallResult<T>> {
    const maxAttempts = options.maxAttempts ?? 2;
    const inputHash = hash(
      `${options.systemPrompt}\u0000${options.userPrompt}\u0000${options.promptTemplateVersion}`,
    );
    const inputChars = options.systemPrompt.length + options.userPrompt.length;

    let lastErrors: string[] = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const startedAt = Date.now();
      let providerName = 'unknown';
      let modelName = 'unknown';

      try {
        const response = await this.llm.callLLM({
          systemPrompt: options.systemPrompt,
          userPrompt: options.userPrompt,
          temperature: options.temperature ?? 0.2,
          maxTokens: options.maxTokens ?? 2000,
          // Build Rule 83: request schema-constrained output where supported.
          responseFormat: 'json_object',
          timeout: options.timeoutMs ?? 30000,
          // Retry is handled here so that each attempt gets its own provenance
          // row; letting the inner service retry silently would hide attempts.
          maxRetries: 1,
        });

        providerName = response.provider;
        modelName = response.model;

        const parsed = safeParseJson(response.content);
        if (parsed.ok !== true) {
          lastErrors = [(parsed as { error: string }).error];
          await this.recordRun({
            options,
            inputHash,
            inputChars,
            providerName,
            modelName,
            status: 'SCHEMA_INVALID',
            latencyMs: Date.now() - startedAt,
            attempt,
            outputReference: { schema_valid: false, validation_errors: lastErrors },
            tokenUsage: mapUsage(response.usage),
          });
          continue;
        }

        const validation = options.validate(
          (parsed as { value: unknown }).value,
        );
        if (!isSchemaValid(validation)) {
          lastErrors = validation.errors;
          // Build Rule 92: log structured failure, never silently persist.
          this.logger.warn(
            `${options.operationType} attempt ${attempt}/${maxAttempts} failed schema validation: ${lastErrors.slice(0, 3).join('; ')}`,
          );
          await this.recordRun({
            options,
            inputHash,
            inputChars,
            providerName,
            modelName,
            status: 'SCHEMA_INVALID',
            latencyMs: Date.now() - startedAt,
            attempt,
            outputReference: { schema_valid: false, validation_errors: lastErrors },
            tokenUsage: mapUsage(response.usage),
          });
          continue;
        }

        const run = await this.recordRun({
          options,
          inputHash,
          inputChars,
          providerName,
          modelName,
          status: 'SUCCESS',
          latencyMs: Date.now() - startedAt,
          attempt,
          outputReference: { schema_valid: true },
          tokenUsage: mapUsage(response.usage),
        });

        return {
          value: validation.value,
          runId: run.id,
          modelProvider: providerName,
          modelName,
          promptTemplateVersion: options.promptTemplateVersion,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        lastErrors = [message];
        this.logger.warn(
          `${options.operationType} attempt ${attempt}/${maxAttempts} provider error`,
        );
        await this.recordRun({
          options,
          inputHash,
          inputChars,
          providerName,
          modelName,
          status: isTimeout(message) ? 'TIMEOUT' : 'PROVIDER_ERROR',
          latencyMs: Date.now() - startedAt,
          attempt,
          outputReference: null,
          tokenUsage: null,
        });

        // Build Rule 97 / Step 21 section 97: do not retry errors that will not
        // get better. A malformed request or an auth failure is deterministic.
        if (!isRetryable(message)) break;
      }
    }

    throw new ZunoException(ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE, {
      internalDetail: `${options.operationType} exhausted ${maxAttempts} attempts: ${lastErrors.slice(0, 3).join('; ')}`,
    });
  }

  /** True when no provider is configured, so callers can skip cleanly. */
  isConfigured(): boolean {
    return Boolean(
      process.env.OPENAI_API_KEY ||
        process.env.OPENAI_BASE_URL ||
        process.env.GEMINI_BASE_URL ||
        process.env.CLAUDE_BASE_URL,
    );
  }

  private async recordRun(params: {
    options: StructuredCallOptions<unknown>;
    inputHash: string;
    inputChars: number;
    providerName: string;
    modelName: string;
    status: ZunoAiGenerationRun['status'];
    latencyMs: number;
    attempt: number;
    outputReference: ZunoAiGenerationRun['output_reference'];
    tokenUsage: ZunoAiGenerationRun['token_usage'];
  }): Promise<ZunoAiGenerationRun> {
    // Priced here rather than at each call site so that every run - including
    // the failed and schema-invalid attempts - carries a cost. Counting only
    // successful calls would understate cost-per-WhatNow by exactly the retry
    // rate, which is highest on the hardest inputs.
    const cost = this.pricing.computeCost(
      params.providerName,
      params.modelName,
      params.tokenUsage,
    );

    const run = this.runs.create({
      user_id: params.options.userId ?? null,
      challenge_id: params.options.challengeId ?? null,
      operation_type: params.options.operationType,
      model_provider: params.providerName,
      model_name: params.modelName,
      model_version: null,
      prompt_template_version: params.options.promptTemplateVersion,
      // Hash and size only. Step 20 section 103: do not store the assembled
      // prompt, which would contain the user's memory and private context.
      input_reference: {
        input_hash: params.inputHash,
        challenge_id: params.options.challengeId ?? undefined,
        input_chars: params.inputChars,
      },
      output_reference: params.outputReference,
      status: params.status,
      latency_ms: params.latencyMs,
      attempt_count: params.attempt,
      token_usage: params.tokenUsage,
      cost_micro_usd: cost.costMicroUsd,
      pricing_version: cost.pricingVersion,
      redacted_at: null,
    });
    return this.runs.save(run);
  }
}

/** LLMService reports camelCase usage; the provenance row stores snake_case. */
function mapUsage(
  usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined,
): { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null {
  if (!usage) return null;
  return {
    prompt_tokens: usage.promptTokens,
    completion_tokens: usage.completionTokens,
    total_tokens: usage.totalTokens,
  };
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function safeParseJson(
  content: string,
): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(content) };
  } catch {
    return { ok: false, error: 'model output was not valid JSON' };
  }
}

function isTimeout(message: string): boolean {
  return /timeout|etimedout|aborted/i.test(message);
}

function isRetryable(message: string): boolean {
  // Step 21 section 97: retry transient network/provider failures only.
  if (/401|403|invalid api key|unauthor/i.test(message)) return false;
  if (/400|invalid request|malformed/i.test(message)) return false;
  return true;
}
