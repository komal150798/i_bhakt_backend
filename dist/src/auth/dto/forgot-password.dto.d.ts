export declare class SendForgotPasswordOtpDto {
    phone_number?: string;
    email?: string;
}
export declare class ResetPasswordDto {
    phone_number?: string;
    email?: string;
    otp_code: string;
    new_password: string;
}
