import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ZunoUserGuard } from '../../common/guards/zuno-user.guard';
import { CurrentZunoUser } from '../../common/decorators/zuno-user.decorator';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZunoResponseInterceptor } from '../../common/interceptors/zuno-response.interceptor';
import { ZunoExceptionFilter } from '../../common/filters/zuno-exception.filter';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { PlanService } from '../services/plan.service';
import {
  ActivatePlanDto,
  AddPlanItemDto,
  BlockPlanItemDto,
  CompletePlanItemDto,
  DeferPlanItemDto,
  GeneratePlanDto,
  ListPlansQueryDto,
  PatchPlanDto,
  PlanItemView,
  PlanView,
  SkipPlanItemDto,
} from '../dtos/plan.dtos';

/**
 * Plan API. Step 21 API Contracts sections 50-53.
 *
 * Mounted at the `plans` root. `GET /plans/{planId}` and
 * `PATCH /plans/{planId}` match the contract exactly; the challenge-scoped
 * list and generate calls are served here as `GET /plans?challengeId=` and
 * `POST /plans/generate`, with the literal contract paths restored by
 * `ZunoChallengePlansController` below. Both are listed in WIRING.md.
 */
@ApiTags('ZUNO - Plans')
@ApiBearerAuth('JWT-auth')
@Controller('plans')
@UseGuards(JwtAuthGuard, ZunoUserGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class ZunoPlansController {
  constructor(
    private readonly plans: PlanService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List the user's plans, optionally for one WhatNow" })
  async list(
    @CurrentZunoUser() user: ZunoUser,
    @Query() query: ListPlansQueryDto,
  ) {
    const rows = query.challengeId
      ? await this.plans.listForChallenge(user, query.challengeId)
      : await this.plans.list(user.id);
    return rows.map(PlanView.summary);
  }

  /**
   * Step 21 section 50: generate.
   *
   * Returns the plan in DRAFT. Step 16 section 85 keeps activation a separate
   * call so the validations - capacity above all - run before the plan becomes
   * the thing the user opens each morning.
   */
  @Post('generate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Build a plan for a WhatNow over one horizon' })
  @ApiResponse({ status: 200, description: 'Plan generated or returned.' })
  @ApiResponse({ status: 403, description: 'Blocked by the safety policy.' })
  async generate(
    @CurrentZunoUser() user: ZunoUser,
    @Body() dto: GeneratePlanDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.idempotency.execute(
      {
        operation: 'PLAN_GENERATE',
        key: idempotencyKey,
        userId: user.id,
        requestBody: dto,
      },
      async () => {
        const { plan, items } = await this.plans.generate({
          user,
          challengeId: dto.challengeId,
          planType: dto.planType,
          regenerate: dto.regenerate === true,
        });
        // Spread rather than the class instance: IdempotencyService.execute is
        // generic over `Record<string, unknown>`.
        return { ...PlanView.from(plan, items) };
      },
    );
  }

  /** Step 21 section 50/51: `GET /plans/{planId}`. */
  @Get(':planId')
  @ApiOperation({ summary: 'Get one plan with its items' })
  @ApiResponse({ status: 404, description: 'Not found, or not yours.' })
  async detail(
    @CurrentZunoUser() user: ZunoUser,
    @Param('planId', ParseUUIDPipe) planId: string,
  ) {
    const { plan, items } = await this.plans.detail(user, planId);
    return PlanView.from(plan, items);
  }

  /** Step 21 section 50: `PATCH /plans/{planId}`. */
  @Patch(':planId')
  @ApiOperation({ summary: 'Update a plan title, goal or status' })
  @ApiResponse({ status: 409, description: 'Stale version, or illegal transition.' })
  async patch(
    @CurrentZunoUser() user: ZunoUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: PatchPlanDto,
  ) {
    const plan = await this.plans.patch(user, planId, dto);
    return PlanView.summary(plan);
  }

  /** Step 16 section 85: activation is its own, validated step. */
  @Post(':planId/activate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Activate a draft plan' })
  @ApiResponse({ status: 409, description: 'Over capacity, or illegal transition.' })
  async activate(
    @CurrentZunoUser() user: ZunoUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: ActivatePlanDto,
  ) {
    const plan = await this.plans.activate(user, planId, dto.version);
    return PlanView.summary(plan);
  }

  /**
   * Step 16 sections 56-57: the user may add their own tasks and commitments.
   *
   * Subject to the same capacity ceiling as generated work, so this can answer
   * 409 when the plan is already full.
   */
  @Post(':planId/items')
  @HttpCode(201)
  @ApiOperation({ summary: 'Add a task of your own to this plan' })
  @ApiResponse({ status: 409, description: 'The plan is already at capacity.' })
  async addItem(
    @CurrentZunoUser() user: ZunoUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: AddPlanItemDto,
  ) {
    const item = await this.plans.addItem(user, planId, {
      title: dto.title,
      description: dto.description,
      category: dto.category,
      priority: dto.priority,
      estimatedMinutes: dto.estimatedMinutes,
      scheduledDate: dto.scheduledDate,
      isCommitment: dto.isCommitment === true,
    });
    return PlanItemView.from(item);
  }
}

