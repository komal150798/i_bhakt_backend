import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { RolesService } from '../services/roles.service';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { UpdateRolePermissionsDto } from '../dtos/update-role-permissions.dto';

@ApiTags('admin-roles')
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiQuery({ name: 'is_enabled', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async findAll(
    @Query('is_enabled') isEnabled?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (isEnabled !== undefined) {
      filters.is_enabled = isEnabled === 'true';
    }
    if (search) {
      filters.search = search;
    }
    return this.rolesService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single role with permissions' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 409, description: 'Role already exists' })
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() user: any,
  ) {
    return this.rolesService.create(createRoleDto, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Role cannot be edited' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() user: any,
  ) {
    return this.rolesService.update(id, updateRoleDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete role (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Role cannot be deleted' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    await this.rolesService.remove(id, user.id);
  }

  @Get(':roleId/permissions')
  @ApiOperation({ summary: 'Get permissions for a role' })
  @ApiParam({ name: 'roleId', type: Number })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  async getRolePermissions(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.rolesService.getRolePermissions(roleId);
  }

  @Put(':roleId/permissions')
  @ApiOperation({ summary: 'Update permissions for a role' })
  @ApiParam({ name: 'roleId', type: Number })
  @ApiResponse({ status: 200, description: 'Permissions updated successfully' })
  async updateRolePermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() updateDto: UpdateRolePermissionsDto,
    @CurrentUser() user: any,
  ) {
    return this.rolesService.updateRolePermissions(roleId, updateDto, user.id);
  }

  @Get('permissions/tree')
  @ApiOperation({ summary: 'Get all permissions as hierarchical tree' })
  @ApiResponse({ status: 200, description: 'Permissions tree retrieved successfully' })
  async getPermissionsTree() {
    return this.rolesService.getPermissionsTree();
  }
}
