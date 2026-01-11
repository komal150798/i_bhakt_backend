import { User } from './user.entity';
import { GuidanceTemplate } from './guidance-template.entity';
export declare class DailyGuidanceLog {
    id: number;
    user_id: number;
    user: User;
    template_id: number;
    template: GuidanceTemplate;
    guidance_date: Date;
    delivery_channel: string;
    delivered_at: Date;
    notes: string;
}
