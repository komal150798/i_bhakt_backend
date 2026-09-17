/**
 * ZUNO Life Domain taxonomy.
 * Source of truth: Step 11 WhatNow Engine Specification section 10 / section 65.
 *
 * Build Rule 180: these values are contractual. Node, Python and Flutter must
 * not define divergent spellings. New domains are introduced through governed
 * configuration, not by editing this list casually.
 */
export enum ZunoDomain {
  CAREER = 'CAREER',
  FINANCE = 'FINANCE',
  BUSINESS = 'BUSINESS',
  EDUCATION = 'EDUCATION',
  RELATIONSHIP = 'RELATIONSHIP',
  MARRIAGE = 'MARRIAGE',
  FAMILY = 'FAMILY',
  HEALTH_WELLBEING = 'HEALTH_WELLBEING',
  PROPERTY = 'PROPERTY',
  LEGAL = 'LEGAL',
  TRAVEL = 'TRAVEL',
  FOREIGN_RESIDENCE = 'FOREIGN_RESIDENCE',
  PERSONAL_GROWTH = 'PERSONAL_GROWTH',
  GENERAL = 'GENERAL',
}

export const ZUNO_DOMAINS: readonly ZunoDomain[] = Object.values(ZunoDomain);

export function isZunoDomain(value: unknown): value is ZunoDomain {
  return typeof value === 'string' && (ZUNO_DOMAINS as string[]).includes(value);
}

/**
 * Risk class attached to a challenge domain.
 * Source of truth: Step 20 Data Model section 22 (challenge_domains.risk_class)
 * and Step 19 Safety section 12.
 */
export enum ZunoRiskClass {
  LOW_RISK = 'LOW_RISK',
  MODERATE_RISK = 'MODERATE_RISK',
  HIGH_STAKES = 'HIGH_STAKES',
  CRITICAL_SAFETY = 'CRITICAL_SAFETY',
}

/**
 * Default risk class per domain (Step 19 sections 13-16).
 *
 * This is a deterministic policy table, not an AI judgement: Step 19 section 55
 * requires that "the safety policy decides what ZUNO is allowed to do" while the
 * LLM may only detect and draft. A model-proposed risk class can escalate a
 * domain above its baseline but must never silently lower it.
 */
export const DOMAIN_BASELINE_RISK: Readonly<Record<ZunoDomain, ZunoRiskClass>> = {
  [ZunoDomain.CAREER]: ZunoRiskClass.MODERATE_RISK,
  [ZunoDomain.FINANCE]: ZunoRiskClass.MODERATE_RISK,
  [ZunoDomain.BUSINESS]: ZunoRiskClass.MODERATE_RISK,
  [ZunoDomain.EDUCATION]: ZunoRiskClass.LOW_RISK,
  [ZunoDomain.RELATIONSHIP]: ZunoRiskClass.MODERATE_RISK,
  [ZunoDomain.MARRIAGE]: ZunoRiskClass.MODERATE_RISK,
  [ZunoDomain.FAMILY]: ZunoRiskClass.MODERATE_RISK,
  [ZunoDomain.HEALTH_WELLBEING]: ZunoRiskClass.HIGH_STAKES,
  [ZunoDomain.PROPERTY]: ZunoRiskClass.MODERATE_RISK,
  [ZunoDomain.LEGAL]: ZunoRiskClass.HIGH_STAKES,
  [ZunoDomain.TRAVEL]: ZunoRiskClass.LOW_RISK,
  [ZunoDomain.FOREIGN_RESIDENCE]: ZunoRiskClass.HIGH_STAKES,
  [ZunoDomain.PERSONAL_GROWTH]: ZunoRiskClass.LOW_RISK,
  [ZunoDomain.GENERAL]: ZunoRiskClass.LOW_RISK,
};
