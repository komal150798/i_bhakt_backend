import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../../../users/entities/admin-user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {}

  /**
   * Check if adm_users table exists
   */
  async checkTableExists(): Promise<boolean> {
    try {
      // Try a simple query to check if table exists
      await this.adminUserRepository.query('SELECT 1 FROM adm_users LIMIT 1');
      return true;
    } catch (error: any) {
      if (error?.message?.includes('does not exist') || error?.code === '42P01') {
        return false;
      }
      throw error;
    }
  }

  async onModuleInit() {
    await this.seedAdminUser();
  }

  /**
   * Seed default admin user with username/password: komal/komal
   * Retries if tables don't exist yet (waits for TypeORM synchronize)
   */
  async seedAdminUser(): Promise<void> {
    const adminUsername = 'komal';
    const adminPassword = 'komal';
    const maxRetries = 5;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check if admin already exists by username or email
        const existingAdmin = await this.adminUserRepository.findOne({
          where: [
            { username: adminUsername },
            { email: `${adminUsername}@admin.com` },
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
          email: `${adminUsername}@admin.com`,
          password: hashedPassword,
          first_name: 'Admin',
          last_name: 'User',
          is_active: true,
        });

        await this.adminUserRepository.save(admin);
        this.logger.log('✅ Default admin user created successfully');
        this.logger.log(`   Username: ${adminUsername}`);
        this.logger.log(`   Password: ${adminPassword}`);
        this.logger.warn('⚠️  Please change the default password after first login!');
        return; // Success, exit retry loop
      } catch (error: any) {
        // Check if error is due to table not existing
        if (error?.message?.includes('does not exist') || error?.code === '42P01') {
          if (attempt < maxRetries) {
            this.logger.warn(
              `Tables not ready yet, retrying in ${retryDelay}ms (attempt ${attempt}/${maxRetries})...`,
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            continue; // Retry
          } else {
            this.logger.error(
              `Failed to seed admin user after ${maxRetries} attempts. Tables may not have been created.`,
            );
            this.logger.error('Error:', error.message);
            return; // Give up after max retries
          }
        } else {
          // Different error, log and exit
          this.logger.error('Failed to seed admin user:', error);
          return;
        }
      }
    }
  }
}

