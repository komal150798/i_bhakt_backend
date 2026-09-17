import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  RULEBOOK_WORKBOOK_SCHEMA,
  SheetSpec,
} from '../parsing/workbook-schema';
import {
  MkaDimension,
  RemedyFrequency,
  RemedyType,
  RuleSafetyClass,
  RuleStatus,
  RuleTheme,
  RulebookSheet,
  SensitiveSubject,
  SmeConfidence,
  ThemeDirection,
  ThemeStrength,
  TimingWindowType,
  ZUNO_DOMAINS,
} from '../../common/enums';

/**
 * Generates the blank SME Rulebook workbook.
 *
 * This is what gets handed to the astrologer. It is generated from
 * `RULEBOOK_WORKBOOK_SCHEMA` - the same definition the parser and validator
 * use - so the template can never drift from what the system accepts. An SME
 * who fills this in correctly cannot fail schema validation.
 *
 * Design choices aimed at the person actually filling it in:
 *   - dropdowns on every enum column, so the controlled vocabularies are
 *     discoverable rather than something to look up
 *   - an INSTRUCTIONS sheet explaining the rules that matter, in plain language
 *   - one worked example row per sheet, clearly marked, showing the expected
 *     shape and cross-references
 *   - column notes carrying the guidance from the schema
 *
 * The example rows use the Ashish reference case from Master Index section 39.
 * They are illustrative structure only - Step 08 section 13 is explicit that
 * example values must not be treated as settled astrological doctrine, and the
 * template says so on the sheet itself.
 */
@Injectable()
export class RulebookTemplateService {
  async generate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ZUNO';
    workbook.created = new Date();

    this.addInstructionsSheet(workbook);

