import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmRole } from './entities/adm-role.entity';
import { AdmPermission } from './entities/adm-permission.entity';
import { AdmRolePermission } from './entities/adm-role-permission.entity';
import { AdminUser } from '../users/entities/admin-user.entity';
import { RolesService } from './services/roles.service';
import { AdminUsersService } from './services/admin-users.service';
import { PermissionsService } from './services/permissions.service';
import { RolesController } from './controllers/roles.controller';
import { AdminUsersController } from './controllers/admin-users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdmRole, AdmPermission, AdmRolePermission, AdminUser]),
  ],
  controllers: [RolesController, AdminUsersController],
  providers: [RolesService, AdminUsersService, PermissionsService],
  exports: [RolesService, AdminUsersService, PermissionsService],
})
export class AdminRbacModule {}
