import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kundli } from '../../kundli/entities/kundli.entity';
import {
  IKundliRepository,
  CreateKundliInput,
  UpdateKundliInput,
} from '../../core/interfaces/repositories/kundli-repository.interface';

@Injectable()
export class KundliRepository implements IKundliRepository {
  constructor(
    @InjectRepository(Kundli)
    private readonly kundliRepository: Repository<Kundli>,
  ) {}

  async findById(id: number): Promise<Kundli | null> {
    return this.kundliRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['planets', 'houses', 'user'],
    });
  }

  async findByUniqueId(uniqueId: string): Promise<Kundli | null> {
    return this.kundliRepository.findOne({
      where: { unique_id: uniqueId, is_deleted: false },
      relations: ['planets', 'houses', 'user'],
    });
  }

  async findByUserId(userId: number, options?: { is_deleted?: boolean }): Promise<Kundli[]> {
    return this.kundliRepository.find({
      where: {
        user_id: userId,
        is_deleted: options?.is_deleted ?? false,
      },
      relations: ['planets', 'houses'],
      order: { added_date: 'DESC' },
    });
  }

  async findOneByUserId(userId: number, options?: { is_deleted?: boolean }): Promise<Kundli | null> {
    return this.kundliRepository.findOne({
      where: {
        user_id: userId,
        is_deleted: options?.is_deleted ?? false,
      },
      relations: ['planets', 'houses'],
      order: { added_date: 'DESC' },
    });
  }

  async create(data: CreateKundliInput): Promise<Kundli> {
    const kundli = this.kundliRepository.create(data);
    return this.kundliRepository.save(kundli);
  }

  async update(kundli: Kundli, data: UpdateKundliInput): Promise<Kundli> {
    Object.assign(kundli, data);
    return this.kundliRepository.save(kundli);
  }

  async delete(kundli: Kundli): Promise<void> {
    kundli.is_deleted = true;
    await this.kundliRepository.save(kundli);
  }
}

