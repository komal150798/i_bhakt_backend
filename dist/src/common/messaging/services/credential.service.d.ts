import { Repository, DataSource } from 'typeorm';
import { SmsCredential } from '../entities/sms-credential.entity';
import { EmailCredential } from '../entities/email-credential.entity';
export declare class CredentialService {
    private smsCredentialRepository;
    private emailCredentialRepository;
    private dataSource;
    constructor(smsCredentialRepository: Repository<SmsCredential>, emailCredentialRepository: Repository<EmailCredential>, dataSource: DataSource);
    deactivateAllSmsCredentials(): Promise<void>;
    deactivateAllEmailCredentials(): Promise<void>;
    activateSmsCredential(credentialId: number): Promise<void>;
    activateEmailCredential(credentialId: number): Promise<void>;
    validateSingleActiveSms(): Promise<void>;
    validateSingleActiveEmail(): Promise<void>;
}
