import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { UpdateCustomerProfileDto } from '../dtos/update-customer-profile.dto';
import { ListUsersDto } from '../dtos/list-users.dto';
import { PlanType } from '../../common/enums/plan-type.enum';
import { KundliService } from '../../kundli/services/kundli.service';
import { IKundliRepository } from '../../core/interfaces/repositories/kundli-repository.interface';
import { Inject } from '@nestjs/common';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly kundliService: KundliService,
    @Inject('IKundliRepository')
    private readonly kundliRepository: IKundliRepository,
  ) {}

  /**
   * Get customer by ID
   */
  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  /**
   * Get customer profile (with sensitive data filtered)
   */
  async getProfile(id: number): Promise<Partial<Customer>> {
    const customer = await this.findOne(id);

    return {
      id: customer.id,
      unique_id: customer.unique_id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone_number: customer.phone_number,
      date_of_birth: customer.date_of_birth,
      time_of_birth: customer.time_of_birth,
      place_name: customer.place_name,
      latitude: customer.latitude,
      longitude: customer.longitude,
      timezone: customer.timezone,
      gender: customer.gender,
      avatar_url: customer.avatar_url,
      nakshatra: customer.nakshatra,
      pada: customer.pada,
      current_plan: customer.current_plan,
      is_verified: customer.is_verified,
      referral_code: customer.referral_code,
      added_date: customer.added_date,
      modify_date: customer.modify_date,
    };
  }

  /**
   * Update customer profile
   */
  async updateProfile(id: number, updateData: UpdateCustomerProfileDto): Promise<Customer> {
    const customer = await this.findOne(id);

    // Update fields
    if (updateData.first_name !== undefined) {
      customer.first_name = updateData.first_name;
    }
    if (updateData.last_name !== undefined) {
      customer.last_name = updateData.last_name;
    }
    if (updateData.email !== undefined) {
      customer.email = updateData.email;
    }
    if (updateData.date_of_birth !== undefined) {
      customer.date_of_birth = updateData.date_of_birth ? new Date(updateData.date_of_birth) : null;
    }
    if (updateData.time_of_birth !== undefined) {
      customer.time_of_birth = updateData.time_of_birth || null;
    }
    if (updateData.place_name !== undefined) {
      customer.place_name = updateData.place_name || null;
    }
    if (updateData.latitude !== undefined) {
      customer.latitude = updateData.latitude || null;
    }
    if (updateData.longitude !== undefined) {
      customer.longitude = updateData.longitude || null;
    }
    if (updateData.timezone !== undefined) {
      customer.timezone = updateData.timezone || null;
    }
    if (updateData.gender !== undefined) {
      customer.gender = updateData.gender || null;
    }
    if (updateData.avatar_url !== undefined) {
      customer.avatar_url = updateData.avatar_url || null;
    }

    // Update modify_date
    customer.modify_date = new Date();

    try {
      const updated = await this.customerRepository.save(customer);
      this.logger.log(`Profile updated for customer ${id}`);

      // Update kundli if birth data is available
      await this.updateKundliOnProfileChange(id, updated);

      return updated;
    } catch (error) {
      this.logger.error(`Error updating customer profile: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update profile');
    }
  }

  /**
   * Update or create kundli when customer profile birth data changes
   */
  private async updateKundliOnProfileChange(userId: number, customer: Customer): Promise<void> {
    try {
      // Check if birth data is available
      if (
        !customer.date_of_birth ||
        !customer.time_of_birth ||
        !customer.latitude ||
        !customer.longitude ||
        !customer.place_name
      ) {
        this.logger.debug(`Incomplete birth data for customer ${userId}, skipping kundli update`);
        return;
      }

      // Format birth date and time
      // date_of_birth is guaranteed to be non-null at this point (checked above)
      const birthDateObj = customer.date_of_birth instanceof Date 
        ? customer.date_of_birth 
        : new Date(customer.date_of_birth);
      const birthDate = birthDateObj.toISOString().split('T')[0];

      const birthTime = customer.time_of_birth || '12:00:00';

      // Check if kundli exists for this user
      const existingKundli = await this.kundliRepository.findOneByUserId(userId, { is_deleted: false });

      if (!existingKundli) {
        // Create new kundli if it doesn't exist
        this.logger.log(`No existing kundli found for customer ${userId}, creating new kundli`);
        
        // Format customer name for kundli generation
        const firstName = customer.first_name || 'User';
        const lastName = customer.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();

        // Generate and save kundli
        await this.kundliService.generateKundli(
          {
            name: fullName,
            birth_date: birthDate,
            birth_time: birthTime,
            birth_place: customer.place_name || '',
            latitude: customer.latitude || 0,
            longitude: customer.longitude || 0,
            timezone: customer.timezone || 'Asia/Kolkata',
          },
          userId, // Pass userId to save to database
        );

        this.logger.log(`Kundli created for customer ${userId}`);
        return;
      }

      // Update existing kundli
      this.logger.log(`Updating existing kundli for customer ${userId}`);

      // Generate kundli update JSON
      const kundliUpdate = await this.kundliService.generateKundliUpdateJSON({
        user_id: userId,
        birth_date: birthDate,
        birth_time: birthTime,
        birth_place: customer.place_name || '',
        latitude: customer.latitude || 0,
        longitude: customer.longitude || 0,
        timezone: customer.timezone || 'Asia/Kolkata',
      });

      // Update kundli record using repository
      const kundli = await this.kundliRepository.findOneByUserId(userId, { is_deleted: false });

      if (kundli) {
        // Convert string values to proper types for update
        const updateData: any = {
          ...kundliUpdate.kundli_db_update.update,
          birth_date: new Date(kundliUpdate.kundli_db_update.update.birth_date),
          latitude: parseFloat(kundliUpdate.kundli_db_update.update.latitude),
          longitude: parseFloat(kundliUpdate.kundli_db_update.update.longitude),
          lagna_degrees: parseFloat(kundliUpdate.kundli_db_update.update.lagna_degrees),
          pada: parseInt(kundliUpdate.kundli_db_update.update.pada.toString()),
          ayanamsa: parseFloat(kundliUpdate.kundli_db_update.update.ayanamsa),
          modify_date: new Date(kundliUpdate.kundli_db_update.update.modify_date),
        };

        await this.kundliRepository.update(kundli, updateData);
        this.logger.log(`Kundli updated for customer ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update/create kundli for customer ${userId}:`, error);
      // Don't throw - profile update succeeded even if kundli update failed
    }
  }

  /**
   * Get customer by unique_id
   */
  async findByUniqueId(uniqueId: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { unique_id: uniqueId, is_deleted: false },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  /**
   * List all customers with pagination and filters
   */
  async findAll(dto: ListUsersDto): Promise<{ data: Customer[]; meta: any }> {
    const { page = 1, limit = 20, search, plan, is_verified, is_active } = dto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.is_deleted = :deleted', { deleted: false });

    if (search) {
      queryBuilder.andWhere(
        '(customer.first_name ILIKE :search OR customer.last_name ILIKE :search OR customer.phone_number ILIKE :search OR customer.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (plan) {
      queryBuilder.andWhere('customer.current_plan = :plan', { plan });
    }

    if (is_verified !== undefined) {
      queryBuilder.andWhere('customer.is_verified = :verified', { verified: is_verified });
    }

    if (is_active !== undefined) {
      queryBuilder.andWhere('customer.is_enabled = :active', { active: is_active });
    }

    const [customers, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('customer.added_date', 'DESC')
      .getManyAndCount();

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}



