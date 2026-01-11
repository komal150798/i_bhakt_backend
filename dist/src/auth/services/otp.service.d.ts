export declare class OtpService {
    private readonly OTP_EXPIRY_SECONDS;
    private readonly otpCache;
    private cleanExpired;
    generateOtp(phoneNumber: string, length?: number): string;
    issueOtp(phoneNumber: string): string;
    verifyOtp(phoneNumber: string, otpCode: string): boolean;
}
