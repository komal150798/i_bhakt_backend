import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async findByUserId(userId: number, options?: { karma_type?: string }): Promise<KarmaEntry[]> {
    const where: any = { user_id: userId, is_deleted: false };
    if (options?.karma_type) {
      where.karma_type = options.karma_type;
    }
    return this.karmaRepository.find({ where, order: { added_date: 'DESC' } });
  }

  async findAll(options?: { karma_type?: string; is_deleted?: boolean }): Promise<KarmaEntry[]> {
    const where: any = { is_deleted: options?.is_deleted ?? false };
    if (options?.karma_type) {
      where.karma_type = options.karma_type;
    }
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

