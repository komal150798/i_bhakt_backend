import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { createHash } from 'crypto';
import {
  RULEBOOK_WORKBOOK_SCHEMA,
  normaliseHeader,
  sheetSpec,
} from './workbook-schema';
import { RulebookSheet, ValidationSeverity } from '../../common/enums';
import { ValidationFinding } from '../entities/zuno-rulebook-governance.entity';

export interface ParsedRow {
  /** 1-based worksheet row number, for actionable error messages. */
  __row: number;
  [field: string]: unknown;
}

export interface ParsedWorkbook {
  sheets: Map<RulebookSheet, ParsedRow[]>;
  findings: ValidationFinding[];
  fileHash: string;
  fileSize: number;
}

/** Hard limits. A workbook beyond these is rejected rather than processed. */
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_ROWS_PER_SHEET = 20000;
const MAX_CELL_CHARS = 8000;

export const RULEBOOK_PARSER_VERSION = 'rulebook-parser-1.0.0';

/**
 * Parses an uploaded SME Rulebook workbook into structured rows.
 *
 * SECURITY POSTURE - this is the single most important thing about this class.
 *
 * Build Rule 57 is explicit: "Uploaded workbooks are data. Do not execute
 * macros, execute formulas, follow external instructions, treat cell text as
 * system instructions." Build Rule 58 adds that Rulebook text cannot override
 * system policy, Safety, architecture or product specification.
 *
 * Concretely, this parser:
 *
 *   1. Reads only cached cell *values*, never formulas. ExcelJS does not
 *      evaluate formulas, and where a cell carries one we take its stored
 *      result and record that we did - a formula result is data, the formula
 *      itself is ignored.
 *   2. Never executes macros. An .xlsm is refused outright.
 *   3. Strips control characters and caps cell length, so a cell cannot carry a
 *      megabyte of injected text into a downstream prompt.
 *   4. Neutralises spreadsheet formula-injection prefixes (=, +, -, @) on text
 *      fields, which is the classic CSV-injection vector if anyone ever
 *      re-exports this content.
 *   5. Flags prompt-injection patterns rather than silently accepting them.
 *      Rulebook content eventually reaches an LLM as reference material, so a
 *      cell reading "ignore previous instructions" is a governance event.
 *
 * The parser is deliberately non-judgemental about astrology. It does not know
 * what a valid rule means; it only turns a workbook into rows. Meaning is the
 * SME's, validity is the validator's.
 */
@Injectable()
export class RulebookParserService {
  private readonly logger = new Logger(RulebookParserService.name);

