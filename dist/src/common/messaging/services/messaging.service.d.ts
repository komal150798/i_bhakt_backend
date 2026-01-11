import { TemplateService } from './template.service';
import { SmsProviderService, SmsSendResult } from './sms-provider.service';
import { EmailProviderService, EmailSendResult, EmailSendOptions } from './email-provider.service';
export declare class MessagingService {
    private templateService;
    private smsProviderService;
    private emailProviderService;
    constructor(templateService: TemplateService, smsProviderService: SmsProviderService, emailProviderService: EmailProviderService);
    sendSmsWithTemplate(to: string, templateCode: string, variables: Record<string, any>): Promise<SmsSendResult>;
    sendSms(to: string, message: string): Promise<SmsSendResult>;
    sendEmailWithTemplate(to: string | string[], templateCode: string, variables: Record<string, any>, options?: {
        cc?: string | string[];
        bcc?: string | string[];
    }): Promise<EmailSendResult>;
    sendEmail(options: EmailSendOptions): Promise<EmailSendResult>;
}
