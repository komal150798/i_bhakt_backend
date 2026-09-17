import { Injectable } from '@nestjs/common';
import { SafetyFlag } from '../../common/enums';

/**
 * Deterministic first-pass detection of high-risk signals.
 *
 * Step 19 section 55 divides the work: an LLM "may assist with detecting risk
 * signals", but deterministic systems "must control high-risk routing" and
 * "required escalation paths". This detector is the deterministic half. It runs
 * before any model call, so a critical signal is caught even when the AI
 * provider is down, slow, or returns malformed output - exactly the case where
 * a purely model-based detector would fail open.
 *
 * It is intentionally recall-oriented, not precision-oriented. A false positive
 * costs a user an unnecessary boundary message; a false negative costs
 * something that cannot be undone. Step 19 section 56 points the same way: low
 * confidence in a high-stakes context increases caution.
 *
 * KNOWN LIMITATION (stated rather than hidden, per Build Rule 169):
 * these are English-language patterns. Step 29 Build Rule 107 requires safety
 * meaning to remain equivalent across supported languages, so this must be
 * extended before any non-English launch. The LLM-detected flags merged by
 * SafetyService provide partial cover in the meantime, but a deterministic
 * detector per supported language is the requirement.
 */
@Injectable()
export class SafetySignalDetector {
  /**
   * Patterns are matched against lowercased text with collapsed whitespace.
   * Word boundaries are used to avoid matching inside longer words - "harm"
   * should not fire on "harmony", "pills" should not fire on "pillsbury".
   */
  private readonly patterns: ReadonlyArray<{
    flag: SafetyFlag;
    expressions: RegExp[];
  }> = [
    {
      flag: SafetyFlag.SELF_HARM,
      expressions: [
        /*
         * Past and third-person forms are matched deliberately.
         *
         * These patterns originally covered only the present tense, so
         * "what if I killed myself" and "if I ended my life" passed straight
         * through undetected. A hypothetical or retrospective framing is not a
         * weaker signal - "what if I had" is one of the commonest ways the
         * thought gets voiced, and it is exactly the phrasing that reaches a
         * What-If or scenario prompt. Detection must not depend on the user
         * choosing the present tense.
         *
         * Over-matching here is the cheap failure: a false positive routes
         * someone to support they did not need. A false negative does not.
         */
        /\b(kill|kills|killed|killing)\s+(myself|my\s?self)\b/,
        /\bend(s|ed|ing)?\s+(my|it)\s+(life|all)\b/,
        /\b(want(s|ed)?|going|plan(s|ned|ning)?)\s+to\s+die\b/,
        /\bsuicid(e|al)\b/,
        /\b(hurt|hurts|harm|harms|harmed|cut|cuts|cutting)\s+(myself|my\s?self)\b/,
        /\bnot\s+(want|worth)\s+(to\s+)?(live|living|be\s+here)\b/,
        /\bno\s+(reason|point)\s+(to\s+|in\s+)?(live|living|going\s+on)\b/,
        /\bbetter\s+off\s+(dead|without\s+me)\b/,
        /\bself[\s-]?harm\b/,
        /\boverdos(e|ing)\b/,
      ],
    },
    {
      flag: SafetyFlag.HARM_TO_OTHERS,
      expressions: [
        /\b(kill|hurt|harm|attack|stab|shoot)\s+(him|her|them|someone|somebody|my\s+\w+)\b/,
        /\bmake\s+(him|her|them)\s+(pay|suffer)\b/,
        /\bget\s+revenge\b/,
      ],
    },
    {
      flag: SafetyFlag.IMMEDIATE_MEDICAL_RISK,
      expressions: [
        /\b(chest\s+pain|heart\s+attack|stroke)\b/,
        /\bcan(no|')?t\s+breathe\b/,
        /\b(bleeding|blood)\s+(heavily|a\s+lot|badly|won'?t\s+stop)\b/,
        /\b(unconscious|passed\s+out|collapsed)\b/,
        /\bemergency\s+room\b/,
      ],
    },
    {
      flag: SafetyFlag.ABUSE,
      expressions: [
        /\b(he|she|they|husband|wife|partner|father|mother|boss)\s+(hits?|hit|beats?|beat|abus(es|ed))\s+me\b/,
        /\b(domestic|physical|emotional|sexual)\s+abuse\b/,
        /\bafraid\s+(of|for)\s+my\s+(life|safety)\b/,
        /\bnot\s+safe\s+at\s+home\b/,
        /\bthreaten(s|ed|ing)?\s+(to\s+)?(hurt|kill|harm)\s+me\b/,
      ],
    },
    {
      flag: SafetyFlag.CHILD_SAFETY,
      expressions: [
        /\b(my\s+)?(child|kid|son|daughter|baby)\s+(is\s+)?(being\s+)?(hurt|abused|beaten|unsafe|in\s+danger)\b/,
        /\bchild\s+(abuse|neglect)\b/,
      ],
    },
    {
      flag: SafetyFlag.VIOLENCE,
      expressions: [
        /\b(being\s+)?(attacked|assaulted)\b/,
        /\bthreat(s|ened|ening)?\s+(of\s+)?violence\b/,
      ],
    },
    {
      flag: SafetyFlag.CRIMINAL_REQUEST,
      expressions: [
        /\bhow\s+(to|do\s+i)\s+(hide|launder)\s+(money|assets)\b/,
        /\b(forge|fake|falsify)\s+(documents?|signature|papers?)\b/,
        /\bevade\s+(tax|taxes|police|arrest)\b/,
        /\bbribe\s+(an?\s+)?(official|officer|inspector)\b/,
      ],
    },
    {
      flag: SafetyFlag.SERIOUS_LEGAL_RISK,
      expressions: [
        /\b(arrested|lawsuit|sued|court\s+case|legal\s+notice|criminal\s+charge)\b/,
        /\bdeport(ed|ation)?\b/,
        /\bvisa\s+(cancel(l)?ed|revoked|expired)\b/,
        /\b(police|immigration)\s+(complaint|case)\b/,
      ],
    },
    {
      flag: SafetyFlag.SEVERE_FINANCIAL_RISK,
      expressions: [
        /\b(bankrupt|bankruptcy|insolven(t|cy))\b/,
        /\b(foreclos(e|ure)|repossess(ed|ion)?)\b/,
        /\bdefault(ed|ing)?\s+on\s+(my\s+)?(loan|mortgage|emi|payments?)\b/,
        /\bcan(no|')?t\s+(pay|afford)\s+(my\s+)?(loan|mortgage|emi|rent|bills?)\b/,
        /\b(debt\s+collector|recovery\s+agent)\b/,
        /\blos(e|ing|t)\s+(my\s+)?(house|home)\b/,
      ],
    },
  ];

  /**
   * Returns every flag whose pattern matches. Order is not significant -
   * SafetyService merges them by severity.
   */
  detect(text: string): SafetyFlag[] {
    const normalised = normalise(text);
    if (!normalised) return [];

    const found = new Set<SafetyFlag>();
    for (const { flag, expressions } of this.patterns) {
      if (expressions.some((expression) => expression.test(normalised))) {
        found.add(flag);
      }
    }
    return Array.from(found);
  }
}

function normalise(text: string): string {
  return (text ?? '')
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
