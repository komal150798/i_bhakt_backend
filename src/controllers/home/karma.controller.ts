import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KarmaCategory } from '../../karma/entities/karma-category.entity';

@Controller('home/karma')
export class HomeKarmaController {
  constructor(
    @InjectRepository(KarmaCategory)
    private readonly categoryRepository: Repository<KarmaCategory>,
  ) {}

  /**
   * POST /api/v1/home/karma/master/categories
   * Get all karma categories (public endpoint)
   */
  @Post('master/categories')
  @HttpCode(HttpStatus.OK)
  async getMasterCategories() {
    return this.categoryRepository.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });
  }
}

