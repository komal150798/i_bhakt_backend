import { BaseEntity } from '../../common/entities/base.entity';
import { Customer } from '../../users/entities/customer.entity';
import { KarmaType } from '../../common/enums/karma-type.enum';
export declare class KarmaEntry extends BaseEntity {
    user_id: number;
    text: string;
    karma_type: KarmaType;
    score: number;
    category_slug: string | null;
    category_name: string | null;
    self_assessment: 'good' | 'bad' | 'neutral' | null;
    entry_date: Date;
    ai_analysis: Record<string, any> | null;
    metadata: Record<string, any> | null;
    customer: Customer;
}
