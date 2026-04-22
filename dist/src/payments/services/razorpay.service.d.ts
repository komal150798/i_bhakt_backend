import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
export declare class RazorpayService {
    private readonly config;
    private readonly logger;
    private client;
    constructor(config: ConfigService);
    getKeyId(): string;
    isConfigured(): boolean;
    getClient(): Razorpay;
}
