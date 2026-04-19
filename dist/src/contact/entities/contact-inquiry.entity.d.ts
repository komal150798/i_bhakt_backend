import { BaseEntity } from '../../common/entities/base.entity';
export declare class ContactInquiry extends BaseEntity {
    name: string;
    email: string;
    phone: string | null;
    subject: string;
    message: string;
    status: string;
}
