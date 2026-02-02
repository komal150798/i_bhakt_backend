import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../../users/entities/admin-user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
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
    const adminEmail = `${adminUsername}@admin.com`;

    try {
      // Check if admin already exists
      const existingAdmin = await this.adminUserRepository.findOne({
        where: [
          { email: adminEmail, is_deleted: false },
          { username: adminUsername, is_deleted: false },
        ],
      });

      if (existingAdmin) {
        this.logger.log('Default admin user already exists, skipping seed');
        return;
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

      // Create admin user
      const admin = this.adminUserRepository.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        is_active: true,
        is_enabled: true,
        role_id: null, // Can be set later if role system is configured
      });

      await this.adminUserRepository.save(admin);
      this.logger.log('✅ Default admin user created successfully');
      this.logger.log(`   Username: ${adminUsername}`);
      this.logger.log(`   Email: ${adminEmail}`);
      this.logger.log(`   Password: ${adminPassword}`);
      this.logger.warn('⚠️  Please change the default password after first login!');
    } catch (error) {
      this.logger.error('Failed to seed admin user:', error);
    }
  }
}

