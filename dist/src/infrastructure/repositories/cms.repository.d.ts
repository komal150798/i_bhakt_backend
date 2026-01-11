import { Repository } from 'typeorm';
import { CMSPage } from '../../cms/entities/cms-page.entity';
import { ICMSRepository, CreateCMSPageInput, UpdateCMSPageInput } from '../../core/interfaces/repositories/cms-repository.interface';
import { CMSPageType } from '../../common/enums/cms-page-type.enum';
export declare class CMSRepository implements ICMSRepository {
    private readonly cmsRepository;
    constructor(cmsRepository: Repository<CMSPage>);
    findById(id: number): Promise<CMSPage | null>;
    findByUniqueId(uniqueId: string): Promise<CMSPage | null>;
    findBySlug(slug: string): Promise<CMSPage | null>;
    findByPageType(pageType: CMSPageType, options?: {
        is_published?: boolean;
    }): Promise<CMSPage[]>;
    findAll(options?: {
        is_published?: boolean;
        is_deleted?: boolean;
    }): Promise<CMSPage[]>;
    create(data: CreateCMSPageInput & {
        added_by: number;
        modify_by: number;
    }): Promise<CMSPage>;
    update(cmsPage: CMSPage, data: UpdateCMSPageInput & {
        modify_by: number;
    }): Promise<CMSPage>;
    delete(cmsPage: CMSPage, userId: number): Promise<void>;
}
