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
import { MkaService } from '../services/mka.service';
import {
  CompleteMkaItemDto,
  GenerateMkaDto,
  ListMkaQueryDto,
  MkaCompletionView,
  MkaProgramView,
  SkipMkaItemDto,
} from '../dtos/mka.dtos';

/**
 * Mind Karma Action API.
 * Step 21 API Contracts sections 47-49.
 *
 * ROUTE SHAPE - A DELIBERATE DEVIATION, RECORDED IN WIRING.md.
 * Step 21 section 47 specifies the generation and read endpoints under
 * `/challenges/{challengeId}/mka`, and the completion endpoints under
 * `/mka/items/{itemId}/...`. This controller is mounted at the `mka` root, so
 * the two completion routes match the contract exactly while the challenge-
 * scoped pair are served here as `GET /mka?challengeId=` and
 * `POST /mka/generate`. `ZunoChallengeMkaController` below restores the literal
 * contract paths; both are listed in WIRING.md so the decision is made once,
 * centrally, rather than assumed here.
 *
 * Guarded twice, like every other ZUNO controller: JwtAuthGuard proves who the
 * caller is, ZunoUserGuard resolves them to a ZUNO user. No handler accepts a
 * user id (Step 21 Rule 6) - ownership is always derived from the token.
 */
@ApiTags('ZUNO - Mind Karma Action')
@ApiBearerAuth('JWT-auth')
@Controller('mka')
@UseGuards(JwtAuthGuard, ZunoUserGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class ZunoMkaController {
  constructor(
    private readonly mka: MkaService,
    private readonly idempotency: IdempotencyService,
  ) {}

  /** The programme currently in force. Step 21 section 47/48. */
  @Get()
  @ApiOperation({ summary: "Get the current MKA programme for a WhatNow" })
  @ApiResponse({ status: 202, description: 'No programme generated yet.' })
  @ApiResponse({ status: 404, description: 'Not found, or not yours.' })
  async current(
    @CurrentZunoUser() user: ZunoUser,
    @Query() query: ListMkaQueryDto,
  ) {
    if (!query.challengeId) {
      const programs = await this.mka.listPrograms(user.id);
      return programs.map((program) =>
        MkaProgramView.from(program, []),
      );
    }
    const { program, items } = await this.mka.currentForChallenge(
      user,
      query.challengeId,
    );
    return MkaProgramView.from(program, items);
  }

  @Get(':programId')
  @ApiOperation({ summary: 'Get one MKA programme, including superseded ones' })
  async detail(
    @CurrentZunoUser() user: ZunoUser,
    @Param('programId', ParseUUIDPipe) programId: string,
  ) {
    const program = await this.mka.findOwnedProgram(user.id, programId);
    const items = await this.mka.itemsFor(program.id);
    return MkaProgramView.from(program, items);
  }

  /**
   * Step 21 section 47: generate.
   *
   * Idempotency-keyed because generation is expensive and mobile clients
   * retry. Step 15 section 92 additionally makes the *engine* idempotent
   * against identical inputs, so a retry without a key still cannot produce a
   * duplicate active programme.
   */
  @Post('generate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate the Mind / Karma / Action programme' })
  @ApiResponse({ status: 200, description: 'Programme generated or returned.' })
  @ApiResponse({ status: 403, description: 'Blocked by the safety policy.' })
  async generate(
    @CurrentZunoUser() user: ZunoUser,
    @Body() dto: GenerateMkaDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.idempotency.execute(
      {
        operation: 'MKA_GENERATE',
        key: idempotencyKey,
        userId: user.id,
        requestBody: dto,
      },
      async () => {
        const { program, items } = await this.mka.generate({
          user,
          challengeId: dto.challengeId,
          period: dto.period,
          regenerate: dto.regenerate === true,
        });
        // Spread, not the class instance: IdempotencyService.execute is
        // generic over `Record<string, unknown>`, which a class type does not
        // satisfy (TypeScript only infers an implicit index signature for
        // anonymous object types).
        return { ...MkaProgramView.from(program, items) };
      },
    );
  }

  /** Step 21 section 47: `POST /mka/items/{itemId}/complete`. */
  @Post('items/:itemId/complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark an MKA practice done for a date' })
  @ApiResponse({ status: 409, description: 'Programme or item is not active.' })
  async complete(
    @CurrentZunoUser() user: ZunoUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: CompleteMkaItemDto,
  ) {
    const completion = await this.mka.completeItem(user, itemId, {
      date: dto.date,
      note: dto.note,
    });
    return MkaCompletionView.from(completion);
  }

  /**
   * Step 21 section 47: `POST /mka/items/{itemId}/skip`.
   *
   * Returns the same shape as complete, on purpose. Step 15 sections 66-69
   * forbid treating a skipped practice as a failure, and a different response
   * shape would invite a client to render it as one.
   */
  @Post('items/:itemId/skip')
  @HttpCode(200)
  @ApiOperation({ summary: 'Skip an MKA practice for a date, without penalty' })
  async skip(
    @CurrentZunoUser() user: ZunoUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: SkipMkaItemDto,
  ) {
    const completion = await this.mka.skipItem(user, itemId, {
      date: dto.date,
      note: dto.note,
    });
    return MkaCompletionView.from(completion);
  }

  @Get(':programId/completions')
  @ApiOperation({ summary: 'Completion history for a programme' })
  async completions(
    @CurrentZunoUser() user: ZunoUser,
    @Param('programId', ParseUUIDPipe) programId: string,
  ) {
    await this.mka.findOwnedProgram(user.id, programId);
    const rows = await this.mka.completionsFor(user.id, programId);
    return rows.map(MkaCompletionView.from);
  }
}

