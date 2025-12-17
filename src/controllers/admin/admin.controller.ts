import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlansService } from '../../plans/services/plans.service';
import { UsersService } from '../../users/services/users.service';
import { CreatePlanDto } from '../../plans/dtos/create-plan.dto';
import { UpdatePlanDto } from '../../plans/dtos/update-plan.dto';
import { PlanResponseDto } from '../../plans/dtos/plan-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(
    private readonly plansService: PlansService,
    private readonly usersService: UsersService,
  ) {}

  // ========== PLANS MANAGEMENT ==========

  @Post('plans')
  @ApiOperation({ summary: 'Create a new plan (Admin only)' })
  @ApiResponse({ status: 201, description: 'Plan created successfully', type: PlanResponseDto })
  @ApiResponse({ status: 409, description: 'Plan type already exists' })
  async createPlan(
    @Body() createPlanDto: CreatePlanDto,
    @CurrentUser() user: any,
  ): Promise<PlanResponseDto> {
    return this.plansService.create(createPlanDto, user.id);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all plans (Admin view)' })
  @ApiResponse({ status: 200, description: 'List of all plans', type: [PlanResponseDto] })
  async getAllPlans(): Promise<PlanResponseDto[]> {
    return this.plansService.findAll();
  }

  @Get('plans/:uniqueId')
  @ApiOperation({ summary: 'Get plan by unique ID (Admin)' })
  @ApiResponse({ status: 200, description: 'Plan details', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlan(@Param('uniqueId') uniqueId: string): Promise<PlanResponseDto> {
    return this.plansService.findOneByUniqueId(uniqueId);
  }

  @Put('plans/:uniqueId')
  @ApiOperation({ summary: 'Update plan (Admin only)' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async updatePlan(
    @Param('uniqueId') uniqueId: string,
    @Body() updatePlanDto: UpdatePlanDto,
    @CurrentUser() user: any,
  ): Promise<PlanResponseDto> {
    return this.plansService.update(uniqueId, updatePlanDto, user.id);
  }

  @Delete('plans/:uniqueId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete plan (soft delete, Admin only)' })
  @ApiResponse({ status: 204, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async deletePlan(
    @Param('uniqueId') uniqueId: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.plansService.remove(uniqueId, user.id);
  }

  @Post('plans/:uniqueId/modules')
  @ApiOperation({ summary: 'Assign modules to plan (Admin only)' })
  @ApiResponse({ status: 200, description: 'Modules assigned successfully', type: PlanResponseDto })
  async assignModules(
    @Param('uniqueId') uniqueId: string,
    @Body() body: { moduleSlugs: string[] },
    @CurrentUser() user: any,
  ): Promise<PlanResponseDto> {
    return this.plansService.assignModules(uniqueId, body.moduleSlugs, user.id);
  }

  // ========== DASHBOARD STATISTICS ==========

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  async getDashboardStats() {
    return this.usersService.getDashboardStats();
  }

  @Get('dashboard/charts')
  @ApiOperation({ summary: 'Get dashboard charts data (Admin only)' })
  @ApiResponse({ status: 200, description: 'Dashboard charts data retrieved successfully' })
  async getDashboardCharts() {
    return this.usersService.getDashboardCharts();
  }

  // TODO: Add more admin endpoints for:
  // - Users management
  // - Kundli management
  // - Orders/Payments management
  // - CMS management
  // - Karma/Manifestation management
  // - Analytics/Reports
}

