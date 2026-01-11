import { Repository } from 'typeorm';
import { EmailTemplate } from '../../entities/email-template.entity';
import { CreateEmailTemplateDto } from '../../dto/create-email-template.dto';
export declare class AdminEmailTemplateController {
    private emailTemplateRepository;
    constructor(emailTemplateRepository: Repository<EmailTemplate>);
    getAll(): Promise<{
        success: boolean;
        data: EmailTemplate[];
    }>;
    getOne(id: number): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: EmailTemplate;
        message?: undefined;
    }>;
    getByCode(code: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: EmailTemplate;
        message?: undefined;
    }>;
    create(dto: CreateEmailTemplateDto, req: any): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: EmailTemplate;
        message?: undefined;
    }>;
    update(id: number, dto: Partial<CreateEmailTemplateDto>, req: any): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: EmailTemplate;
        message?: undefined;
    }>;
    delete(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
