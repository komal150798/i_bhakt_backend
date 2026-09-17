import { RulebookSheet } from '../../common/enums';
import { ValidationFinding } from '../entities/zuno-rulebook-governance.entity';
export interface ParsedRow {
    __row: number;
    [field: string]: unknown;
}
export interface ParsedWorkbook {
    sheets: Map<RulebookSheet, ParsedRow[]>;
    findings: ValidationFinding[];
    fileHash: string;
    fileSize: number;
}
export declare const RULEBOOK_PARSER_VERSION = "rulebook-parser-1.0.0";
export declare class RulebookParserService {
    private readonly logger;
    private readonly injectionPatterns;
    parse(buffer: Buffer, fileName: string): Promise<ParsedWorkbook>;
    private parseSheet;
    private cellText;
    private sanitise;
}
