import { Repository } from 'typeorm';
import { KarmaCategory } from '../../karma/entities/karma-category.entity';
export declare class HomeKarmaController {
    private readonly categoryRepository;
    constructor(categoryRepository: Repository<KarmaCategory>);
    getMasterCategories(): Promise<KarmaCategory[]>;
}