/**
 * Plan item actions. Step 21 API Contracts section 50.
 *
 * These four routes are the published contract verbatim:
 *   POST /plan-items/{itemId}/complete
 *   POST /plan-items/{itemId}/defer
 *   POST /plan-items/{itemId}/skip
 * plus `/start` and `/block`, which Step 16 sections 79 and 87 require for the
 * `plan.item_started` and `plan.item_blocked` events.
 *
 * Every one of them funnels into `PlanService.transitionItem`, so an illegal
 * move answers 409 rather than silently doing nothing.
 */
@ApiTags('ZUNO - Plan items')
@ApiBearerAuth('JWT-auth')
@Controller('plan-items')
@UseGuards(JwtAuthGuard, ZunoUserGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class ZunoPlanItemsController {
  constructor(private readonly plans: PlanService) {}

  @Get(':itemId')
  @ApiOperation({ summary: 'Get one plan item' })
  async detail(
    @CurrentZunoUser() user: ZunoUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    const item = await this.plans.findOwnedItem(user.id, itemId);
    return PlanItemView.from(item);
  }

  @Post(':itemId/start')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark a plan item as started' })
  @ApiResponse({ status: 409, description: 'Illegal transition, or a dependency is unfinished.' })
  async start(
    @CurrentZunoUser() user: ZunoUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    const item = await this.plans.startItem(user, itemId);
    return PlanItemView.from(item);
  }

  /** Step 21 section 52. Emits the event the Karma Ledger consumes. */
  @Post(':itemId/complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark a plan item done' })
  @ApiResponse({ status: 409, description: 'Illegal transition, or a dependency is unfinished.' })
  async complete(
    @CurrentZunoUser() user: ZunoUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: CompletePlanItemDto,
  ) {
    const item = await this.plans.completeItem(user, itemId, { note: dto.note });
    return PlanItemView.from(item);
  }

  @Post(':itemId/defer')
  @HttpCode(200)
  @ApiOperation({ summary: 'Move a plan item to a later date' })
  async defer(
    @CurrentZunoUser() user: ZunoUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: DeferPlanItemDto,
  ) {
    const item = await this.plans.deferItem(user, itemId, {
      to: dto.to,
      reason: dto.reason,
    });
    return PlanItemView.from(item);
  }

  /**
   * Skipping carries no penalty anywhere in this module - Step 16 section 18
   * and Build Rule 64. The response is identical in shape to completion so a
   * client has nothing to render as a failure.
   */
  @Post(':itemId/skip')
  @HttpCode(200)
  @ApiOperation({ summary: 'Skip a plan item, without penalty' })
  async skip(
    @CurrentZunoUser() user: ZunoUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: SkipPlanItemDto,
  ) {
    const item = await this.plans.skipItem(user, itemId, { reason: dto.reason });
    return PlanItemView.from(item);
  }

  /** Step 16 section 79: capture what is blocking it. */
  @Post(':itemId/block')
  @HttpCode(200)
  @ApiOperation({ summary: 'Record that something is blocking this item' })
  async block(
    @CurrentZunoUser() user: ZunoUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: BlockPlanItemDto,
  ) {
    const item = await this.plans.blockItem(user, itemId, dto.reason);
    return PlanItemView.from(item);
  }

  /** Step 20 section 43: the item's own immutable history. */
  @Get(':itemId/history')
  @ApiOperation({ summary: 'Status history for one plan item' })
  async history(
    @CurrentZunoUser() user: ZunoUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    const rows = await this.plans.historyFor(user, itemId);
    return rows.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      oldStatus: row.old_status,
      newStatus: row.new_status,
      reason: row.reason,
      source: row.source,
      createdAt: row.created_at.toISOString(),
    }));
  }
}

/**
 * The literal Step 21 section 50 challenge-scoped paths.
 *
 * Cannot collide with `ZunoChallengesController`, which owns
 * `challenges/:challengeId` and its `/analyze`, `/response`, `/resolve` and
 * `/reopen` sub-paths - none of which is `/plans`.
 */
@ApiTags('ZUNO - Plans')
@ApiBearerAuth('JWT-auth')
@Controller('challenges')
@UseGuards(JwtAuthGuard, ZunoUserGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class ZunoChallengePlansController {
  constructor(
    private readonly plans: PlanService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Get(':challengeId/plans')
  @ApiOperation({ summary: 'List the plans for this WhatNow' })
  async list(
    @CurrentZunoUser() user: ZunoUser,
    @Param('challengeId', ParseUUIDPipe) challengeId: string,
  ) {
    const rows = await this.plans.listForChallenge(user, challengeId);
    return rows.map(PlanView.summary);
  }

  @Post(':challengeId/plans/generate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Build a plan for this WhatNow' })
  async generate(
    @CurrentZunoUser() user: ZunoUser,
    @Param('challengeId', ParseUUIDPipe) challengeId: string,
    @Body() dto: Omit<GeneratePlanDto, 'challengeId'>,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.idempotency.execute(
      {
        operation: 'PLAN_GENERATE',
        key: idempotencyKey,
        userId: user.id,
        requestBody: { challengeId, ...dto },
      },
      async () => {
        const { plan, items } = await this.plans.generate({
          user,
          challengeId,
          planType: dto?.planType,
          regenerate: dto?.regenerate === true,
        });
        return { ...PlanView.from(plan, items) };
      },
    );
  }
}
