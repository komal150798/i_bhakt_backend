import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UpdateCustomerProfileDto } from '../../dtos/update-customer-profile.dto';
import { parseDateString } from '../../../common/utils/date.util';
import { splitFullName } from '../../../common/utils/string.util';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../../../common/types/jwt-payload.interface';
import { CustomerService } from '../../services/customer.service';
import { SubscriptionsService } from '../../../subscriptions/services/subscriptions.service';
import { UsageTrackingService } from '../../../subscriptions/services/usage-tracking.service';
import { Customer } from '../../entities/customer.entity';

@ApiTags('web-users')
@Controller('web/users')
export class WebUsersController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile (Web)' })
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    if (!user.unique_id) {
      throw new BadRequestException('User unique_id is missing');
    }
    
    // Get user from Customer table only
    const fullUser = await this.customerService.findByUniqueId(user.unique_id);
    
    return {
      success: true,
      data: {
        unique_id: fullUser.unique_id,
        first_name: fullUser.first_name,
        last_name: fullUser.last_name,
        email: fullUser.email,
        phone_number: fullUser.phone_number,
        date_of_birth: fullUser.date_of_birth,
        time_of_birth: fullUser.time_of_birth,
        place_name: fullUser.place_name,
        gender: fullUser.gender,
        current_plan: fullUser.current_plan,
        referral_code: fullUser.referral_code,
        is_verified: fullUser.is_verified,
        avatar_url: fullUser.avatar_url,
      },
    };
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile (Web)' })
  @ApiBody({
    type: UpdateCustomerProfileDto,
    description: 'Profile update data. All fields are optional.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateData: UpdateCustomerProfileDto,
  ) {
    if (!user.unique_id) {
      throw new BadRequestException('User unique_id is missing');
    }
    
    // Get user from Customer table only
    const fullUser = await this.customerService.findByUniqueId(user.unique_id);
    
    // Update Customer
    const updated = await this.customerService.updateProfile(user.id, updateData);
    
    return {
      success: true,
      data: {
        unique_id: updated.unique_id,
        first_name: updated.first_name,
        last_name: updated.last_name,
        email: updated.email,
        message: 'Profile updated successfully',
      },
    };
  }

  @Get('me/current-plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription plan (Web)' })
  async getCurrentPlan(@CurrentUser() user: CurrentUserPayload) {
    const subscription = await this.subscriptionsService.getCurrentSubscription(user.id);
    const planType = await this.subscriptionsService.getCurrentPlanType(user.id);

    return {
      success: true,
      data: {
        plan_type: planType,
        subscription: subscription
          ? {
              unique_id: subscription.unique_id,
              plan_type: subscription.plan_type,
              start_date: subscription.start_date,
              end_date: subscription.end_date,
              is_active: subscription.is_active,
            }
          : null,
      },
    };
  }

  @Get('me/allowed-modules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all modules user has access to (Web)' })
  async getAllowedModules(@CurrentUser() user: CurrentUserPayload) {
    const modules = await this.subscriptionsService.getUserModules(user.id);

    return {
      success: true,
      data: {
        modules,
      },
    };
  }

  @Get('me/usage-limits')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current usage and limits for all modules (Web)' })
  async getUsageLimits(@CurrentUser() user: CurrentUserPayload) {
    const limits = await this.usageTrackingService.getUserUsageLimits(user.id);

    return {
      success: true,
      data: limits,
    };
  }
}

