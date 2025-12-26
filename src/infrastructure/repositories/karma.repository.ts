import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { KarmaEntry } from '../../karma/entities/karma-entry.entity';
import {
  IKarmaRepository,
  CreateKarmaEntryInput,
  UpdateKarmaEntryInput,
} from '../../core/interfaces/repositories/karma-repository.interface';

@Injectable()
export class KarmaRepository implements IKarmaRepository {
  constructor(
    @InjectRepository(KarmaEntry)
    private readonly karmaRepository: Repository<KarmaEntry>,
  ) {}

  async findById(id: number): Promise<KarmaEntry | null> {
    return this.karmaRepository.findOne({ where: { id, is_deleted: false }, relations: ['customer'] });
  }

  async findByUniqueId(uniqueId: string): Promise<KarmaEntry | null> {
    return this.karmaRepository.findOne({
      where: { unique_id: uniqueId, is_deleted: false },
      relations: ['customer'],
    });
  }

  /**
   * Build where clause to reduce code duplication
   */
  private buildWhereClause(userId: number | undefined, options?: { karma_type?: string; is_deleted?: boolean }): any {
    const where: any = { is_deleted: options?.is_deleted ?? false };
    if (userId !== undefined) {
      where.user_id = userId;
    }
    if (options?.karma_type) {
      where.karma_type = options.karma_type;
    }
    return where;
  }

  async findByUserId(userId: number, options?: { karma_type?: string }): Promise<KarmaEntry[]> {
    const where = this.buildWhereClause(userId, options);
    return this.karmaRepository.find({ where, order: { added_date: 'DESC' } });
  }

  async findByUserIdAndDateRange(userId: number, startDate: Date, endDate: Date): Promise<KarmaEntry[]> {
    return this.karmaRepository.find({
      where: {
        user_id: userId,
        is_deleted: false,
        entry_date: Between(startDate, endDate),
      },
      order: { added_date: 'DESC' },
    });
  }

  async findAll(options?: { karma_type?: string; is_deleted?: boolean }): Promise<KarmaEntry[]> {
    const where = this.buildWhereClause(undefined, options);
    return this.karmaRepository.find({ where, relations: ['customer'], order: { added_date: 'DESC' } });
  }

  async create(data: CreateKarmaEntryInput): Promise<KarmaEntry> {
    const karmaEntry = this.karmaRepository.create(data);
    return this.karmaRepository.save(karmaEntry);
  }

  async update(karmaEntry: KarmaEntry, data: UpdateKarmaEntryInput): Promise<KarmaEntry> {
    Object.assign(karmaEntry, data);
    return this.karmaRepository.save(karmaEntry);
  }

  async delete(karmaEntry: KarmaEntry): Promise<void> {
    karmaEntry.is_deleted = true;
    await this.karmaRepository.save(karmaEntry);
  }
}

