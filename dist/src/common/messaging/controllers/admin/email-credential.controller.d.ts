import { Repository } from 'typeorm';
import { EmailCredential } from '../../entities/email-credential.entity';
import { CreateEmailCredentialDto } from '../../dto/create-email-credential.dto';
import { CredentialService } from '../../services/credential.service';
export declare class AdminEmailCredentialController {
    private emailCredentialRepository;
    private credentialService;
    constructor(emailCredentialRepository: Repository<EmailCredential>, credentialService: CredentialService);
    getAll(): Promise<{
        success: boolean;
        data: EmailCredential[];
    }>;
    getOne(id: number): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: EmailCredential;
        message?: undefined;
    }>;
    create(dto: CreateEmailCredentialDto, req: any): Promise<{
        success: boolean;
        data: EmailCredential;
    }>;
    update(id: number, dto: Partial<CreateEmailCredentialDto>, req: any): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: EmailCredential;
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
