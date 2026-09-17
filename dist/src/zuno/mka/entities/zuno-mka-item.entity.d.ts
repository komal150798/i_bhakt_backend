import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { MkaDimension, RuleSafetyClass } from '../../common/enums';
import { MkaFrequency, MkaItemStatus, MkaPriority, MkaSourceType } from '../enums/mka.enum';
import { ZunoMkaProgram } from './zuno-mka-program.entity';
export interface MkaScheduleData {
    days_of_week?: number[];
    preferred_time?: string | null;
    duration_text?: string | null;
}
export declare class ZunoMkaItem extends ZunoBaseEntity {
    mka_program_id: string;
    user_id: string;
    dimension: MkaDimension;
    title: string;
    description: string;
    purpose: string | null;
    source_type: MkaSourceType;
    source_rule_key: string | null;
    source_remedy_key: string | null;
    source_rule_id: string | null;
    rulebook_version_id: string | null;
    frequency: MkaFrequency;
    schedule_data: MkaScheduleData;
    duration_minutes: number | null;
    priority: MkaPriority;
    valid_from: string | null;
    valid_to: string | null;
    plan_eligible: boolean;
    karma_eligible: boolean;
    safety_class: RuleSafetyClass;
    is_devotional: boolean;
    alternative_keys: string[];
    display_order: number;
    status: MkaItemStatus;
    program?: ZunoMkaProgram;
}
