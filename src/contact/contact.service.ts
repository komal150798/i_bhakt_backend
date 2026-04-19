import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactInquiry } from './entities/contact-inquiry.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectRepository(ContactInquiry)
    private readonly contactRepository: Repository<ContactInquiry>,
  ) {}

  async create(dto: CreateContactDto): Promise<ContactInquiry> {
    const inquiry = this.contactRepository.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone || null,
      subject: dto.subject,
      message: dto.message,
      status: 'pending',
    });

    const saved = await this.contactRepository.save(inquiry);
    this.logger.log(`Contact inquiry saved: ${saved.id} from ${dto.email}`);
    return saved;
  }

  async findAll(): Promise<ContactInquiry[]> {
    return this.contactRepository.find({
      where: { is_deleted: false },
      order: { added_date: 'DESC' },
    });
  }
}
