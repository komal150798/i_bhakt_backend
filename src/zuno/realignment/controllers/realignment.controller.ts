import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
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
import { RealignmentService } from '../services/realignment.service';
import {
  ApplyRealignmentDto,
  EvaluateRealignmentDto,
  ListRealignmentsQueryDto,
  RealignmentView,
} from '../dtos/realignment.dtos';

/**
 * Realignment API. Step 14 sections 82-83, Step 21 sections 44-46.
 *
 * ROUTE ROOT
 *
 * Mounted at `/api/v1/realignment`. Step 21 section 44 nests these under
 * `/challenges/{challengeId}/realign`; that controller belongs to another phase
 * and is out of scope here, so `challengeId` travels in the body or query and
 * the response bodies are unchanged from the contract. WIRING.md records it.
 *
 * Evaluate and apply are separate endpoints, which is Step 14 section 83's own
 * design: a realignment that needs the user's agreement has to exist, fully
 * decided, before anything is changed.
 */
@ApiTags('ZUNO - Realignment')
@ApiBearerAuth('JWT-auth')
@Controller('realignment')
@UseGuards(JwtAuthGuard, ZunoUserGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class ZunoRealignmentController {
  constructor(
    private readonly realignment: RealignmentService,
    private readonly idempotency: IdempotencyService,
  ) {}

  /** Step 21 section 45: work out what should change. Nothing is applied. */
  @Post('evaluate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Work out what should change, without changing it' })
  @ApiResponse({ status: 200, description: 'A realignment decision, possibly NONE.' })
  @ApiResponse({ status: 403, description: 'Blocked by the safety policy.' })
  async evaluate(
    @CurrentZunoUser() user: ZunoUser,
    @Body() dto: EvaluateRealignmentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.idempotency.execute(
      {
        operation: 'REALIGNMENT_EVALUATE',
        key: idempotencyKey,
        userId: user.id,
        requestBody: dto,
      },
      async () => {
        const decision = await this.realignment.evaluate({
          user,
          challengeId: dto.challengeId,
          triggerSignalId: dto.triggerSignalId ?? null,
        });
        return {
          ...RealignmentView.from(decision.realignment, decision.changes),
          replayed: decision.idempotentReplay,
        };
      },
    );
  }

  /**
   * Step 21 section 46 / Step 14 section 83: apply an evaluated realignment.
   *
   * Atomic in the service: plan, MKA and pending reminders move together or not
   * at all (Roadmap section 63). A failure here means nothing was changed and
   * the realignment is still pending - safe to retry.
   */
  @Post(':realignmentId/apply')
  @HttpCode(200)
  @ApiOperation({ summary: 'Apply this realignment' })
  @ApiResponse({ status: 200, description: 'Applied.' })
  @ApiResponse({
    status: 409,
    description: 'Needs your confirmation, already applied, or nothing to change.',
  })
  async apply(
    @CurrentZunoUser() user: ZunoUser,
    @Param('realignmentId', ParseUUIDPipe) realignmentId: string,
    @Body() dto: ApplyRealignmentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.idempotency.execute(
      {
        operation: 'REALIGNMENT_APPLY',
        key: idempotencyKey,
        userId: user.id,
        requestBody: { realignmentId, ...dto },
      },
      async () => {
        const applied = await this.realignment.apply({
          user,
          realignmentId,
          userConfirmed: dto.confirmed,
          expectedVersion: dto.version,
        });
        const changes = await this.realignment.changesFor(
          applied.realignment.id,
        );
        return {
          ...RealignmentView.from(applied.realignment, changes),
          newPlanId: applied.newPlanId,
          cancelledItemCount: applied.cancelledItemIds.length,
          suppressedReminderCount: applied.suppressedReminderIds.length,
          // Honest when no Plan/MKA module is bound: the decision is recorded,
          // no plan was touched. Build Rule 128.
          planChangesApplied: applied.targetApplied,
        };
      },
    );
  }

  /** Step 21 section 44: realignment history for a challenge. */
  @Get()
  @ApiOperation({ summary: 'Realignments for a WhatNow, newest first' })
  async list(
    @CurrentZunoUser() user: ZunoUser,
    @Query() query: ListRealignmentsQueryDto,
  ) {
    const rows = await this.realignment.list(
      user.id,
      query.challengeId,
      query.limit ?? 20,
    );
    return rows.map((row) => RealignmentView.from(row));
  }

  @Get(':realignmentId')
  @ApiOperation({ summary: 'One realignment, with its full diff' })
  @ApiResponse({ status: 404, description: 'Not found, or not yours.' })
  async detail(
    @CurrentZunoUser() user: ZunoUser,
    @Param('realignmentId', ParseUUIDPipe) realignmentId: string,
  ) {
    const row = await this.realignment.findOwned(user.id, realignmentId);
    const changes = await this.realignment.changesFor(row.id);
    return RealignmentView.from(row, changes);
  }
}
