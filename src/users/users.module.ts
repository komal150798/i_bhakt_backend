import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUsersController } from './controllers/admin/admin-users.controller';
import { WebUsersController } from './controllers/web/web-users.controller';
import { AppUsersController } from './controllers/app/app-users.controller';
import { UsersService } from './services/users.service';
import { CustomerService } from './services/customer.service';
import { User } from './entities/user.entity';
import { Customer } from './entities/customer.entity';
import { AdminUser } from './entities/admin-user.entity';
import { KarmaEntry } from '../karma/entities/karma-entry.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { KundliModule } from '../kundli/kundli.module';
import { RepositoriesModule } from '../infrastructure/repositories/repositories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Customer, AdminUser, KarmaEntry]),
    SubscriptionsModule,
    KundliModule, // For kundli calculation and update
    RepositoriesModule, // For kundli repository
  ],
  controllers: [
    AdminUsersController,
    WebUsersController,
    AppUsersController,
  ],
  providers: [UsersService, CustomerService],
  exports: [UsersService, CustomerService],
})
export class UsersModule {}