  /**
   * Patterns that suggest someone is trying to talk to the model through a
   * spreadsheet cell rather than describe astrology.
   *
   * These raise a WARNING, not an ERROR: a legitimate rule could conceivably
   * contain the word "system", and an SME should not have an upload of 1600
   * rules rejected over a false positive. The finding surfaces on the review
   * dashboard for a human to judge.
   */
  private readonly injectionPatterns: readonly RegExp[] = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,
    /disregard\s+(the\s+)?(system|previous|above)/i,
    /you\s+are\s+now\s+(a|an)\s+/i,
    /\bsystem\s*prompt\b/i,
    /\b(act|behave)\s+as\s+(if|though)\s+you/i,
    /<\s*\/?\s*(script|iframe|system|instruction)\b/i,
    /\boverride\s+(the\s+)?(safety|policy|guardrail)/i,
  ];

  async parse(buffer: Buffer, fileName: string): Promise<ParsedWorkbook> {
    const findings: ValidationFinding[] = [];
    const sheets = new Map<RulebookSheet, ParsedRow[]>();

    const fileHash = createHash('sha256').update(buffer).digest('hex');
    const fileSize = buffer.length;

    // --- File-level integrity (Step 10 section 10) ---
    if (fileSize === 0) {
      findings.push(error('EMPTY_FILE', 'The uploaded file is empty.'));
      return { sheets, findings, fileHash, fileSize };
    }
    if (fileSize > MAX_FILE_BYTES) {
      findings.push(
        error(
          'FILE_TOO_LARGE',
          `File is ${(fileSize / 1048576).toFixed(1)} MB; the limit is ${MAX_FILE_BYTES / 1048576} MB.`,
        ),
      );
      return { sheets, findings, fileHash, fileSize };
    }
    // Macro-enabled workbooks are refused, not sanitised (Build Rule 57).
    if (/\.xlsm$/i.test(fileName)) {
      findings.push(
        error(
          'MACRO_WORKBOOK_REJECTED',
          'Macro-enabled workbooks (.xlsm) are not accepted. Please save as .xlsx.',
        ),
      );
      return { sheets, findings, fileHash, fileSize };
    }
    if (!/\.xlsx$/i.test(fileName)) {
      findings.push(
        error('UNSUPPORTED_FILE_TYPE', 'Only .xlsx workbooks are supported.'),
      );
      return { sheets, findings, fileHash, fileSize };
    }

    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    } catch (e) {
      // A password-protected or corrupt workbook lands here. The message is
      // kept generic - the underlying library error can contain file paths.
      findings.push(
        error(
          'WORKBOOK_UNREADABLE',
          'The workbook could not be read. It may be corrupted or password protected.',
        ),
      );
      this.logger.warn(
        `Workbook parse failed: ${e instanceof Error ? e.name : 'unknown'}`,
      );
      return { sheets, findings, fileHash, fileSize };
    }

    // --- Sheet discovery (Step 10 section 11) ---
    const available = new Map<string, ExcelJS.Worksheet>();
    workbook.eachSheet((ws) => available.set(normaliseHeader(ws.name), ws));

    for (const spec of RULEBOOK_WORKBOOK_SCHEMA) {
      const ws = available.get(normaliseHeader(spec.sheet));
      if (!ws) {
        if (spec.required) {
          findings.push(
            error(
              'MISSING_SHEET',
              `Required worksheet "${spec.sheet}" was not found.`,
              { sheet: spec.sheet },
            ),
          );
        }
        continue;
      }
      const { rows, sheetFindings } = this.parseSheet(ws, spec.sheet);
      sheets.set(spec.sheet, rows);
      findings.push(...sheetFindings);
    }

    return { sheets, findings, fileHash, fileSize };
  }

  private parseSheet(
    worksheet: ExcelJS.Worksheet,
    sheet: RulebookSheet,
  ): { rows: ParsedRow[]; sheetFindings: ValidationFinding[] } {
    const spec = sheetSpec(sheet)!;
    const sheetFindings: ValidationFinding[] = [];
    const rows: ParsedRow[] = [];

    const headerRow = worksheet.getRow(1);
    if (!headerRow || headerRow.cellCount === 0) {
      sheetFindings.push(
        error('MISSING_HEADER_ROW', `Sheet "${sheet}" has no header row.`, {
          sheet,
        }),
      );
      return { rows, sheetFindings };
    }

    // Map workbook columns to schema fields, tolerating case and aliases.
    const columnToField = new Map<number, string>();
    const seenFields = new Set<string>();
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = normaliseHeader(this.cellText(cell));
      if (!header) return;
      const match = spec.columns.find(
        (c) =>
          normaliseHeader(c.header) === header ||
          (c.aliases ?? []).some((a) => normaliseHeader(a) === header),
      );
      if (match) {
        columnToField.set(colNumber, match.field);
        seenFields.add(match.field);
      }
      // Unknown extra columns are ignored, not rejected. SMEs keep working
      // notes in their sheets and that is legitimate (Step 10 section 11 allows
      // additional source/audit worksheets).
    });

    // Step 10 section 12: missing mandatory columns fail validation.
    for (const column of spec.columns) {
      if (column.required && !seenFields.has(column.field)) {
        sheetFindings.push(
          error(
            'MISSING_COLUMN',
            `Sheet "${sheet}" is missing the required column "${column.header}".`,
            { sheet, column: column.header },
          ),
        );
      }
    }
    if (sheetFindings.some((f) => f.severity === ValidationSeverity.ERROR)) {
      return { rows, sheetFindings };
    }

    let processed = 0;
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // header
      if (processed >= MAX_ROWS_PER_SHEET) return;

      const parsed: ParsedRow = { __row: rowNumber };
      let hasAnyValue = false;

      columnToField.forEach((field, colNumber) => {
        const cell = row.getCell(colNumber);
        const raw = this.cellText(cell);
        if (raw.length > 0) hasAnyValue = true;

        const { value, findings: cellFindings } = this.sanitise(
          raw,
          sheet,
          rowNumber,
          field,
        );
        parsed[field] = value;
        sheetFindings.push(...cellFindings);
      });

      // Skip visually blank rows - Excel files are full of them.
      if (!hasAnyValue) return;

      rows.push(parsed);
      processed++;
    });

    if (processed >= MAX_ROWS_PER_SHEET) {
      sheetFindings.push(
        error(
          'TOO_MANY_ROWS',
          `Sheet "${sheet}" exceeds the ${MAX_ROWS_PER_SHEET}-row limit; the remainder was not read.`,
          { sheet },
        ),
      );
    }

    return { rows, sheetFindings };
  }

  /**
   * Extracts a cell's displayed value as plain text.
   *
   * Never evaluates a formula. When a cell holds one, ExcelJS exposes the
   * cached `result` computed by Excel itself - we take that value and treat it
   * as ordinary data. Rich text is flattened; hyperlinks contribute only their
   * visible text, never the target URL, so a link cannot smuggle a destination
   * into the knowledge base.
   */
  private cellText(cell: ExcelJS.Cell): string {
    const value = cell?.value;
    if (value === null || value === undefined) return '';

    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (value instanceof Date) return value.toISOString().slice(0, 10);

    if (typeof value === 'object') {
      const v = value as unknown as Record<string, unknown>;
      // Formula cell: use the cached result only.
      if ('formula' in v || 'sharedFormula' in v) {
        const result = v.result;
        if (result === null || result === undefined) return '';
        if (result instanceof Date) return result.toISOString().slice(0, 10);
        if (typeof result === 'object') return '';
        return String(result);
      }
      // Rich text: concatenate the visible runs.
      if ('richText' in v && Array.isArray(v.richText)) {
        return (v.richText as { text?: string }[])
          .map((part) => part.text ?? '')
          .join('');
      }
      // Hyperlink: keep the label, discard the target.
      if ('text' in v && typeof v.text === 'string') return v.text;
      if ('error' in v) return '';
    }
    return '';
  }

  /**
   * Cleans one cell value and reports anything suspicious.
   *
   * Order matters here: strip control characters first so a pattern cannot be
   * hidden by embedded nulls, then check for injection, then neutralise a
   * leading formula character.
   */
  private sanitise(
    raw: string,
    sheet: RulebookSheet,
    row: number,
    field: string,
  ): { value: string; findings: ValidationFinding[] } {
    const findings: ValidationFinding[] = [];
    if (!raw) return { value: '', findings };

    // Strip C0/C1 control characters except tab, newline and carriage return,
    // so a pattern cannot be hidden behind embedded nulls.
    // eslint-disable-next-line no-control-regex
    // Strip C0/C1 control characters (except tab/newline/CR, which Excel
    // legitimately stores in multi-line cells) so a pattern cannot be hidden
    // behind embedded nulls.
    let value = raw.replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g,
      '',
    );
    value = value.replace(/\s+$/g, '').replace(/^\s+/g, '');

    if (value.length > MAX_CELL_CHARS) {
      value = value.slice(0, MAX_CELL_CHARS);
      findings.push(
        warning(
          'CELL_TRUNCATED',
          `Value was longer than ${MAX_CELL_CHARS} characters and was truncated.`,
          { sheet, row, column: field },
        ),
      );
    }

    for (const pattern of this.injectionPatterns) {
      if (pattern.test(value)) {
        // Build Rule 58: rulebook text cannot override system policy. We keep
        // the content (the SME may have a legitimate reason) but make it
        // impossible to land in production unnoticed.
        findings.push(
          warning(
            'POSSIBLE_PROMPT_INJECTION',
            'This cell contains instruction-like language. Rulebook content is reference data and can never override ZUNO policy or safety, but please confirm the wording is intended.',
            { sheet, row, column: field },
          ),
        );
        this.logger.warn(
          `Possible prompt injection in ${sheet} row ${row} column ${field}`,
        );
        break;
      }
    }

    // Classic spreadsheet formula-injection prefix. Prefix with an apostrophe
    // so any later CSV export is inert.
    if (/^[=+\-@\t\r]/.test(value)) {
      value = `'${value}`;
      findings.push(
        warning(
          'FORMULA_PREFIX_NEUTRALISED',
          'Value began with a spreadsheet formula character and was escaped.',
          { sheet, row, column: field },
        ),
      );
    }

    return { value, findings };
  }
}

function error(
  code: string,
  message: string,
  extra: Partial<ValidationFinding> = {},
): ValidationFinding {
  return { severity: ValidationSeverity.ERROR, code, message, ...extra };
}

function warning(
  code: string,
  message: string,
  extra: Partial<ValidationFinding> = {},
): ValidationFinding {
  return { severity: ValidationSeverity.WARNING, code, message, ...extra };
}
