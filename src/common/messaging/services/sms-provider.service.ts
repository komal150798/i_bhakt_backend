import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SmsCredential } from '../entities/sms-credential.entity';

export interface SmsSendResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

@Injectable()
export class SmsProviderService {
  private readonly logger = new Logger(SmsProviderService.name);

  constructor(
    @InjectRepository(SmsCredential)
    private smsCredentialRepository: Repository<SmsCredential>,
    private httpService: HttpService,
  ) {}

  /**
   * Get active SMS credential
   */
  async getActiveCredential(): Promise<SmsCredential> {
    const credential = await this.smsCredentialRepository.findOne({
      where: {
        is_active: true,
        is_deleted: false,
      },
    });

    if (!credential) {
      throw new NotFoundException(
        'No active SMS credential found. Please configure one in admin panel.',
      );
    }

    return credential;
  }

  /**
   * Send SMS using active provider
   */
  async sendSms(
    to: string,
    message: string,
  ): Promise<SmsSendResult> {
    const credential = await this.getActiveCredential();

    try {
      switch (credential.provider_name.toUpperCase()) {
        case 'TWILIO':
          return await this.sendViaTwilio(credential, to, message);
        case 'MSG91':
          return await this.sendViaMsg91(credential, to, message);
        case 'TEXTLOCAL':
          return await this.sendViaTextLocal(credential, to, message);
        default:
          throw new BadRequestException(
            `Unsupported SMS provider: ${credential.provider_name}`,
          );
      }
    } catch (error) {
      this.logger.error(`Failed to send SMS via ${credential.provider_name}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }

  /**
   * Send SMS via Twilio
   */
  private async sendViaTwilio(
    credential: SmsCredential,
    to: string,
    message: string,
  ): Promise<SmsSendResult> {
    const baseUrl = credential.base_url || 'https://api.twilio.com/2010-04-01';
    const accountSid = credential.api_key;
    const authToken = credential.api_secret;

    if (!authToken) {
      throw new BadRequestException('Twilio requires api_secret (auth token)');
    }

    const from = credential.sender_id || credential.extra_config?.from_number;

    if (!from) {
      throw new BadRequestException('Twilio requires sender_id or from_number in extra_config');
    }

    const url = `${baseUrl}/Accounts/${accountSid}/Messages.json`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          new URLSearchParams({
            From: from,
            To: to,
            Body: message,
          }),
          {
            auth: {
              username: accountSid,
              password: authToken,
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      return {
        success: true,
        message_id: response.data.sid,
      };
    } catch (error) {
      throw new Error(`Twilio API error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Send SMS via MSG91
   */
  private async sendViaMsg91(
    credential: SmsCredential,
    to: string,
    message: string,
  ): Promise<SmsSendResult> {
    const baseUrl = credential.base_url || 'https://api.msg91.com/api/v5/flow';
    const authKey = credential.api_key;
    const senderId = credential.sender_id || 'IBHAKT';

    const url = `${baseUrl}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            template_id: credential.extra_config?.template_id,
            sender: senderId,
            short_url: '0',
            mobiles: to,
            ...credential.extra_config,
          },
          {
            headers: {
              'authkey': authKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        success: true,
        message_id: response.data.request_id || response.data.message,
      };
    } catch (error) {
      throw new Error(`MSG91 API error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Send SMS via TextLocal
   */
  private async sendViaTextLocal(
    credential: SmsCredential,
    to: string,
    message: string,
  ): Promise<SmsSendResult> {
    const baseUrl = credential.base_url || 'https://api.textlocal.in/send';
    const apiKey = credential.api_key;
    const sender = credential.sender_id || 'TXTLCL';

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          baseUrl,
          {
            apikey: apiKey,
            numbers: to,
            message: message,
            sender: sender,
          },
        ),
      );

      return {
        success: response.data.status === 'success',
        message_id: response.data.batch_id,
      };
    } catch (error) {
      throw new Error(`TextLocal API error: ${error.response?.data?.message || error.message}`);
    }
  }
}



