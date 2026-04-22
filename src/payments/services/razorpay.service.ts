import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private client: Razorpay | null = null;

  constructor(private readonly config: ConfigService) {}

  /** Key id for client-side Checkout (safe to expose) */
  getKeyId(): string {
    return this.config.get<string>('RAZORPAY_KEY_ID') || '';
  }

  isConfigured(): boolean {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    return Boolean(keyId && keySecret);
  }

  getClient(): Razorpay {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    }
    if (!this.client) {
      this.client = new Razorpay({
        key_id: this.config.get<string>('RAZORPAY_KEY_ID')!,
        key_secret: this.config.get<string>('RAZORPAY_KEY_SECRET')!,
      });
    }
    return this.client;
  }
}
