import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { JournalEntry } from './entities/journal-entry.entity';
import { CreateJournalEntryDto, JournalEntryType } from './dto/create-journal-entry.dto';
import { GetJournalEntriesDto } from './dto/get-journal-entries.dto';
import { KarmaService } from '../karma/services/karma.service';
import { ConstantsService } from '../common/constants/constants.service';

@Injectable()
export class JournalService {
  constructor(
    @InjectRepository(JournalEntry)
    private journalRepository: Repository<JournalEntry>,
    private karmaService: KarmaService, // For linking to karma scoring
    private constantsService: ConstantsService, // Central constants service
  ) {}

  /**
   * Create a new journal entry
   * Optionally creates a karma entry if content suggests karma action
   */
  async createJournalEntry(
    userId: number,
    dto: CreateJournalEntryDto,
  ): Promise<JournalEntry> {
    if (!dto.content || dto.content.trim().length === 0) {
      throw new BadRequestException('Journal content is required');
    }

    const entryDate = dto.entry_date ? new Date(dto.entry_date) : new Date();
    entryDate.setHours(0, 0, 0, 0);

    // TODO: Run NLP/sentiment analysis on content
    // For now, use simple sentiment detection
    const sentiment = await this.analyzeSentiment(dto.content);

    // Create journal entry
    const journalEntry = this.journalRepository.create({
      user_id: userId,
      content: dto.content,
      entry_date: entryDate,
      entry_type: dto.entry_type || JournalEntryType.GENERAL,
      sentiment_analysis: sentiment,
      nlp_analysis: {
        keywords: this.extractKeywords(dto.content),
      },
      metadata: dto.metadata || {},
    });

    const saved = await this.journalRepository.save(journalEntry);

    // If entry type is LEDGER, create karma entry
    if (dto.entry_type === JournalEntryType.LEDGER) {
      try {
        const karmaEntry = await this.karmaService.addKarmaAction({
          user_id: userId,
          action_text: dto.content,
          timestamp: entryDate,
        });

        // Link karma entry to journal entry
        saved.karma_entry_id = karmaEntry.id;
        await this.journalRepository.save(saved);
      } catch (error) {
        // Log error but don't fail journal creation
        console.warn('Failed to create karma entry for journal:', error);
      }
    }

    return saved;
  }

  /**
   * Get journal entries with filters
   */
  async getJournalEntries(
    userId: number,
    dto: GetJournalEntriesDto,
  ): Promise<{ entries: JournalEntry[]; total: number }> {
    const query = this.journalRepository.createQueryBuilder('entry')
      .where('entry.user_id = :userId', { userId })
      .andWhere('entry.is_deleted = false');

    // Apply date filters
    if (dto.from) {
      const fromDate = new Date(dto.from);
      fromDate.setHours(0, 0, 0, 0);
      query.andWhere('entry.entry_date >= :from', { from: fromDate });
    }

    if (dto.to) {
      const toDate = new Date(dto.to);
      toDate.setHours(23, 59, 59, 999);
      query.andWhere('entry.entry_date <= :to', { to: toDate });
    }

    // Apply type filter
    if (dto.type) {
      query.andWhere('entry.entry_type = :type', { type: dto.type });
    }

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    const limit = dto.limit || 20;
    const offset = dto.offset || 0;
    query.skip(offset).take(limit);

    // Order by date (newest first)
    query.orderBy('entry.entry_date', 'DESC')
      .addOrderBy('entry.created_at', 'DESC');

    const entries = await query.getMany();

    return { entries, total };
  }

  /**
   * Get a single journal entry by ID
   */
  async getJournalEntryById(
    userId: number,
    entryId: number,
  ): Promise<JournalEntry> {
    const entry = await this.journalRepository.findOne({
      where: {
        id: entryId,
        user_id: userId,
        is_deleted: false,
      },
    });

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }

    return entry;
  }

  /**
   * Update a journal entry
   */
  async updateJournalEntry(
    userId: number,
    entryId: number,
    updateData: Partial<CreateJournalEntryDto>,
  ): Promise<JournalEntry> {
    const entry = await this.getJournalEntryById(userId, entryId);

    if (updateData.content) {
      entry.content = updateData.content;
      // Re-analyze sentiment if content changed
      entry.sentiment_analysis = await this.analyzeSentiment(updateData.content);
      entry.nlp_analysis = {
        keywords: this.extractKeywords(updateData.content),
      };
    }

    if (updateData.entry_type) {
      entry.entry_type = updateData.entry_type;
    }

    if (updateData.metadata) {
      entry.metadata = { ...entry.metadata, ...updateData.metadata };
    }

    return await this.journalRepository.save(entry);
  }

  /**
   * Delete a journal entry (soft delete)
   */
  async deleteJournalEntry(userId: number, entryId: number): Promise<void> {
    const entry = await this.getJournalEntryById(userId, entryId);
    entry.is_deleted = true;
    await this.journalRepository.save(entry);
  }

  /**
   * Simple sentiment analysis (placeholder - should use ML service in production)
   */
  private async analyzeSentiment(content: string): Promise<{
    sentiment: string;
    score: number;
    emotions?: string[];
  }> {
    const lowerContent = content.toLowerCase();
    // Get words from ConstantsService (database-driven, no hardcoded words)
    const positiveWords = await this.constantsService.getJournalPositiveWords();
    const negativeWords = await this.constantsService.getJournalNegativeWords();

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (lowerContent.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerContent.includes(word)) negativeCount++;
    });

    const score = positiveCount > negativeCount 
      ? 0.5 + (positiveCount / (positiveCount + negativeCount + 1)) * 0.5
      : 0.5 - (negativeCount / (positiveCount + negativeCount + 1)) * 0.5;

    return {
      sentiment: score > 0.6 ? 'positive' : score < 0.4 ? 'negative' : 'neutral',
      score: Math.max(0, Math.min(1, score)),
      emotions: [], // TODO: Extract emotions using NLP
    };
  }

  /**
   * Extract keywords from content (simple implementation)
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - in production, use NLP service
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4); // Filter short words

    // Return top 5 unique words
    return [...new Set(words)].slice(0, 5);
  }
}


