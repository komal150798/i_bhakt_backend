import { DataSource, Repository } from 'typeorm';
import { ZunoUser } from '../entities/zuno-user.entity';
import { Customer } from '../../../users/entities/customer.entity';
export interface AuthenticatedPrincipal {
    id: number | string;
    unique_id: string;
    type: 'user' | 'admin';
    email?: string | null;
    phone_number?: string | null;
}
export declare class ZunoUserResolverService {
    private readonly users;
    private readonly customers;
    private readonly dataSource;
    private readonly logger;
    constructor(users: Repository<ZunoUser>, customers: Repository<Customer>, dataSource: DataSource);
    resolve(principal: AuthenticatedPrincipal): Promise<ZunoUser>;
    private provision;
    private assertUsable;
}
