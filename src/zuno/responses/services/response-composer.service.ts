import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ResponseSectionType,
  SectionEmphasis,
  ResponseDepth,
  ContextItemType,
} from '../../common/enums';
import {
  ZunoResponsePayload,
  ZunoResponseSection,
  ContextValidationPayload,
  ClarificationPayload,
  KeyTakeawayPayload,
  FocusPrioritiesPayload,
  SafetyBoundaryPayload,
} from '../entities/response.types';
import { ChallengeContextPayload } from '../../challenges/entities/challenge-context.types';
import { SafetyAssessment } from '../../safety/services/safety.service';

export const RESPONSE_COMPOSER_VERSION = 'response-composer-1.0.0';

export interface ComposeInput {
  context: ChallengeContextPayload;
  clarificationRequired: boolean;
  responseDepth: ResponseDepth;
  safety: SafetyAssessment;
  preferredName?: string | null;
}

/**
 * Builds the adaptive response payload.
 *
 * Step 21 sections 29-31: the backend returns content structure and semantic
 * emphasis; the client owns layout, theme and animation. Nothing here names a
 * widget, a colour or a screen.
 *
 * The number of sections varies with what this particular WhatNow warranted -
 * Build Rule 15 and Step 21 Rule 19 both forbid hard-coding eight screens. A
 * low-confidence first message produces two sections; a well-understood
 * challenge produces four or five.
 *
 * Step 00 section 8 governs how much goes in: "show the minimum information
 * required for the user's next useful decision", and treats cognitive overload
 * as a product failure. The engine may understand 25 facts; the first screen
 * shows three.
 */
@Injectable()
export class ResponseComposerService {
  compose(input: ComposeInput): ZunoResponsePayload {
    const sections: ZunoResponseSection[] = [];
    let order = 1;

    // A blocked safety decision replaces the response rather than decorating
    // it. Step 19 section 3: safety is above every other system.
    if (input.safety.blocked) {
      sections.push(this.safetySection(input.safety, order++));
      return {
        title: 'Let us pause here.',
        sections,
      };
    }

    sections.push(this.contextSection(input, order++));

    if (input.clarificationRequired) {
      // Step 11 section 29: understand enough, give some value, then ask ONE
      // useful question. The context section above is that value - we do not
      // return questions alone.
      sections.push(this.clarificationSection(input, order++));
      return {
        title: this.title(input),
        sections,
      };
    }

    const takeaway = this.takeawaySection(input, order);
    if (takeaway) {
      sections.push(takeaway);
      order++;
    }

    const priorities = this.prioritiesSection(input, order);
    if (priorities) {
      sections.push(priorities);
      order++;
    }

    // A boundary is appended, not substituted: the user still gets the useful
    // part of the answer (Step 19 section 19 - ZUNO may help, within limits).
    if (input.safety.boundaryMessage) {
      sections.push(this.safetySection(input.safety, order++));
    }

    return {
      title: this.title(input),
      sections,
    };
  }

  /**
   * "Here is what I understand." Step 30 Phase 3 section 26 names this as the
   * first thing the UI should show, and Step 11 section 43 shows the intent:
   * demonstrate understanding before offering anything.
   */
  private contextSection(
    input: ComposeInput,
    order: number,
  ): ZunoResponseSection<ContextValidationPayload> {
    const items = input.context.items;

    // Facts and fears are carried in separate arrays all the way to the client.
    // Step 11 section 8: a fear must never be rendered as something settled,
    // and the safest way to guarantee that is to never put them in one list.
    const understood = items
      .filter(
        (item) =>
          item.type === ContextItemType.FACT ||
          item.type === ContextItemType.EXTERNAL_EVENT,
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.itemLimit(input.responseDepth))
      .map((item) => item.text);

    const concerns = items
      .filter(
        (item) =>
          item.type === ContextItemType.FEAR ||
          item.type === ContextItemType.ASSUMPTION ||
          item.type === ContextItemType.USER_BELIEF,
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.itemLimit(input.responseDepth))
      .map((item) => item.text);

    return {
      id: randomUUID(),
      type: ResponseSectionType.CONTEXT_VALIDATION,
      order,
      title: 'What I understand',
      emphasis: SectionEmphasis.PRIMARY,
      payload: {
        summary: input.context.summary,
        understood,
        concerns,
        // Step 30 Phase 3 acceptance: "user can correct interpretation".
        correction_invited: true,
      },
    };
  }

