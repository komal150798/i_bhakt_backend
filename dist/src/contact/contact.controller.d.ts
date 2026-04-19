import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
export declare class ContactController {
    private readonly contactService;
    constructor(contactService: ContactService);
    submitInquiry(dto: CreateContactDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
        };
    }>;
    listInquiries(): Promise<{
        success: boolean;
        data: import("./entities/contact-inquiry.entity").ContactInquiry[];
    }>;
}
