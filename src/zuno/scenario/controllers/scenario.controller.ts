import {
  Body,
  Controller,
  Delete,
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
import { ScenarioService } from '../services/scenario.service';
import { WhatIfService } from '../services/what-if.service';
import {
  GenerateScenariosDto,
  ListScenariosQueryDto,
  ScenarioDecisionDto,
  ScenarioSetView,
  ScenarioTriggeredDto,
  ScenarioView,
  WhatIfRequestDto,
  WhatIfView,
} from '../dtos/scenario.dtos';

/**
 * Scenario & What-If API. Step 21 API Contracts sections 36-40,
 * Step 12 sections 83-84.
 *
 * ROUTE SHAPE - a deliberate, recorded decision.
 *
 * Step 21 sections 36 and 38 nest these under the challenge:
 *   GET/POST /api/v1/challenges/{challengeId}/scenarios[/generate]
 *   POST/GET/DELETE /api/v1/challenges/{challengeId}/what-if[/{sessionId}]
 * Step 12 sections 83-84, the engine specification, puts them at the root:
 *   POST /v1/scenarios/generate
 *   POST /v1/scenarios/what-if
 *
 * This controller is mounted at the root `scenarios`, which is the root already
 * reserved in `common/zuno-routes.ts`. Mounting under `challenges` would put a
 * second controller on a prefix owned by ZunoChallengesController, and the
 * ZUNO envelope registration in `zuno-routes.ts` is keyed on route roots.
 *
 * Nothing in the contract is lost by this: the challenge id moves from the path
 * into the request body or query string, and every field of the request and
 * response bodies in Step 21 sections 37, 39 and 40 is honoured exactly. The
 * deviation is the path only, and it is listed in WIRING.md so it can be
 * revisited without archaeology.
 *
 * Every route is guarded twice, as in ZunoChallengesController: JwtAuthGuard
 * proves who the caller is, ZunoUserGuard resolves them to a ZUNO user and
 * makes that the only identity the handlers can see. No handler accepts a user
 * id (Step 21 Rule 6).
 */
@ApiTags('ZUNO - Scenarios & What-If')
@ApiBearerAuth('JWT-auth')
@Controller('scenarios')
@UseGuards(JwtAuthGuard, ZunoUserGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class ZunoScenarioController {
  constructor(
    private readonly scenarios: ScenarioService,
    private readonly whatIf: WhatIfService,
    private readonly idempotency: IdempotencyService,
  ) {}

  /**
   * Step 21 section 36 / Step 12 section 83: generate a scenario set.
   *
   * Idempotent on the caller's key, because Step 21 section 16 makes any
   * expensive generation retry-sensitive - a mobile client that times out and
   * retries must not burn a second model call and create a second set version.
   */
  @Post('generate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate the scenario set for a challenge' })
  @ApiResponse({ status: 200, description: 'Scenario set produced.' })
  @ApiResponse({ status: 202, description: 'The challenge is not understood yet.' })
  @ApiResponse({ status: 403, description: 'Blocked by the safety policy.' })
  @ApiResponse({ status: 503, description: 'Intelligence layer unavailable.' })
  async generate(
    @CurrentZunoUser() user: ZunoUser,
    @Body() dto: GenerateScenariosDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.idempotency.execute(
      {
        operation: 'SCENARIO_GENERATE',
        key: idempotencyKey,
        userId: user.id,
        requestBody: dto,
      },
      async () => {
        const { set, scenarios } = await this.scenarios.generate({
          user,
          challengeId: dto.challengeId,
          reason: dto.reason,
        });
        // Spread rather than returned directly: IdempotencyService.execute is
        // generic over `Record<string, unknown>`, which a class type does not
        // satisfy without an index signature. The JSON is identical.
        return {
          ...ScenarioSetView.from(
            set,
            scenarios.filter((scenario) => scenario.user_facing),
          ),
        };
      },
    );
  }

  /**
   * Step 21 section 36: read the current set.
   *
   * A pure read. Step 12 section 85 says generation happens once per material
   * challenge context version and section 86 explicitly excludes "screen
   * reopen" as a regeneration trigger, so opening this endpoint never calls a
   * model. Returning null means the set has not been generated yet, which is
   * the honest answer Step 21 section 109 asks for.
   */
  @Get()
  @ApiOperation({ summary: 'Read the current scenario set for a challenge' })
  @ApiResponse({ status: 200, description: 'The current set, or null.' })
  async list(
    @CurrentZunoUser() user: ZunoUser,
    @Query() query: ListScenariosQueryDto,
  ) {
    const result = await this.scenarios.listCurrent(user, query.challengeId, {
      includeAll: query.includeAll,
    });
    if (!result) return null;
    return ScenarioSetView.from(result.set, result.scenarios);
  }

  /**
   * Step 12 sections 68-69: the user adopts, rejects or dismisses a path.
   *
   * Recording a decision does not schedule anything. Step 12 section 57 and
   * Rule 8 leave execution with the Plan Engine, and section 101 names
   * automatic task creation as the anti-pattern.
   */
  @Post(':scenarioId/decision')
  @HttpCode(200)
  @ApiOperation({ summary: 'Record the user\'s decision about a path' })
  @ApiResponse({ status: 409, description: 'Stale version, or illegal transition.' })
  async decide(
    @CurrentZunoUser() user: ZunoUser,
    @Param('scenarioId', ParseUUIDPipe) scenarioId: string,
    @Body() dto: ScenarioDecisionDto,
  ) {
    const scenario = await this.scenarios.decide(
      user,
      scenarioId,
      dto.decision,
      dto.note,
      dto.version,
    );
    return ScenarioView.from(scenario);
  }

  /**
   * Step 12 sections 22-23 and Rule 7: this path has become reality.
   *
   * From here the Life Signal and Realignment flow owns it. This endpoint
   * records the fact and emits the event; it does not decide what changes.
   */
  @Post(':scenarioId/triggered')
  @HttpCode(200)
  @ApiOperation({ summary: 'Record that this path has become reality' })
  @ApiResponse({ status: 409, description: 'Stale version, or illegal transition.' })
  async triggered(
    @CurrentZunoUser() user: ZunoUser,
    @Param('scenarioId', ParseUUIDPipe) scenarioId: string,
    @Body() dto: ScenarioTriggeredDto,
  ) {
    const scenario = await this.scenarios.markTriggered(
      user,
      scenarioId,
      dto.note,
      dto.version,
    );
    return ScenarioView.from(scenario);
  }

  /**
   * Step 21 section 38 / Step 12 section 84: explore a hypothetical.
   *
   * Returns `mode: HYPOTHETICAL`, `currentPlanChanged: false` and the mandatory
   * notice from Step 12 section 40. Nothing about the challenge, its context or
   * any plan changes as a result of calling this.
   */
  @Post('what-if')
  @HttpCode(200)
  @ApiOperation({ summary: 'Explore a hypothetical without changing anything' })
  @ApiResponse({ status: 200, description: 'Hypothetical preview.' })
  @ApiResponse({ status: 403, description: 'Blocked by the safety policy.' })
  async explore(
    @CurrentZunoUser() user: ZunoUser,
    @Body() dto: WhatIfRequestDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.idempotency.execute(
      {
        operation: 'WHAT_IF_EXPLORE',
        key: idempotencyKey,
        userId: user.id,
        requestBody: dto,
      },
      async () => {
        const { session, assumptions } = await this.whatIf.explore({
          user,
          challengeId: dto.challengeId,
          question: dto.question,
        });
        return { ...WhatIfView.from(session, assumptions) };
      },
    );
  }

  /** Step 21 section 38: read one exploration back. */
  @Get('what-if/:sessionId')
  @ApiOperation({ summary: 'Read a hypothetical exploration' })
  @ApiResponse({ status: 404, description: 'Not found, expired, or not yours.' })
  async readWhatIf(
    @CurrentZunoUser() user: ZunoUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    const { session, assumptions } = await this.whatIf.findOwnedSession(
      user,
      sessionId,
    );
    return WhatIfView.from(session, assumptions);
  }

  /** Step 21 section 38: discard an exploration. */
  @Delete('what-if/:sessionId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Discard a hypothetical exploration' })
  async discardWhatIf(
    @CurrentZunoUser() user: ZunoUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    await this.whatIf.discard(user, sessionId);
    return { discarded: true };
  }
}
