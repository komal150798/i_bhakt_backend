import { RulebookSheet } from '../../common/enums';
export interface ColumnSpec {
    header: string;
    field: string;
    required: boolean;
    aliases?: string[];
    description: string;
}
export interface SheetSpec {
    sheet: RulebookSheet;
    required: boolean;
    columns: ColumnSpec[];
    description: string;
}
export declare const RULEBOOK_WORKBOOK_SCHEMA: readonly SheetSpec[];
export declare function sheetSpec(sheet: RulebookSheet): SheetSpec | undefined;
export declare function normaliseHeader(header: string): string;
