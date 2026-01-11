import { Repository } from 'typeorm';
import { SmsCredential } from '../../entities/sms-credential.entity';
import { CreateSmsCredentialDto } from '../../dto/create-sms-credential.dto';
import { CredentialService } from '../../services/credential.service';
export declare class AdminSmsCredentialController {
    private smsCredentialRepository;
    private credentialService;
    constructor(smsCredentialRepository: Repository<SmsCredential>, credentialService: CredentialService);
    getAll(): Promise<{
        success: boolean;
        data: SmsCredential[];
    }>;
    getOne(id: number): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: SmsCredential;
        message?: undefined;
    }>;
    create(dto: CreateSmsCredentialDto, req: any): Promise<{
        success: boolean;
        data: SmsCredential;
    }>;
    update(id: number, dto: Partial<CreateSmsCredentialDto>, req: any): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: SmsCredential;
        message?: undefined;
    }>;
    delete(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    activate(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
