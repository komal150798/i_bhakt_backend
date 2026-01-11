import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AdminUser } from '../../../users/entities/admin-user.entity';
export declare class SeedService implements OnModuleInit {
    private readonly adminUserRepository;
    private readonly logger;
    constructor(adminUserRepository: Repository<AdminUser>);
    checkTableExists(): Promise<boolean>;
    onModuleInit(): Promise<void>;
    seedAdminUser(): Promise<void>;
}
