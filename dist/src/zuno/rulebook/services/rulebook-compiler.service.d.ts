import { EntityManager } from 'typeorm';
import { ParsedWorkbook } from '../parsing/rulebook-parser.service';
export declare const RULEBOOK_COMPILER_VERSION = "rulebook-compiler-1.0.0";
export interface CompilationCounts {
    rules: number;
    interpretations: number;
    timingRules: number;
    remedies: number;
    domainConfigs: number;
    conflictRules: number;
    goldenCases: number;
    domainsCovered: string[];
}
export declare class RulebookCompilerService {
    compile(manager: EntityManager, rulebookVersionId: string, workbook: ParsedWorkbook): Promise<CompilationCounts>;
    private buildConditions;
    private inferCondition;
}
