"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RulebookParserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulebookParserService = exports.RULEBOOK_PARSER_VERSION = void 0;
const common_1 = require("@nestjs/common");
const ExcelJS = require("exceljs");
const crypto_1 = require("crypto");
const workbook_schema_1 = require("./workbook-schema");
const enums_1 = require("../../common/enums");
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_ROWS_PER_SHEET = 20000;
const MAX_CELL_CHARS = 8000;
exports.RULEBOOK_PARSER_VERSION = 'rulebook-parser-1.0.0';
let RulebookParserService = RulebookParserService_1 = class RulebookParserService {
    constructor() {
        this.logger = new common_1.Logger(RulebookParserService_1.name);
        this.injectionPatterns = [
            /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,
            /disregard\s+(the\s+)?(system|previous|above)/i,
            /you\s+are\s+now\s+(a|an)\s+/i,
            /\bsystem\s*prompt\b/i,
            /\b(act|behave)\s+as\s+(if|though)\s+you/i,
            /<\s*\/?\s*(script|iframe|system|instruction)\b/i,
            /\boverride\s+(the\s+)?(safety|policy|guardrail)/i,
        ];
    }
    async parse(buffer, fileName) {
        const findings = [];
        const sheets = new Map();
        const fileHash = (0, crypto_1.createHash)('sha256').update(buffer).digest('hex');
        const fileSize = buffer.length;
        if (fileSize === 0) {
            findings.push(error('EMPTY_FILE', 'The uploaded file is empty.'));
            return { sheets, findings, fileHash, fileSize };
        }
        if (fileSize > MAX_FILE_BYTES) {
            findings.push(error('FILE_TOO_LARGE', `File is ${(fileSize / 1048576).toFixed(1)} MB; the limit is ${MAX_FILE_BYTES / 1048576} MB.`));
            return { sheets, findings, fileHash, fileSize };
        }
        if (/\.xlsm$/i.test(fileName)) {
            findings.push(error('MACRO_WORKBOOK_REJECTED', 'Macro-enabled workbooks (.xlsm) are not accepted. Please save as .xlsx.'));
            return { sheets, findings, fileHash, fileSize };
        }
        if (!/\.xlsx$/i.test(fileName)) {
            findings.push(error('UNSUPPORTED_FILE_TYPE', 'Only .xlsx workbooks are supported.'));
            return { sheets, findings, fileHash, fileSize };
        }
        const workbook = new ExcelJS.Workbook();
        try {
            await workbook.xlsx.load(buffer);
        }
        catch (e) {
            findings.push(error('WORKBOOK_UNREADABLE', 'The workbook could not be read. It may be corrupted or password protected.'));
            this.logger.warn(`Workbook parse failed: ${e instanceof Error ? e.name : 'unknown'}`);
            return { sheets, findings, fileHash, fileSize };
        }
        const available = new Map();
        workbook.eachSheet((ws) => available.set((0, workbook_schema_1.normaliseHeader)(ws.name), ws));
        for (const spec of workbook_schema_1.RULEBOOK_WORKBOOK_SCHEMA) {
            const ws = available.get((0, workbook_schema_1.normaliseHeader)(spec.sheet));
            if (!ws) {
                if (spec.required) {
                    findings.push(error('MISSING_SHEET', `Required worksheet "${spec.sheet}" was not found.`, { sheet: spec.sheet }));
                }
                continue;
            }
            const { rows, sheetFindings } = this.parseSheet(ws, spec.sheet);
            sheets.set(spec.sheet, rows);
            findings.push(...sheetFindings);
        }
        return { sheets, findings, fileHash, fileSize };
    }
    parseSheet(worksheet, sheet) {
        const spec = (0, workbook_schema_1.sheetSpec)(sheet);
        const sheetFindings = [];
        const rows = [];
        const headerRow = worksheet.getRow(1);
        if (!headerRow || headerRow.cellCount === 0) {
            sheetFindings.push(error('MISSING_HEADER_ROW', `Sheet "${sheet}" has no header row.`, {
                sheet,
            }));
            return { rows, sheetFindings };
        }
        const columnToField = new Map();
        const seenFields = new Set();
        headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const header = (0, workbook_schema_1.normaliseHeader)(this.cellText(cell));
            if (!header)
                return;
            const match = spec.columns.find((c) => (0, workbook_schema_1.normaliseHeader)(c.header) === header ||
                (c.aliases ?? []).some((a) => (0, workbook_schema_1.normaliseHeader)(a) === header));
            if (match) {
                columnToField.set(colNumber, match.field);
                seenFields.add(match.field);
            }
        });
        for (const column of spec.columns) {
            if (column.required && !seenFields.has(column.field)) {
                sheetFindings.push(error('MISSING_COLUMN', `Sheet "${sheet}" is missing the required column "${column.header}".`, { sheet, column: column.header }));
            }
        }
        if (sheetFindings.some((f) => f.severity === enums_1.ValidationSeverity.ERROR)) {
            return { rows, sheetFindings };
        }
        let processed = 0;
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1)
                return;
            if (processed >= MAX_ROWS_PER_SHEET)
                return;
            const parsed = { __row: rowNumber };
            let hasAnyValue = false;
            columnToField.forEach((field, colNumber) => {
                const cell = row.getCell(colNumber);
                const raw = this.cellText(cell);
                if (raw.length > 0)
                    hasAnyValue = true;
                const { value, findings: cellFindings } = this.sanitise(raw, sheet, rowNumber, field);
                parsed[field] = value;
                sheetFindings.push(...cellFindings);
            });
            if (!hasAnyValue)
                return;
            rows.push(parsed);
            processed++;
        });
        if (processed >= MAX_ROWS_PER_SHEET) {
            sheetFindings.push(error('TOO_MANY_ROWS', `Sheet "${sheet}" exceeds the ${MAX_ROWS_PER_SHEET}-row limit; the remainder was not read.`, { sheet }));
        }
        return { rows, sheetFindings };
    }
    cellText(cell) {
        const value = cell?.value;
        if (value === null || value === undefined)
            return '';
        if (typeof value === 'string')
            return value;
        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }
        if (value instanceof Date)
            return value.toISOString().slice(0, 10);
        if (typeof value === 'object') {
            const v = value;
            if ('formula' in v || 'sharedFormula' in v) {
                const result = v.result;
                if (result === null || result === undefined)
                    return '';
                if (result instanceof Date)
                    return result.toISOString().slice(0, 10);
                if (typeof result === 'object')
                    return '';
                return String(result);
            }
            if ('richText' in v && Array.isArray(v.richText)) {
                return v.richText
                    .map((part) => part.text ?? '')
                    .join('');
            }
            if ('text' in v && typeof v.text === 'string')
                return v.text;
            if ('error' in v)
                return '';
        }
        return '';
    }
    sanitise(raw, sheet, row, field) {
        const findings = [];
        if (!raw)
            return { value: '', findings };
        let value = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
        value = value.replace(/\s+$/g, '').replace(/^\s+/g, '');
        if (value.length > MAX_CELL_CHARS) {
            value = value.slice(0, MAX_CELL_CHARS);
            findings.push(warning('CELL_TRUNCATED', `Value was longer than ${MAX_CELL_CHARS} characters and was truncated.`, { sheet, row, column: field }));
        }
        for (const pattern of this.injectionPatterns) {
            if (pattern.test(value)) {
                findings.push(warning('POSSIBLE_PROMPT_INJECTION', 'This cell contains instruction-like language. Rulebook content is reference data and can never override ZUNO policy or safety, but please confirm the wording is intended.', { sheet, row, column: field }));
                this.logger.warn(`Possible prompt injection in ${sheet} row ${row} column ${field}`);
                break;
            }
        }
        if (/^[=+\-@\t\r]/.test(value)) {
            value = `'${value}`;
            findings.push(warning('FORMULA_PREFIX_NEUTRALISED', 'Value began with a spreadsheet formula character and was escaped.', { sheet, row, column: field }));
        }
        return { value, findings };
    }
};
exports.RulebookParserService = RulebookParserService;
exports.RulebookParserService = RulebookParserService = RulebookParserService_1 = __decorate([
    (0, common_1.Injectable)()
], RulebookParserService);
function error(code, message, extra = {}) {
    return { severity: enums_1.ValidationSeverity.ERROR, code, message, ...extra };
}
function warning(code, message, extra = {}) {
    return { severity: enums_1.ValidationSeverity.WARNING, code, message, ...extra };
}
//# sourceMappingURL=rulebook-parser.service.js.map