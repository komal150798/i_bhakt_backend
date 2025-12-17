import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlansService } from '../../plans/services/plans.service';
import { PlanResponseDto } from '../../plans/dtos/plan-response.dto';
import { CustomerService } from '../../users/services/customer.service';
import { UpdateCustomerProfileDto } from '../../users/dtos/update-customer-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Customer')
@Controller('customer')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(
    private readonly plansService: PlansService,
    private readonly customerService: CustomerService,
  ) {}

  // ========== MY PLANS ==========

  @Get('plans')
  @ApiOperation({ summary: 'Get all available plans (Customer view)' })
  @ApiResponse({ status: 200, description: 'List of enabled plans', type: [PlanResponseDto] })
  async getAvailablePlans(): Promise<PlanResponseDto[]> {
    return this.plansService.findAll({ is_enabled: true });
  }

  @Get('plans/:uniqueId')
  @ApiOperation({ summary: 'Get plan details (Customer)' })
  @ApiResponse({ status: 200, description: 'Plan details', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlan(@Param('uniqueId') uniqueId: string): Promise<PlanResponseDto> {
    return this.plansService.findOneByUniqueId(uniqueId);
  }

  // ========== MY PROFILE ==========

  @Post('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current customer profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getProfile(@CurrentUser() user: any) {
    const profile = await this.customerService.getProfile(user.id);
    return {
      success: true,
      code: 200,
      message: 'Profile retrieved successfully',
      data: profile,
    };
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update customer profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateData: UpdateCustomerProfileDto,
  ) {
    const updated = await this.customerService.updateProfile(user.id, updateData);
    return {
      success: true,
      code: 200,
      message: 'Profile updated successfully',
      data: {
        id: updated.id,
        unique_id: updated.unique_id,
        first_name: updated.first_name,
        last_name: updated.last_name,
        email: updated.email,
        date_of_birth: updated.date_of_birth,
        time_of_birth: updated.time_of_birth,
        place_name: updated.place_name,
        latitude: updated.latitude,
        longitude: updated.longitude,
        timezone: updated.timezone,
        gender: updated.gender,
        avatar_url: updated.avatar_url,
      },
    };
  }

  // TODO: Add more customer endpoints for:
  // - My kundli list (GET)
  // - My kundli detail (GET)
  // - Create kundli (POST)
  // - My subscriptions (GET)
  // - My orders (GET)
  // - My payments (GET)
  // - My karma entries (GET, POST)
  // - My manifestation logs (GET, POST)
}

