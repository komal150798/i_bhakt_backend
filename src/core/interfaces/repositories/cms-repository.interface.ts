import { CMSPage } from '../../../cms/entities/cms-page.entity';
import { CMSPageType } from '../../../common/enums/cms-page-type.enum';

export interface CreateCMSPageInput {
  page_type: CMSPageType;
  slug: string;
  title: string;
  content?: string;
  meta_title?: string;
  meta_description?: string;
  is_published?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateCMSPageInput {
  page_type?: CMSPageType;
  slug?: string;
  title?: string;
  content?: string;
  meta_title?: string;
  meta_description?: string;
  is_published?: boolean;
  metadata?: Record<string, any>;
}

export interface ICMSRepository {
  findById(id: number): Promise<CMSPage | null>;
  findByUniqueId(uniqueId: string): Promise<CMSPage | null>;
  findBySlug(slug: string): Promise<CMSPage | null>;
  findByPageType(pageType: CMSPageType, options?: { is_published?: boolean }): Promise<CMSPage[]>;
  findAll(options?: { is_published?: boolean; is_deleted?: boolean }): Promise<CMSPage[]>;
  create(data: CreateCMSPageInput & { added_by: number; modify_by: number }): Promise<CMSPage>;
  update(cmsPage: CMSPage, data: UpdateCMSPageInput & { modify_by: number }): Promise<CMSPage>;
  delete(cmsPage: CMSPage, userId: number): Promise<void>;
}

