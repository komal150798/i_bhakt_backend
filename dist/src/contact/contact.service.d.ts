import { Repository } from 'typeorm';
import { ContactInquiry } from './entities/contact-inquiry.entity';
import { CreateContactDto } from './dto/create-contact.dto';
export declare class ContactService {
    private readonly contactRepository;
    private readonly logger;
    constructor(contactRepository: Repository<ContactInquiry>);
    create(dto: CreateContactDto): Promise<ContactInquiry>;
    findAll(): Promise<ContactInquiry[]>;
}