/**
 * The literal Step 21 section 47 challenge-scoped paths.
 *
 * Separate class rather than extra routes on the controller above, because it
 * mounts on a different root and the central wiring may legitimately choose to
 * register only one of the two. Its routes cannot collide with
 * `ZunoChallengesController` - that controller owns `challenges/:challengeId`,
 * `/analyze`, `/response`, `/resolve` and `/reopen`, none of which is `/mka`.
 */
@ApiTags('ZUNO - Mind Karma Action')
@ApiBearerAuth('JWT-auth')
@Controller('challenges')
@UseGuards(JwtAuthGuard, ZunoUserGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class ZunoChallengeMkaController {
  constructor(
    private readonly mka: MkaService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Get(':challengeId/mka')
  @ApiOperation({ summary: 'Get the current MKA programme for this WhatNow' })
  async current(
    @CurrentZunoUser() user: ZunoUser,
    @Param('challengeId', ParseUUIDPipe) challengeId: string,
  ) {
    const { program, items } = await this.mka.currentForChallenge(
      user,
      challengeId,
    );
    return MkaProgramView.from(program, items);
  }

  @Post(':challengeId/mka/generate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate the MKA programme for this WhatNow' })
  async generate(
    @CurrentZunoUser() user: ZunoUser,
    @Param('challengeId', ParseUUIDPipe) challengeId: string,
    @Body() dto: Omit<GenerateMkaDto, 'challengeId'>,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.idempotency.execute(
      {
        operation: 'MKA_GENERATE',
        key: idempotencyKey,
        userId: user.id,
        requestBody: { challengeId, ...dto },
      },
      async () => {
        const { program, items } = await this.mka.generate({
          user,
          challengeId,
          period: dto?.period,
          regenerate: dto?.regenerate === true,
        });
        // Spread, not the class instance: IdempotencyService.execute is
        // generic over `Record<string, unknown>`, which a class type does not
        // satisfy (TypeScript only infers an implicit index signature for
        // anonymous object types).
        return { ...MkaProgramView.from(program, items) };
      },
    );
  }
}
