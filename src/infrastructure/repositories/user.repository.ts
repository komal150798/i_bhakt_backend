import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  IUserRepository,
  CreateUserInput,
  UpdateUserInput,
} from '../../core/interfaces/repositories/user-repository.interface';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { phone_number: phoneNumber },
    });
  }

  async findByReferralCode(referralCode: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { referral_code: referralCode },
    });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { role },
    });
  }

  async findAll(options?: { is_deleted?: boolean; role?: UserRole }): Promise<User[]> {
    const where: any = {};
    if (options?.is_deleted !== undefined) {
      where.is_deleted = options.is_deleted;
    }
    if (options?.role) {
      where.role = options.role;
    }
    return this.userRepository.find({ where });
  }

  async create(data: CreateUserInput): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async update(user: User, data: UpdateUserInput): Promise<User> {
    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  async delete(user: User): Promise<void> {
    // Soft delete if is_deleted exists, otherwise hard delete
    if ('is_deleted' in user) {
      (user as any).is_deleted = true;
      await this.userRepository.save(user);
    } else {
      await this.userRepository.remove(user);
    }
  }
}

