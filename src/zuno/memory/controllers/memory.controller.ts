import {
  Body,
  Controller,
  Delete,
  Get,
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
import { MemoryService, whyItMatters } from '../services/memory.service';
import {
  CorrectMemoryDto,
  ListMemoryQueryDto,
  MemoryCandidateView,
  MemoryView,
  RejectCandidateDto,
} from '../dtos/memory.dtos';
import { MemoryRejectionReason } from '../enums/memory.enum';

/**
 * User-facing memory controls. Step 21 API Contracts section 58, mounted at
 * `/api/v1/memory` - the global prefix supplies `api/v1`, and `memory` is
 * already registered in `common/zuno-routes.ts` so the ZUNO envelope applies
 * rather than the legacy iBhakt one.
 *
 * Step 18 sections 51-54 and Step 24 sections 40-41 are the requirement this
 * controller exists to satisfy: the user must be able to see what ZUNO
 * remembers, correct it, and delete it. Build Rule 226 makes memory ownership
 * a hard boundary, which is why no handler takes a user id - identity comes
 * only from ZunoUserGuard, and every service call is ownership-checked
 * server-side (Step 21 Rule 6).
 *
 * Deliberately absent: any endpoint that lets a client *create* a memory
 * directly. Step 18 section 85 puts what gets stored on the deterministic
 * backend side, behind the candidate pipeline. A `POST /memory` would let a
 * client write straight into the store ZUNO later treats as what it knows about
 * the person, bypassing worthiness, sensitivity and conflict checks entirely.
 */
@ApiTags('ZUNO - Memory')
@ApiBearerAuth('JWT-auth')
@Controller('memory')
@UseGuards(JwtAuthGuard, ZunoUserGuard)
@UseInterceptors(ZunoResponseInterceptor)
@UseFilters(ZunoExceptionFilter)
export class ZunoMemoryController {
  constructor(private readonly memory: MemoryService) {}

  /**
   * Step 21 section 58: `GET /api/v1/memory`.
   * Returns the contract shape from section 59 and nothing else.
   */
  @Get()
  @ApiOperation({ summary: 'What ZUNO currently remembers about you' })
  async list(
    @CurrentZunoUser() user: ZunoUser,
    @Query() query: ListMemoryQueryDto,
  ) {
    const rows = await this.memory.listForUser(user.id, {
      type: query.type,
      challengeId: query.challengeId,
      scope: query.scope,
    });
    return rows.map((row) => MemoryView.from(row, whyItMatters(row)));
  }

  /**
   * Step 18 section 53 - the same information grouped for a memory screen.
   *
   * Declared before `:memoryId` routes so a literal path segment is never
   * swallowed by the parameterised route.
   */
  @Get('summary')
  @ApiOperation({ summary: 'Grouped, readable summary of retained memory' })
  async summary(@CurrentZunoUser() user: ZunoUser) {
    return this.memory.summaryForUser(user.id);
  }

  /** Candidates ZUNO will not keep without being told. Step 18 section 24. */
  @Get('candidates')
  @ApiOperation({ summary: 'Memories ZUNO would like to confirm with you' })
  async candidates(@CurrentZunoUser() user: ZunoUser) {
    const rows = await this.memory.pendingCandidates(user.id);
    return rows.map(MemoryCandidateView.from);
  }

  @Post('candidates/:candidateId/confirm')
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirm a memory ZUNO asked about' })
  @ApiResponse({ status: 404, description: 'Not found, or not yours.' })
  @ApiResponse({ status: 409, description: 'Already decided.' })
  async confirm(
    @CurrentZunoUser() user: ZunoUser,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    const memory = await this.memory.confirmCandidate(user.id, candidateId);
    return MemoryView.from(memory, whyItMatters(memory));
  }

  @Post('candidates/:candidateId/reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'Tell ZUNO not to keep this' })
  async reject(
    @CurrentZunoUser() user: ZunoUser,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Body() _dto: RejectCandidateDto,
  ) {
    const candidate = await this.memory.rejectCandidate(
      user.id,
      candidateId,
      MemoryRejectionReason.USER_REJECTED,
    );
    return { id: candidate.id, status: candidate.status };
  }

  /**
   * Step 18 section 52 / Step 24 section 41: clear the memory attached to one
   * challenge. Declared before `DELETE /:memoryId` so `challenge` is not
   * parsed as a memory id.
   */
  @Delete('challenge/:challengeId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Forget everything tied to one challenge' })
  async clearChallenge(
    @CurrentZunoUser() user: ZunoUser,
    @Param('challengeId', ParseUUIDPipe) challengeId: string,
  ) {
    const deleted = await this.memory.deleteChallengeMemory(
      user.id,
      challengeId,
    );
    return { deleted };
  }

  /**
   * Step 21 section 58 / Step 18 section 90: `PATCH /api/v1/memory/{memoryId}`.
   *
   * This is correction, not editing. The old memory is superseded rather than
   * overwritten (Step 18 section 29), so the response carries the *new* memory
   * id - a client holding the old id should follow this one.
   */
  @Patch(':memoryId')
  @ApiOperation({ summary: 'Correct something ZUNO got wrong' })
  @ApiResponse({ status: 409, description: 'Stale version, or not correctable.' })
  async correct(
    @CurrentZunoUser() user: ZunoUser,
    @Param('memoryId', ParseUUIDPipe) memoryId: string,
    @Body() dto: CorrectMemoryDto,
  ) {
    const corrected = await this.memory.correct({
      userId: user.id,
      memoryId,
      statement: dto.statement,
      label: dto.label,
      expectedVersion: dto.version,
    });
    return MemoryView.from(corrected, whyItMatters(corrected));
  }

  /**
   * Step 21 section 58 / Step 18 section 91: `DELETE /api/v1/memory/{memoryId}`.
   *
   * Returns 200 with an explicit acknowledgement rather than a bare 204,
   * because Step 24 section 165 makes "it stops entering AI context" part of
   * what the user is being promised, and a client that can show that promise
   * being kept is better than one that shows an empty body.
   */
  @Delete(':memoryId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Ask ZUNO to forget this' })
  @ApiResponse({ status: 404, description: 'Not found, or not yours.' })
  async remove(
    @CurrentZunoUser() user: ZunoUser,
    @Param('memoryId', ParseUUIDPipe) memoryId: string,
  ) {
    await this.memory.deleteMemory(user.id, memoryId, 'USER_REQUESTED');
    return { id: memoryId, deleted: true, stopsInfluencingGuidance: true };
  }

  /**
   * Step 18 section 29: the supersession chain behind one memory.
   *
   * Exposed because Step 24 section 40 asks that the user be able to understand
   * what ZUNO remembers - and "this replaced what you told me in August" is
   * part of that understanding. Declared last so it cannot shadow the routes
   * above.
   */
  @Get(':memoryId/history')
  @ApiOperation({ summary: 'What this memory replaced' })
  async history(
    @CurrentZunoUser() user: ZunoUser,
    @Param('memoryId', ParseUUIDPipe) memoryId: string,
  ) {
    const chain = await this.memory.supersessionChain(user.id, memoryId);
    return chain.map((row) => MemoryView.from(row, whyItMatters(row)));
  }
}
