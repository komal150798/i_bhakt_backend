import { Repository } from 'typeorm';
import { SmsTemplate } from '../../entities/sms-template.entity';
import { CreateSmsTemplateDto } from '../../dto/create-sms-template.dto';
export declare class AdminSmsTemplateController {
    private smsTemplateRepository;
    constructor(smsTemplateRepository: Repository<SmsTemplate>);
    getAll(): Promise<{
        success: boolean;
        data: SmsTemplate[];
    }>;
    getOne(id: number): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: SmsTemplate;
        message?: undefined;
    }>;
    getByCode(code: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: SmsTemplate;
        message?: undefined;
    }>;
    create(dto: CreateSmsTemplateDto, req: any): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: SmsTemplate;
        message?: undefined;
    }>;
    update(id: number, dto: Partial<CreateSmsTemplateDto>, req: any): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: SmsTemplate;
        message?: undefined;
    }>;
    delete(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
