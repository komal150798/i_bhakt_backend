import { Repository } from 'typeorm';
import { SmsTemplate } from '../entities/sms-template.entity';
import { EmailTemplate } from '../entities/email-template.entity';
export declare class TemplateService {
    private smsTemplateRepository;
    private emailTemplateRepository;
    constructor(smsTemplateRepository: Repository<SmsTemplate>, emailTemplateRepository: Repository<EmailTemplate>);
    render(templateString: string, vars: Record<string, any>): string;
    getSmsTemplate(templateCode: string): Promise<SmsTemplate>;
    getEmailTemplate(templateCode: string): Promise<EmailTemplate>;
    renderSmsTemplate(templateCode: string, vars: Record<string, any>): Promise<string>;
    renderEmailTemplate(templateCode: string, vars: Record<string, any>): Promise<{
        subject: string;
        body: string;
        is_html: boolean;
    }>;
    private escapeRegex;
}
