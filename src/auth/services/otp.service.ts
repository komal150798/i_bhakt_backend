import { Injectable } from '@nestjs/common';

interface OTPEntry {
  code: string;
  expiry: number;
}

@Injectable()
export class OtpService {
  private readonly OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes
  private readonly otpCache: Map<string, OTPEntry> = new Map();

  private cleanExpired(): void {
    const now = Date.now() / 1000;
    const expiredKeys: string[] = [];
    
    this.otpCache.forEach((entry, key) => {
      if (entry.expiry < now) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => this.otpCache.delete(key));
  }

  generateOtp(phoneNumber: string, length: number = 6): string {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
  }

  issueOtp(phoneNumber: string): string {
    this.cleanExpired();
    const code = this.generateOtp(phoneNumber);
    const expiry = Date.now() / 1000 + this.OTP_EXPIRY_SECONDS;
    
    this.otpCache.set(phoneNumber, { code, expiry });
    return code;
  }

  verifyOtp(phoneNumber: string, otpCode: string): boolean {
    this.cleanExpired();
    const entry = this.otpCache.get(phoneNumber);
    
    if (!entry) {
      return false;
    }
    
    if (entry.expiry < Date.now() / 1000) {
      this.otpCache.delete(phoneNumber);
      return false;
    }
    
    if (entry.code !== otpCode) {
      return false;
    }
    
    // Successful verification - remove entry
    this.otpCache.delete(phoneNumber);
    return true;
  }
}







