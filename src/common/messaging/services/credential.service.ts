import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SmsCredential } from '../entities/sms-credential.entity';
import { EmailCredential } from '../entities/email-credential.entity';

@Injectable()
export class CredentialService {
  constructor(
    @InjectRepository(SmsCredential)
    private smsCredentialRepository: Repository<SmsCredential>,
    @InjectRepository(EmailCredential)
    private emailCredentialRepository: Repository<EmailCredential>,
    private dataSource: DataSource,
  ) {}

  /**
   * Deactivate all SMS credentials
   */
  async deactivateAllSmsCredentials(): Promise<void> {
    await this.smsCredentialRepository.update(
      { is_active: true, is_deleted: false },
      { is_active: false },
    );
  }

  /**
   * Deactivate all Email credentials
   */
  async deactivateAllEmailCredentials(): Promise<void> {
    await this.emailCredentialRepository.update(
      { is_active: true, is_deleted: false },
      { is_active: false },
    );
  }

  /**
   * Activate SMS credential (deactivates others)
   */
  async activateSmsCredential(credentialId: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Deactivate all SMS credentials
      await manager.update(
        SmsCredential,
        { is_active: true, is_deleted: false },
        { is_active: false },
      );

      // Activate the selected one
      await manager.update(
        SmsCredential,
        { id: credentialId, is_deleted: false },
        { is_active: true },
      );
    });
  }

  /**
   * Activate Email credential (deactivates others)
   */
  async activateEmailCredential(credentialId: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Deactivate all Email credentials
      await manager.update(
        EmailCredential,
        { is_active: true, is_deleted: false },
        { is_active: false },
      );

      // Activate the selected one
      await manager.update(
        EmailCredential,
        { id: credentialId, is_deleted: false },
        { is_active: true },
      );
    });
  }

  /**
   * Validate only one active SMS credential
   */
  async validateSingleActiveSms(): Promise<void> {
    const activeCount = await this.smsCredentialRepository.count({
      where: { is_active: true, is_deleted: false },
    });

    if (activeCount > 1) {
      throw new BadRequestException(
        'Multiple active SMS credentials found. Only one can be active at a time.',
      );
    }
  }

  /**
   * Validate only one active Email credential
   */
  async validateSingleActiveEmail(): Promise<void> {
    const activeCount = await this.emailCredentialRepository.count({
      where: { is_active: true, is_deleted: false },
    });

    if (activeCount > 1) {
      throw new BadRequestException(
        'Multiple active Email credentials found. Only one can be active at a time.',
      );
    }
  }
}