  private clarificationSection(
    input: ComposeInput,
    order: number,
  ): ZunoResponseSection<ClarificationPayload> {
    // At most two questions even though up to three were retained, because
    // Step 11 section 29 explicitly rejects asking ten questions before
    // helping, and section 31 says one well-chosen question beats several.
    const questions = input.context.missing_information.slice(0, 2).map((entry) => ({
      id: entry.id,
      question: entry.question,
    }));

    return {
      id: randomUUID(),
      type: ResponseSectionType.CLARIFICATION,
      order,
      title: 'One thing that would help',
      emphasis: SectionEmphasis.PRIMARY,
      payload: {
        questions,
        reason: 'Knowing this would change what I suggest.',
      },
    };
  }

  /**
   * The single most useful thought right now.
   *
   * Built from the dependency graph rather than from a model call: Step 11
   * section 17 treats dependencies as the thing that makes a challenge more
   * than its category, and Build Rule 92 says to use deterministic logic where
   * it exists rather than spending a model call on it.
   */
  private takeawaySection(
    input: ComposeInput,
    order: number,
  ): ZunoResponseSection<KeyTakeawayPayload> | null {
    const dependencies = input.context.dependencies;
    if (dependencies.length === 0) return null;

    const chain = dependencies.slice(0, 3).map((edge) => `${edge.from} → ${edge.to}`);

    return {
      id: randomUUID(),
      type: ResponseSectionType.KEY_TAKEAWAY,
      order,
      title: 'What is really connected here',
      emphasis: SectionEmphasis.SECONDARY,
      payload: {
        headline:
          'This is not one isolated worry — a few things depend on each other.',
        detail: chain.join('  ·  '),
      },
    };
  }

  /**
   * What to focus on, drawn only from what the user can actually influence.
   *
   * Step 11 section 23 calls moving the user toward actionable control a
   * central philosophy, and Step 02 section 18 caps priorities at 3-4.
   *
   * These are focus areas, not a plan. The Plan Engine (Step 16) owns
   * scheduling, sequencing and capacity; producing plan items here would be
   * scope expansion into a later phase.
   */
  private prioritiesSection(
    input: ComposeInput,
    order: number,
  ): ZunoResponseSection<FocusPrioritiesPayload> | null {
    const controllable = input.context.factors.controllable;
    if (controllable.length === 0) return null;

    const limit = input.responseDepth === ResponseDepth.QUICK ? 2 : 3;
    const priorities = controllable.slice(0, limit).map((title) => ({
      id: randomUUID(),
      title,
      why: 'This is within your influence.',
    }));

    return {
      id: randomUUID(),
      type: ResponseSectionType.FOCUS_PRIORITIES,
      order,
      title: 'Where your effort actually counts',
      emphasis: SectionEmphasis.SECONDARY,
      payload: { priorities },
    };
  }

  private safetySection(
    safety: SafetyAssessment,
    order: number,
  ): ZunoResponseSection<SafetyBoundaryPayload> {
    return {
      id: randomUUID(),
      type: ResponseSectionType.SAFETY_BOUNDARY,
      order,
      emphasis: SectionEmphasis.PRIMARY,
      payload: {
        message:
          safety.boundaryMessage ??
          'There is a limit to what I should advise on here, and I would rather say so than guess.',
        disposition: safety.disposition,
        domain: safety.domains[0],
        suggested_support: safety.suggestedSupport,
      },
    };
  }

  /**
   * Response title. Step 24 of the Master Index sets the voice: calm, personal,
   * action-oriented, confident without pretending certainty.
   */
  private title(input: ComposeInput): string {
    if (input.clarificationRequired) {
      return 'Let me make sure I have this right.';
    }
    const hasFear = input.context.items.some(
      (item) => item.type === ContextItemType.FEAR,
    );
    if (hasFear) {
      return 'Let us focus on what we can prepare for.';
    }
    return 'Here is where things stand.';
  }

  /** Progressive disclosure: fewer items when the person is under strain. */
  private itemLimit(depth: ResponseDepth): number {
    switch (depth) {
      case ResponseDepth.QUICK:
        return 2;
      case ResponseDepth.DEEP:
        return 6;
      default:
        return 3;
    }
  }
}
