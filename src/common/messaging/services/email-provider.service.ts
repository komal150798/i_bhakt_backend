import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
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

@Injectable()
export class EmailProviderService {
  private readonly logger = new Logger(EmailProviderService.name);

  constructor(
    @InjectRepository(EmailCredential)
    private emailCredentialRepository: Repository<EmailCredential>,
    private httpService: HttpService,
  ) {}

  /**
   * Get active Email credential
   */
  async getActiveCredential(): Promise<EmailCredential> {
    const credential = await this.emailCredentialRepository.findOne({
      where: {
        is_active: true,
        is_deleted: false,
      },
    });

    if (!credential) {
      throw new NotFoundException(
        'No active Email credential found. Please configure one in admin panel.',
      );
    }

    return credential;
  }

  /**
   * Send Email using active provider
   */
  async sendEmail(options: EmailSendOptions): Promise<EmailSendResult> {
    const credential = await this.getActiveCredential();

    try {
      switch (credential.provider_name.toUpperCase()) {
        case 'MAILGUN':
          return await this.sendViaMailgun(credential, options);
        case 'SENDGRID':
          return await this.sendViaSendGrid(credential, options);
        case 'SES':
          return await this.sendViaSES(credential, options);
        default:
          throw new BadRequestException(
            `Unsupported Email provider: ${credential.provider_name}`,
          );
      }
    } catch (error) {
      this.logger.error(`Failed to send Email via ${credential.provider_name}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to send Email',
      };
    }
  }

  /**
   * Send Email via Mailgun
   */
  private async sendViaMailgun(
    credential: EmailCredential,
    options: EmailSendOptions,
  ): Promise<EmailSendResult> {
    const domain = credential.domain || credential.extra_config?.domain;
    if (!domain) {
      throw new BadRequestException('Mailgun requires domain');
    }

    const baseUrl = credential.base_url || `https://api.mailgun.net/v3/${domain}`;
    const apiKey = credential.api_key;

    const toArray = Array.isArray(options.to) ? options.to : [options.to];
    const formData = new URLSearchParams();
    formData.append('from', `${credential.from_name || 'iBhakt'} <${credential.from_email}>`);
    toArray.forEach(email => formData.append('to', email));
    formData.append('subject', options.subject);
    formData.append(options.is_html ? 'html' : 'text', options.body);

    if (options.cc) {
      const ccArray = Array.isArray(options.cc) ? options.cc : [options.cc];
      ccArray.forEach(email => formData.append('cc', email));
    }

    if (options.bcc) {
      const bccArray = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
      bccArray.forEach(email => formData.append('bcc', email));
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${baseUrl}/messages`,
          formData,
          {
            auth: {
              username: 'api',
              password: apiKey,
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      return {
        success: true,
        message_id: response.data.id,
      };
    } catch (error) {
      throw new Error(`Mailgun API error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Send Email via SendGrid
   */
  private async sendViaSendGrid(
    credential: EmailCredential,
    options: EmailSendOptions,
  ): Promise<EmailSendResult> {
    const baseUrl = credential.base_url || 'https://api.sendgrid.com/v3';
    const apiKey = credential.api_key;

    const toArray = Array.isArray(options.to) ? options.to : [options.to];
    const personalizations = [
      {
        to: toArray.map(email => ({ email })),
        ...(options.cc && {
          cc: (Array.isArray(options.cc) ? options.cc : [options.cc]).map(email => ({ email })),
        }),
        ...(options.bcc && {
          bcc: (Array.isArray(options.bcc) ? options.bcc : [options.bcc]).map(email => ({ email })),
        }),
      },
    ];

    const payload = {
      personalizations,
      from: {
        email: credential.from_email,
        name: credential.from_name || 'iBhakt',
      },
      subject: options.subject,
      content: [
        {
          type: options.is_html ? 'text/html' : 'text/plain',
          value: options.body,
        },
      ],
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${baseUrl}/mail/send`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        success: true,
        message_id: response.headers['x-message-id'] || 'sent',
      };
    } catch (error) {
      throw new Error(`SendGrid API error: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  /**
   * Send Email via AWS SES
   */
  private async sendViaSES(
    credential: EmailCredential,
    options: EmailSendOptions,
  ): Promise<EmailSendResult> {
    // AWS SES requires AWS SDK
    // This is a stub implementation - in production, use @aws-sdk/client-ses
    this.logger.warn('AWS SES integration requires AWS SDK. Please install @aws-sdk/client-ses');

    // For now, return a placeholder
    // TODO: Implement actual SES sending using AWS SDK
    throw new BadRequestException(
      'AWS SES integration not yet implemented. Please use Mailgun or SendGrid.',
    );
  }
}



