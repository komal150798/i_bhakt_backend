import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ManifestationLog } from '../../manifestation/entities/manifestation-log.entity';
import {
  IManifestationRepository,
  CreateManifestationLogInput,
  UpdateManifestationLogInput,
} from '../../core/interfaces/repositories/manifestation-repository.interface';

@Injectable()
export class ManifestationRepository implements IManifestationRepository {
  constructor(
    @InjectRepository(ManifestationLog)
    private readonly manifestationRepository: Repository<ManifestationLog>,
  ) {}

  async findById(id: number): Promise<ManifestationLog | null> {
    return this.manifestationRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['user'],
    });
  }

  async findByUniqueId(uniqueId: string): Promise<ManifestationLog | null> {
    return this.manifestationRepository.findOne({
      where: { unique_id: uniqueId, is_deleted: false },
      relations: ['user'],
    });
  }

  async findByUserId(userId: number): Promise<ManifestationLog[]> {
    return this.manifestationRepository.find({
      where: { user_id: userId, is_deleted: false },
      order: { added_date: 'DESC' },
    });
  }

  async findAll(options?: { is_deleted?: boolean }): Promise<ManifestationLog[]> {
    const where: any = { is_deleted: options?.is_deleted ?? false };
    return this.manifestationRepository.find({
      where,
      relations: ['user'],
      order: { added_date: 'DESC' },
    });
  }

  async create(data: CreateManifestationLogInput): Promise<ManifestationLog> {
    const manifestationLog = this.manifestationRepository.create(data);
    return this.manifestationRepository.save(manifestationLog);
  }

  async update(
    manifestationLog: ManifestationLog,
    data: UpdateManifestationLogInput,
  ): Promise<ManifestationLog> {
    Object.assign(manifestationLog, data);
    return this.manifestationRepository.save(manifestationLog);
  }

  async delete(manifestationLog: ManifestationLog): Promise<void> {
    manifestationLog.is_deleted = true;
    await this.manifestationRepository.save(manifestationLog);
  }
}

