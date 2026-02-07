import { Repository } from 'typeorm';
import { Customer } from '../../users/entities/customer.entity';
export interface IssueOtpResult {
    otp_code: string;
    expires_at: Date;
    purpose: string;
    remaining_attempts: number;
}
export declare class OtpService {
    private readonly customerRepository;
    private readonly logger;
    private readonly OTP_EXPIRY_SECONDS;
    private readonly MAX_ATTEMPTS;
    private readonly RESEND_COOLDOWN_SECONDS;
    private readonly OTP_LENGTH;
    constructor(customerRepository: Repository<Customer>);
    generateOtp(length?: number): string;
    private findCustomerByIdentifier;
    issueOtp(identifier: string, purpose?: string): Promise<IssueOtpResult>;
    verifyOtp(identifier: string, otpCode: string): Promise<boolean>;
    getResendCooldown(identifier: string): Promise<number>;
}
