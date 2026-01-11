import { BaseEntity } from '../../common/entities/base.entity';
import { Customer } from '../../users/entities/customer.entity';
export declare class CustomerToken extends BaseEntity {
    token: string;
    customer_id: number;
    expires_at: Date;
    is_revoked: boolean;
    device_info: string | null;
    ip_address: string | null;
    login_method: 'password' | 'otp' | 'google' | null;
    customer: Customer;
}
