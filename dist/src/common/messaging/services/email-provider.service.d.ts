import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { EmailCredential } from '../entities/email-credential.entity';
export interface EmailSendResult {
    success: boolean;
    message_id?: string;
    error?: string;
}
export interface EmailSendOptions {
    to: string | string[];
    subject: string;
    body: string;
    is_html?: boolean;
    cc?: string | string[];
    bcc?: string | string[];
}
export declare class EmailProviderService {
    private emailCredentialRepository;
    private httpService;
    private readonly logger;
    constructor(emailCredentialRepository: Repository<EmailCredential>, httpService: HttpService);
    getActiveCredential(): Promise<EmailCredential>;
    sendEmail(options: EmailSendOptions): Promise<EmailSendResult>;
    private sendViaMailgun;
    private sendViaSendGrid;
    private sendViaSES;
}
