/**
 * Adaptive response contract.
 *
 * Step 21 API Contracts section 31 and Build Rule 15/19: the response is a
 * variable list of typed sections. Nothing in ZUNO may hard-code "8 screens".
 */
export enum ResponseSectionType {
  CONTEXT_VALIDATION = 'CONTEXT_VALIDATION',
  OUTLOOK = 'OUTLOOK',
  KEY_TAKEAWAY = 'KEY_TAKEAWAY',
  SCENARIO_PATHS = 'SCENARIO_PATHS',
  WHAT_IF = 'WHAT_IF',
  FOCUS_PRIORITIES = 'FOCUS_PRIORITIES',
  TIMELINE = 'TIMELINE',
  MKA = 'MKA',
  PLAN_SUMMARY = 'PLAN_SUMMARY',
  LIFE_SIGNAL = 'LIFE_SIGNAL',
  REALIGNMENT = 'REALIGNMENT',
  KARMA_REFLECTION = 'KARMA_REFLECTION',
  FUTURE_SELF = 'FUTURE_SELF',
  SAFETY_BOUNDARY = 'SAFETY_BOUNDARY',
  ASK_ZUNO = 'ASK_ZUNO',
  /** Asked when WhatNow confidence is below threshold (Step 11 section 30). */
  CLARIFICATION = 'CLARIFICATION',
}

/** Step 20 Data Model section 60. */
export enum ResponseType {
  CONTEXT_VALIDATION = 'CONTEXT_VALIDATION',
  FORECAST = 'FORECAST',
  SCENARIO = 'SCENARIO',
  ACTION_PLAN = 'ACTION_PLAN',
  MKA = 'MKA',
  REALIGNMENT = 'REALIGNMENT',
  FUTURE_SELF = 'FUTURE_SELF',
  GENERAL = 'GENERAL',
}

/**
 * Semantic emphasis the backend is allowed to send.
 * Step 21 section 30: backend returns content structure, never pixel layout.
 */
export enum SectionEmphasis {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  SUPPORTING = 'SUPPORTING',
}

/** Step 20 section 109: engines whose execution state is tracked. */
export enum EngineType {
  WHATNOW = 'WHATNOW',
  ASTROLOGY = 'ASTROLOGY',
  SCENARIO = 'SCENARIO',
  LIFE_SIGNAL = 'LIFE_SIGNAL',
  REALIGNMENT = 'REALIGNMENT',
  MKA = 'MKA',
  PLAN = 'PLAN',
  KARMA = 'KARMA',
  MEMORY = 'MEMORY',
  FUTURE_SELF = 'FUTURE_SELF',
  SAFETY = 'SAFETY',
}

/** Step 20 section 108: engine_runs.status. */
export enum EngineRunStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  /** Ran but produced no usable result, e.g. insufficient rule coverage. */
  NO_RESULT = 'NO_RESULT',
}

/**
 * Public processing state. Step 21 section 109: do not pretend an
 * asynchronous side effect is synchronous.
 */
export enum ProcessingState {
  PROCESSING = 'PROCESSING',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Which downstream engines a challenge needs (Step 11 sections 38-39).
 * Avoids running every engine for every challenge.
 */
export interface EngineRouting {
  scenario_engine: boolean;
  life_signal_engine: boolean;
  realignment_engine: boolean;
  mka_engine: boolean;
  plan_engine: boolean;
  karma_ledger: boolean;
  memory_context: boolean;
  safety_review: boolean;
  astrology: boolean;
}
