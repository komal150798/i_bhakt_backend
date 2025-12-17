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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CustomerService } from '../../services/customer.service';
import { ListUsersDto } from '../../dtos/list-users.dto';
import { User } from '../../entities/user.entity';

@ApiTags('admin-users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('list')
  @ApiOperation({ summary: 'List all customers (cst_customer) with pagination and filters (Admin only)' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  async findAll(@Body() dto: ListUsersDto) {
    const result = await this.customerService.findAll(dto);

    return {
      success: true,
      data: result.data.map((c) => ({
        id: c.id,
        unique_id: c.unique_id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone_number: c.phone_number,
        current_plan: c.current_plan,
        is_verified: c.is_verified,
        is_active: c.is_enabled,
        added_date: c.added_date,
        last_login: c.last_login,
      })),
      meta: result.meta,
    };
  }

  @Get(':uniqueId')
  @ApiOperation({ summary: 'Get customer by unique ID (Admin only)' })
  @ApiResponse({ status: 200 })
  async findOne(@Param('uniqueId') uniqueId: string) {
    const customer = await this.customerService.findByUniqueId(uniqueId);
    return {
      success: true,
      data: {
        id: customer.id,
        unique_id: customer.unique_id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone_number: customer.phone_number,
        date_of_birth: customer.date_of_birth,
        current_plan: customer.current_plan,
        is_verified: customer.is_verified,
        referral_code: customer.referral_code,
        added_date: customer.added_date,
      },
    };
  }
}

