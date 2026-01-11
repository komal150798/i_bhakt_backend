import { OnModuleInit } from '@nestjs/common';
import { SeedService } from './seeds/seed-admin.service';
export declare class DatabaseModule implements OnModuleInit {
    private readonly seedService;
    private readonly logger;
    constructor(seedService: SeedService);
    onModuleInit(): Promise<void>;
}
