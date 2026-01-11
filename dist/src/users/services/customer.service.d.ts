import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { UpdateCustomerProfileDto } from '../dtos/update-customer-profile.dto';
import { ListUsersDto } from '../dtos/list-users.dto';
import { KundliService } from '../../kundli/services/kundli.service';
import { IKundliRepository } from '../../core/interfaces/repositories/kundli-repository.interface';
export declare class CustomerService {
    private readonly customerRepository;
    private readonly kundliService;
    private readonly kundliRepository;
    private readonly logger;
    constructor(customerRepository: Repository<Customer>, kundliService: KundliService, kundliRepository: IKundliRepository);
    findOne(id: number): Promise<Customer>;
    getProfile(id: number): Promise<Partial<Customer>>;
    updateProfile(id: number, updateData: UpdateCustomerProfileDto): Promise<Customer>;
    private updateKundliOnProfileChange;
    findByUniqueId(uniqueId: string): Promise<Customer>;
    findAll(dto: ListUsersDto): Promise<{
        data: Customer[];
        meta: any;
    }>;
}
