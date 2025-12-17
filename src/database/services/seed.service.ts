import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  /**
   * Seed default admin user
   */
  private async seedAdminUser(): Promise<void> {
    const adminUsername = 'komal';
    const adminPassword = 'komal';

    try {
      // Check if admin already exists
      const existingAdmin = await this.userRepository.findOne({
        where: [
          { email: `${adminUsername}@admin.com`, is_deleted: false },
          { phone_number: adminUsername, is_deleted: false },
        ],
      });

      if (existingAdmin) {
        this.logger.log('Default admin user already exists, skipping seed');
        
        // Update role if not admin
        if (existingAdmin.role !== UserRole.ADMIN && existingAdmin.role !== UserRole.SUPER_ADMIN) {
          existingAdmin.role = UserRole.ADMIN;
          await this.userRepository.save(existingAdmin);
          this.logger.log('Updated existing user to admin role');
        }
        return;
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

      // Create admin user
      const admin = this.userRepository.create({
        first_name: 'Admin',
        last_name: 'User',
        email: `${adminUsername}@admin.com`,
        phone_number: adminUsername,
        password: hashedPassword, // Store hashed password
        role: UserRole.ADMIN,
        is_verified: true,
        current_plan: null as any, // Admin doesn't need a plan (nullable)
      });

      await this.userRepository.save(admin);
      this.logger.log('✅ Default admin user created successfully');
      this.logger.log(`   Username: ${adminUsername}`);
      this.logger.log(`   Password: ${adminPassword}`);
      this.logger.warn('⚠️  Please change the default password after first login!');
    } catch (error) {
      this.logger.error('Failed to seed admin user:', error);
    }
  }
}

