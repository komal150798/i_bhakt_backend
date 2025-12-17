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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SubscriptionsService } from '../../services/subscriptions.service';
import { PlansService } from '../../../plans/services/plans.service';
import { PlanType } from '../../../common/enums/plan-type.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../../entities/subscription.entity';
import { Plan } from '../../../plans/entities/plan.entity';

@ApiTags('Admin - Subscriptions')
@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminSubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly plansService: PlansService,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  /**
   * GET /api/v1/admin/subscriptions
   * Get all subscriptions with filters and pagination
   */
  @Post('list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all subscriptions (Admin)' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  async findAll(
    @Body() body: {
      page?: number;
      limit?: number;
      search?: string;
      plan_type?: PlanType;
      is_active?: boolean;
      user_id?: number;
    },
  ) {
    const page = body.page || 1;
    const limit = body.limit || 20;
    const skip = (page - 1) * limit;

    // Build query
    const queryBuilder = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.user', 'user')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.is_deleted = :isDeleted', { isDeleted: false });

    // Apply filters
    if (body.plan_type) {
      queryBuilder.andWhere('subscription.plan_type = :planType', {
        planType: body.plan_type,
      });
    }

    if (body.is_active !== undefined) {
      queryBuilder.andWhere('subscription.is_active = :isActive', {
        isActive: body.is_active,
      });
    }

    if (body.user_id) {
      queryBuilder.andWhere('subscription.user_id = :userId', {
        userId: body.user_id,
      });
    }

    if (body.search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.first_name ILIKE :search OR user.last_name ILIKE :search OR plan.name ILIKE :search)',
        { search: `%${body.search}%` },
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const subscriptions = await queryBuilder
      .orderBy('subscription.added_date', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      success: true,
      data: subscriptions.map((sub) => ({
        id: sub.id,
        unique_id: sub.unique_id,
        user_id: sub.user_id,
        user_email: sub.user?.email || null,
        user_name: sub.user
          ? `${sub.user.first_name || ''} ${sub.user.last_name || ''}`.trim() || sub.user.email
          : null,
        plan_id: sub.plan_id,
        plan_name: sub.plan?.name || null,
        plan_type: sub.plan_type,
        start_date: sub.start_date,
        end_date: sub.end_date,
        is_active: sub.is_active,
        is_renewal: sub.is_renewal,
        cancelled_at: sub.cancelled_at,
        cancellation_reason: sub.cancellation_reason,
        added_date: sub.added_date,
        modify_date: sub.modify_date,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /api/v1/admin/subscriptions/:id
   * Get subscription by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID (Admin)' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['user', 'plan', 'order'],
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return {
      success: true,
      data: {
        id: subscription.id,
        unique_id: subscription.unique_id,
        user_id: subscription.user_id,
        user: subscription.user
          ? {
              id: subscription.user.id,
              email: subscription.user.email,
              first_name: subscription.user.first_name,
              last_name: subscription.user.last_name,
            }
          : null,
        plan_id: subscription.plan_id,
        plan: subscription.plan
          ? {
              id: subscription.plan.id,
              name: subscription.plan.name,
              plan_type: subscription.plan.plan_type,
            }
          : null,
        plan_type: subscription.plan_type,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        is_active: subscription.is_active,
        is_renewal: subscription.is_renewal,
        order_id: subscription.order_id,
        cancelled_at: subscription.cancelled_at,
        cancellation_reason: subscription.cancellation_reason,
        added_date: subscription.added_date,
        modify_date: subscription.modify_date,
      },
    };
  }

  /**
   * POST /api/v1/admin/subscriptions
   * Create new subscription (Admin)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create subscription (Admin)' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  async create(
    @Body()
    body: {
      user_id: number;
      plan_id: number;
      start_date?: string;
      end_date?: string;
      order_id?: number;
    },
  ) {
    const subscription = await this.subscriptionsService.createSubscription(
      body.user_id,
      body.plan_id,
      body.start_date ? new Date(body.start_date) : undefined,
      body.order_id,
    );

    // Override end_date if provided
    if (body.end_date) {
      subscription.end_date = new Date(body.end_date);
      await this.subscriptionsService['subscriptionRepository'].save(subscription);
    }

    return {
      success: true,
      data: {
        id: subscription.id,
        user_id: subscription.user_id,
        plan_id: subscription.plan_id,
        plan_type: subscription.plan_type,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        is_active: subscription.is_active,
      },
    };
  }

  /**
   * PUT /api/v1/admin/subscriptions/:id
   * Update subscription (Admin)
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update subscription (Admin)' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      plan_id?: number;
      start_date?: string;
      end_date?: string;
      is_active?: boolean;
      cancellation_reason?: string;
    },
  ) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Update plan if provided
    if (body.plan_id && body.plan_id !== subscription.plan_id) {
      const newPlan = await this.planRepository.findOne({
        where: { id: body.plan_id, is_deleted: false },
      });
      if (!newPlan) {
        throw new Error('Plan not found');
      }
      subscription.plan_id = body.plan_id;
      subscription.plan_type = newPlan.plan_type;
    }

    // Update dates
    if (body.start_date) {
      subscription.start_date = new Date(body.start_date);
    }

    if (body.end_date !== undefined) {
      subscription.end_date = body.end_date ? new Date(body.end_date) : null;
    }

    // Update active status
    if (body.is_active !== undefined) {
      subscription.is_active = body.is_active;
      if (!body.is_active && !subscription.cancelled_at) {
        subscription.cancelled_at = new Date();
      } else if (body.is_active && subscription.cancelled_at) {
        subscription.cancelled_at = null;
        subscription.cancellation_reason = null;
      }
    }

    // Update cancellation reason
    if (body.cancellation_reason !== undefined) {
      subscription.cancellation_reason = body.cancellation_reason;
    }

    const updated = await this.subscriptionRepository.save(subscription);

    return {
      success: true,
      data: {
        id: updated.id,
        user_id: updated.user_id,
        plan_id: updated.plan_id,
        plan_type: updated.plan_type,
        start_date: updated.start_date,
        end_date: updated.end_date,
        is_active: updated.is_active,
        cancelled_at: updated.cancelled_at,
      },
    };
  }

  /**
   * DELETE /api/v1/admin/subscriptions/:id
   * Cancel/Delete subscription (Admin)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel subscription (Admin)' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string },
  ) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    await this.subscriptionsService.cancelSubscription(
      subscription.user_id,
      body.reason,
    );

    return {
      success: true,
      message: 'Subscription cancelled successfully',
    };
  }

  /**
   * GET /api/v1/admin/subscriptions/plans
   * Get all available plans for subscription creation
   */
  @Get('plans/available')
  @ApiOperation({ summary: 'Get all available plans (Admin)' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully' })
  async getAvailablePlans() {
    const plans = await this.plansService.findAll({ is_enabled: true });
    return {
      success: true,
      data: plans,
    };
  }
}
