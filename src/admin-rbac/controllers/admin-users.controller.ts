import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminUsersService } from '../services/admin-users.service';
import { CreateAdminUserDto } from '../dtos/create-admin-user.dto';
import { UpdateAdminUserDto } from '../dtos/update-admin-user.dto';
import { UpdateAdminUserRoleDto } from '../dtos/update-admin-user-role.dto';
import { ListAdminUsersDto } from '../dtos/list-admin-users.dto';

@ApiTags('admin-users-rbac')
@Controller('admin/admins')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Post('list')
  @ApiOperation({ summary: 'List all admin users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Admin users retrieved successfully' })
  async findAll(@Body() dto: ListAdminUsersDto) {
    const result = await this.adminUsersService.findAll(dto);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single admin user by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Admin user retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Admin user not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminUsersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new admin user' })
  @ApiResponse({ status: 201, description: 'Admin user created successfully' })
  @ApiResponse({ status: 409, description: 'Admin user already exists' })
  async create(
    @Body() createDto: CreateAdminUserDto,
    @CurrentUser() user: any,
  ) {
    return this.adminUsersService.create(createDto, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update admin user' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Admin user updated successfully' })
  @ApiResponse({ status: 404, description: 'Admin user not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAdminUserDto,
    @CurrentUser() user: any,
  ) {
    return this.adminUsersService.update(id, updateDto, user.id);
  }

  @Put(':id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update admin user role only' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Admin user role updated successfully' })
  @ApiResponse({ status: 404, description: 'Admin user or role not found' })
  @ApiResponse({ status: 400, description: 'Cannot change role of SUPER_ADMIN' })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAdminUserRoleDto,
    @CurrentUser() user: any,
  ) {
    return this.adminUsersService.updateRole(id, updateDto, user.id);
  }
}
