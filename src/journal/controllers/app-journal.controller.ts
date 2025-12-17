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
} from '@nestjs/swagger';
import { JournalService } from '../journal.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { GetJournalEntriesDto } from '../dto/get-journal-entries.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Journal (App)')
@Controller('app/journal')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppJournalController {
  constructor(private readonly journalService: JournalService) {}

  /**
   * POST /api/v1/app/journal
   * Create a new journal entry
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new journal entry (Mobile App)' })
  @ApiResponse({
    status: 201,
    description: 'Journal entry created successfully',
  })
  async createJournalEntry(
    @Body() dto: CreateJournalEntryDto,
    @CurrentUser() user: any,
  ) {
    const entry = await this.journalService.createJournalEntry(user.id, dto);

    return {
      success: true,
      data: {
        id: entry.id,
        content: entry.content,
        entry_date: entry.entry_date,
        entry_type: entry.entry_type,
        sentiment: entry.sentiment_analysis,
        karma_entry_id: entry.karma_entry_id,
        created_at: entry.added_date,
      },
    };
  }

  /**
   * GET /api/v1/app/journal
   * Get journal entries with filters
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get journal entries (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Journal entries retrieved successfully',
  })
  async getJournalEntries(
    @Query() query: GetJournalEntriesDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.journalService.getJournalEntries(user.id, query);

    return {
      success: true,
      data: {
        entries: result.entries.map(entry => ({
          id: entry.id,
          content: entry.content,
          entry_date: entry.entry_date,
          entry_type: entry.entry_type,
          sentiment: entry.sentiment_analysis,
          karma_entry_id: entry.karma_entry_id,
          created_at: entry.added_date,
        })),
        total: result.total,
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
    };
  }

  /**
   * GET /api/v1/app/journal/:id
   * Get a single journal entry by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get journal entry by ID (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Journal entry retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Journal entry not found' })
  async getJournalEntry(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const entry = await this.journalService.getJournalEntryById(user.id, id);

    return {
      success: true,
      data: {
        id: entry.id,
        content: entry.content,
        entry_date: entry.entry_date,
        entry_type: entry.entry_type,
        sentiment: entry.sentiment_analysis,
        nlp_analysis: entry.nlp_analysis,
        karma_entry_id: entry.karma_entry_id,
        created_at: entry.added_date,
        updated_at: entry.modify_date,
      },
    };
  }

  /**
   * PUT /api/v1/app/journal/:id
   * Update a journal entry
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update journal entry (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Journal entry updated successfully',
  })
  async updateJournalEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateJournalEntryDto>,
    @CurrentUser() user: any,
  ) {
    const entry = await this.journalService.updateJournalEntry(user.id, id, dto);

    return {
      success: true,
      data: {
        id: entry.id,
        content: entry.content,
        entry_type: entry.entry_type,
        updated_at: entry.modify_date,
      },
    };
  }

  /**
   * DELETE /api/v1/app/journal/:id
   * Delete a journal entry
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete journal entry (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Journal entry deleted successfully',
  })
  async deleteJournalEntry(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    await this.journalService.deleteJournalEntry(user.id, id);

    return {
      success: true,
      message: 'Journal entry deleted successfully',
    };
  }
}

