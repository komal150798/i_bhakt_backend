import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { SmsCredential } from '../entities/sms-credential.entity';
export interface SmsSendResult {
    success: boolean;
    message_id?: string;
    error?: string;
}
export declare class SmsProviderService {
    private smsCredentialRepository;
    private httpService;
    private readonly logger;
    constructor(smsCredentialRepository: Repository<SmsCredential>, httpService: HttpService);
    getActiveCredential(): Promise<SmsCredential>;
    sendSms(to: string, message: string): Promise<SmsSendResult>;
    private sendViaTwilio;
    private sendViaMsg91;
    private sendViaTextLocal;
}