    for (const spec of RULEBOOK_WORKBOOK_SCHEMA) {
      this.addSheet(workbook, spec);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private addInstructionsSheet(workbook: ExcelJS.Workbook): void {
    const sheet = workbook.addWorksheet('INSTRUCTIONS', {
      properties: { tabColor: { argb: 'FF1F4E79' } },
    });
    sheet.getColumn(1).width = 110;

    const lines: { text: string; style?: 'h1' | 'h2' | 'note' }[] = [
      { text: 'ZUNO Astrology Rulebook', style: 'h1' },
      { text: '' },
      {
        text: 'This workbook is where the astrological knowledge for ZUNO lives. Nothing astrological is written into the software itself - every interpretation the system ever gives a user originates in a row of this file.',
      },
      { text: '' },
      { text: 'How ZUNO uses what you write here', style: 'h2' },
      {
        text: '1. ZUNO calculates the chart (planets, houses, nakshatras, dashas) mathematically.',
      },
      {
        text: '2. It works out what the person is actually worried about, and which domains that touches.',
      },
      {
        text: '3. It matches your RULES against the chart and produces a theme, e.g. VOLATILITY.',
      },
      {
        text: '4. It looks up your INTERPRETATION for that theme - your approved meaning.',
      },
      {
        text: '5. It rewords your meaning warmly and personally for the user. It may change tone, length and phrasing. It may NEVER change your meaning, direction, severity or timing.',
      },
      { text: '' },
      { text: 'What the system will never do', style: 'h2' },
      { text: '- It will never invent a rule, an interpretation or a remedy.' },
      {
        text: '- If no rule of yours matches, it says nothing astrological at all rather than guessing.',
      },
      {
        text: '- It will never tell a user something is certain. "Career volatility is elevated" is fine; "you will lose your job" is not, and will be rejected.',
      },
      { text: '' },
      { text: 'Filling this in', style: 'h2' },
      {
        text: 'Start small. A first rulebook with 40-60 CAREER rules is genuinely useful. You can add domains in later versions without any code change.',
      },
      { text: '' },
      { text: 'Sheets you must fill in: DOMAINS, RULES, INTERPRETATIONS.' },
      {
        text: 'Optional for a first version: TIMING_RULES, REMEDIES, CONFLICT_RULES, GOLDEN_CASES, CONFIGURATION.',
      },
      { text: '' },
      { text: 'Rules that will save you time', style: 'h2' },
      {
        text: 'Rule IDs are permanent. Once a rule ID has been used it is never reused for a different rule, because old user responses still point at it. To change a rule meaningfully, deprecate it and add a new ID.',
      },
      {
        text: 'Every reference must exist. If a rule names INT-CAREER-001, that row must be present in INTERPRETATIONS. Validation will tell you exactly which row and column is wrong.',
      },
      {
        text: 'Themes, directions and strengths use fixed vocabularies - use the dropdowns. If a theme you need is missing, tell the product team and it will be added properly.',
      },
      {
        text: 'Do not use percentages. "78% chance of job loss" is not something this system will accept. Use the strength levels.',
      },
      {
        text: 'Anything touching health, death, longevity, pregnancy, legal consequences or financial loss needs a Safety Class other than STANDARD, and will require a second reviewer.',
      },
      { text: '' },
      { text: 'Counter factors matter', style: 'h2' },
      {
        text: 'If a chart shows pressure AND protection, record both. ZUNO is designed to hold "volatility is high" and "recovery support is strong" at the same time, rather than flattening them into a verdict. Use the Counter Factors column for the protective side.',
      },
      { text: '' },
      { text: 'The example rows', style: 'h2' },
      {
        text: 'Each sheet has one example row marked EXAMPLE in grey. It shows the expected shape and how the cross-references link up. The astrological content in it is placeholder structure, not doctrine - delete the row and replace it with your own work.',
      },
      { text: '' },
      { text: 'When you are done', style: 'h2' },
      {
        text: 'Send the file back to be uploaded. It is validated before anything happens, you get a report of every problem with its row and column, and nothing reaches users until you have reviewed the rules and approved them.',
      },
    ];

    lines.forEach((line, index) => {
      const row = sheet.getRow(index + 1);
      const cell = row.getCell(1);
      cell.value = line.text;
      cell.alignment = { wrapText: true, vertical: 'top' };
      if (line.style === 'h1') {
        cell.font = { bold: true, size: 16, color: { argb: 'FF1F4E79' } };
      } else if (line.style === 'h2') {
        cell.font = { bold: true, size: 12, color: { argb: 'FF1F4E79' } };
      } else {
        cell.font = { size: 11 };
      }
      row.commit();
    });
  }

  private addSheet(workbook: ExcelJS.Workbook, spec: SheetSpec): void {
    const sheet = workbook.addWorksheet(spec.sheet, {
      properties: { tabColor: { argb: spec.required ? 'FFC00000' : 'FF808080' } },
    });

    // Row 1: headers, exactly as the parser expects.
    const headerRow = sheet.getRow(1);
    spec.columns.forEach((column, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = column.header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: column.required ? 'FFC00000' : 'FF1F4E79' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      // Guidance travels with the column, so the SME never has to cross-refer.
      cell.note = `${column.required ? 'REQUIRED' : 'Optional'}\n\n${column.description}`;
      sheet.getColumn(index + 1).width = Math.min(
        Math.max(column.header.length + 6, 18),
        45,
      );
    });
    headerRow.height = 32;
    headerRow.commit();

    // Row 2: a worked example, clearly marked so it is obviously deletable.
    const example = this.exampleRow(spec.sheet);
    if (example) {
      const exampleRow = sheet.getRow(2);
      spec.columns.forEach((column, index) => {
        const cell = exampleRow.getCell(index + 1);
        cell.value = example[column.field] ?? '';
        cell.font = { italic: true, color: { argb: 'FF808080' } };
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
      exampleRow.commit();
    }

    this.addDropdowns(sheet, spec);

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: spec.columns.length },
    };
  }

  /**
   * Attaches dropdown validation to enum columns.
   *
   * Applied down to row 5000, which comfortably exceeds any realistic rulebook
   * while keeping the file small. Excel's list validation has a 255-character
   * limit per formula, so longer vocabularies are skipped rather than silently
   * truncated - the column note still documents the valid values.
   */
  private addDropdowns(sheet: ExcelJS.Worksheet, spec: SheetSpec): void {
    const vocabularies: Record<string, string[]> = {
      domain: [...ZUNO_DOMAINS],
      theme: Object.values(RuleTheme),
      direction: Object.values(ThemeDirection),
      strength: Object.values(ThemeStrength),
      safety_class: Object.values(RuleSafetyClass),
      status: Object.values(RuleStatus),
      sme_confidence: Object.values(SmeConfidence),
      window_type: Object.values(TimingWindowType),
      remedy_type: Object.values(RemedyType),
      mka_dimension: Object.values(MkaDimension),
      frequency: Object.values(RemedyFrequency),
      sensitive_subjects: Object.values(SensitiveSubject),
      has_financial_cost: ['YES', 'NO'],
      is_devotional: ['YES', 'NO'],
    };

    spec.columns.forEach((column, index) => {
      const values = vocabularies[column.field];
      if (!values) return;

      const formula = `"${values.join(',')}"`;
      if (formula.length > 255) return;

      // Applied as a single range rather than cell by cell.
      //
      // The per-cell form instantiates one validation object per cell, which
      // for ~13 enum columns over 5000 rows is 65,000 objects - slow enough to
      // time out and large enough to bloat the file. The range form writes one
      // entry per column and Excel applies it identically.
      const letter = columnLetter(index + 1);
      // `dataValidations` is present at runtime but missing from ExcelJS 4.4's
      // published type definitions, hence the cast.
      const validations = (sheet as unknown as {
        dataValidations: { add: (range: string, validation: unknown) => void };
      }).dataValidations;

      validations.add(`${letter}2:${letter}${TEMPLATE_VALIDATION_ROWS}`, {
        type: 'list',
        allowBlank: !column.required,
        formulae: [formula],
        showErrorMessage: true,
        errorStyle: 'error',
        errorTitle: 'Value not allowed',
        error: `${column.header} must be one of: ${values.join(', ')}`,
      });
    });
  }

  /**
   * One worked example per sheet.
   *
   * Uses the Ashish reference case (Master Index section 39) because it is the
   * scenario the whole specification set is written around, so the example
   * cross-references line up: the rule points at the interpretation, which
   * points at the timing rule and remedy, and the golden case expects the rule.
   *
   * The astrological content is deliberately generic placeholder structure.
   * Build Rule 12 forbids fabricating astrology rules, and Step 08 section 13
   * says not to fill SME_DEFINED fields with generic assumptions - so these
   * exist to show *shape*, and the template tells the SME to replace them.
   */
  private exampleRow(sheet: RulebookSheet): Record<string, string> | null {
    switch (sheet) {
      case RulebookSheet.CONFIGURATION:
        return {
          setting: 'AYANAMSA',
          value: 'LAHIRI',
          notes: 'EXAMPLE - replace with your chosen methodology',
        };

      case RulebookSheet.DOMAINS:
        return {
          domain: 'CAREER',
          primary_houses: '10, 6',
          secondary_houses: '11, 2',
          primary_planets: 'SATURN, SUN',
          supporting_planets: 'MERCURY',
          relevant_divisional_charts: 'D10',
          timing_factors: 'DASHA, BHUKTI, TRANSIT',
          methodology_notes:
            'EXAMPLE ROW - delete this and enter your own methodology. Do not treat these houses as approved doctrine.',
        };

      case RulebookSheet.RULES:
        return {
          rule_id: 'ASTRO-CAREER-001',
          rule_name: 'EXAMPLE - Career pressure during an afflicted dasha period',
          domain: 'CAREER',
          subcategory: 'JOB_SECURITY',
          primary_factor: 'Bhukti lord is retrograde and connected to the 10th house',
          supporting_factors:
            'Transit of a slow-moving planet over the 10th | Dasha lord weak by placement',
          counter_factors: '11th house strongly supported',
          theme: 'VOLATILITY',
          direction: 'CAUTION',
          strength: 'MODERATE',
          interpretation_id: 'INT-CAREER-001',
          timing_rule_ids: 'TIME-CAREER-001',
          remedy_ids: 'REM-MIND-001',
          conflict_rule_ids: '',
          safety_class: 'STANDARD',
          sensitive_subjects: '',
          sme_confidence: 'CONTEXT_DEPENDENT',
          status: 'DRAFT',
          version: '1.0',
          sme_comment: 'EXAMPLE ROW - structure only, not approved astrology. Delete it.',
          change_reason: '',
          effective_from: '',
          effective_until: '',
        };

      case RulebookSheet.INTERPRETATIONS:
        return {
          interpretation_id: 'INT-CAREER-001',
          theme: 'VOLATILITY',
          meaning:
            'EXAMPLE - This period may involve increased uncertainty, restructuring or unexpected professional change. Note how this describes a condition without asserting an outcome.',
          allowed_domains: 'CAREER',
          user_safe_summary: 'Work may feel less predictable for a while.',
          status: 'DRAFT',
        };

      case RulebookSheet.TIMING_RULES:
        return {
          timing_rule_id: 'TIME-CAREER-001',
          domain: 'CAREER',
          window_type: 'PREPARATION',
          strength: 'MODERATE',
          conditions: 'EXAMPLE - Bhukti of the dasha lord combined with transit activation',
          timing_language:
            'The coming months are better used for preparation than for major commitments.',
          status: 'DRAFT',
        };

      case RulebookSheet.REMEDIES:
        return {
          remedy_id: 'REM-MIND-001',
          name: 'EXAMPLE - Morning grounding practice',
          remedy_type: 'MEDITATION',
          mka_dimension: 'MIND',
          purpose: 'Steady the mind during an uncertain period',
          astrological_basis: 'EXAMPLE - replace with your basis',
          instructions:
            'Ten minutes of quiet breathing after waking, before checking any messages.',
          frequency: 'DAILY',
          duration: '40 days',
          preferred_time: 'Sunrise',
          restrictions: '',
          conflicts_with: '',
          safety_class: 'LOW_RISK',
          has_financial_cost: 'NO',
          is_devotional: 'NO',
          alternative_keys: '',
          user_explanation: 'A steadier start makes the rest of the day easier to handle.',
          status: 'DRAFT',
        };

      case RulebookSheet.CONFLICT_RULES:
        return {
          conflict_id: 'CONF-001',
          rule_ids: 'ASTRO-CAREER-001, ASTRO-CAREER-002',
          resolution_strategy: 'PRESERVE_BOTH',
          winning_rule_id: '',
          rationale:
            'EXAMPLE - pressure and support can coexist; ZUNO should report both rather than cancelling them out.',
        };

      case RulebookSheet.GOLDEN_CASES:
        return {
          case_id: 'GOLD-CAREER-001',
          case_name: 'EXAMPLE - Career uncertainty with financial dependency',
          domain: 'CAREER',
          date_of_birth: '1978-08-13',
          time_of_birth: '07:05',
          place_of_birth: 'Dongargarh, India',
          challenge_statement:
            'Many people have been laid off in my company. I have a home loan and I am worried about what happens if I lose my job.',
          expected_rule_ids: 'ASTRO-CAREER-001',
          expected_themes: 'VOLATILITY',
          expected_outcome_notes:
            'EXAMPLE - use synthetic birth data only, never a real person. Expect caution plus preparation, never a prediction of job loss.',
        };

      default:
        return null;
    }
  }
}

/**
 * How far down the dropdowns extend. Generous for a first rulebook; beyond
 * this the SME can still paste values, and the upload validator - not the
 * spreadsheet - is the actual gate on what is accepted.
 */
const TEMPLATE_VALIDATION_ROWS = 5000;

/** 1-based column index to spreadsheet letter. */
function columnLetter(index: number): string {
  let result = '';
  let n = index;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}
