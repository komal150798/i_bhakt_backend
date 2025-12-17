import { Injectable } from '@nestjs/common';
import { TemplateService } from './template.service';
import { SmsProviderService, SmsSendResult } from './sms-provider.service';
import { EmailProviderService, EmailSendResult, EmailSendOptions } from './email-provider.service';

@Injectable()
export class MessagingService {
  constructor(
    private templateService: TemplateService,
    private smsProviderService: SmsProviderService,
    private emailProviderService: EmailProviderService,
  ) {}

  /**
   * Send SMS using template
   */
  async sendSmsWithTemplate(
    to: string,
    templateCode: string,
    variables: Record<string, any>,
  ): Promise<SmsSendResult> {
    const message = await this.templateService.renderSmsTemplate(templateCode, variables);
    return this.smsProviderService.sendSms(to, message);
  }

  /**
   * Send SMS with raw message
   */
  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    return this.smsProviderService.sendSms(to, message);
  }

  /**
   * Send Email using template
   */
  async sendEmailWithTemplate(
    to: string | string[],
    templateCode: string,
    variables: Record<string, any>,
    options?: {
      cc?: string | string[];
      bcc?: string | string[];
    },
  ): Promise<EmailSendResult> {
    const rendered = await this.templateService.renderEmailTemplate(templateCode, variables);
    
    return this.emailProviderService.sendEmail({
      to,
      subject: rendered.subject,
      body: rendered.body,
      is_html: rendered.is_html,
      ...options,
    });
  }

  /**
   * Send Email with raw content
   */
  async sendEmail(options: EmailSendOptions): Promise<EmailSendResult> {
    return this.emailProviderService.sendEmail(options);
  }
}



