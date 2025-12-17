import { User } from '../../../users/entities/user.entity';
import { UserRole } from '../../../common/enums/user-role.enum';

export interface CreateUserInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  password?: string;
  role?: UserRole;
  gender?: string;
  date_of_birth?: string;
  time_of_birth?: string;
  place_name?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  nakshatra?: string;
  pada?: number;
  moon_longitude_deg?: number;
  dasha_at_birth?: string;
  referral_code?: string;
  referred_by_id?: number;
  plan?: string;
  is_verified?: boolean;
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  password?: string;
  role?: UserRole;
  gender?: string;
  avatar_url?: string;
  date_of_birth?: string;
  time_of_birth?: string;
  place_name?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  nakshatra?: string;
  pada?: number;
  moon_longitude_deg?: number;
  dasha_at_birth?: string;
  referral_code?: string;
  referred_by_id?: number;
  plan?: string;
  is_verified?: boolean;
  questionnaire_completed?: boolean;
}

export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPhoneNumber(phoneNumber: string): Promise<User | null>;
  findByReferralCode(referralCode: string): Promise<User | null>;
  findByRole(role: UserRole): Promise<User[]>;
  findAll(options?: { is_deleted?: boolean; role?: UserRole }): Promise<User[]>;
  create(data: CreateUserInput): Promise<User>;
  update(user: User, data: UpdateUserInput): Promise<User>;
  delete(user: User): Promise<void>;
}

