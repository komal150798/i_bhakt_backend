import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IUserRepository, CreateUserInput, UpdateUserInput } from '../../core/interfaces/repositories/user-repository.interface';
import { UserRole } from '../../common/enums/user-role.enum';
export declare class UserRepository implements IUserRepository {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    findById(id: number): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByPhoneNumber(phoneNumber: string): Promise<User | null>;
    findByReferralCode(referralCode: string): Promise<User | null>;
    findByRole(role: UserRole): Promise<User[]>;
    findAll(options?: {
        is_deleted?: boolean;
        role?: UserRole;
    }): Promise<User[]>;
    create(data: CreateUserInput): Promise<User>;
    update(user: User, data: UpdateUserInput): Promise<User>;
    delete(user: User): Promise<void>;
}
