import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CMSPage } from '../../cms/entities/cms-page.entity';
import {
  ICMSRepository,
  CreateCMSPageInput,
  UpdateCMSPageInput,
} from '../../core/interfaces/repositories/cms-repository.interface';
import { CMSPageType } from '../../common/enums/cms-page-type.enum';

@Injectable()
export class CMSRepository implements ICMSRepository {
  constructor(
    @InjectRepository(CMSPage)
    private readonly cmsRepository: Repository<CMSPage>,
  ) {}

  async findById(id: number): Promise<CMSPage | null> {
    return this.cmsRepository.findOne({ where: { id, is_deleted: false } });
  }

  async findByUniqueId(uniqueId: string): Promise<CMSPage | null> {
    return this.cmsRepository.findOne({
      where: { unique_id: uniqueId, is_deleted: false },
    });
  }

  async findBySlug(slug: string): Promise<CMSPage | null> {
    return this.cmsRepository.findOne({
      where: { slug, is_deleted: false },
    });
  }

  async findByPageType(
    pageType: CMSPageType,
    options?: { is_published?: boolean },
  ): Promise<CMSPage[]> {
    const where: any = { page_type: pageType, is_deleted: false };
    if (options?.is_published !== undefined) {
      where.is_published = options.is_published;
    }
    return this.cmsRepository.find({ where, order: { added_date: 'DESC' } });
  }

  async findAll(options?: { is_published?: boolean; is_deleted?: boolean }): Promise<CMSPage[]> {
    const where: any = { is_deleted: options?.is_deleted ?? false };
    if (options?.is_published !== undefined) {
      where.is_published = options.is_published;
    }
    return this.cmsRepository.find({ where, order: { added_date: 'DESC' } });
  }

  async create(
    data: CreateCMSPageInput & { added_by: number; modify_by: number },
  ): Promise<CMSPage> {
    const cmsPage = this.cmsRepository.create(data);
    return this.cmsRepository.save(cmsPage);
  }

  async update(
    cmsPage: CMSPage,
    data: UpdateCMSPageInput & { modify_by: number },
  ): Promise<CMSPage> {
    Object.assign(cmsPage, data);
    cmsPage.modify_by = data.modify_by;
    return this.cmsRepository.save(cmsPage);
  }

  async delete(cmsPage: CMSPage, userId: number): Promise<void> {
    cmsPage.is_deleted = true;
    cmsPage.modify_by = userId;
    await this.cmsRepository.save(cmsPage);
  }
}

