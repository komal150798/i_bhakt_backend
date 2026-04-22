import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial } from './entities/testimonial.entity';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

@Injectable()
export class TestimonialService {
  private readonly logger = new Logger(TestimonialService.name);

  constructor(
    @InjectRepository(Testimonial)
    private readonly testimonialRepository: Repository<Testimonial>,
  ) {}

  async findAll(category?: string): Promise<Testimonial[]> {
    const where: any = { is_deleted: false, is_enabled: true };
    if (category) {
      where.category = category;
    }
    return this.testimonialRepository.find({
      where,
      order: { is_featured: 'DESC', display_order: 'ASC', added_date: 'DESC' },
    });
  }

  async findFeatured(): Promise<Testimonial[]> {
    return this.testimonialRepository.find({
      where: { is_deleted: false, is_enabled: true, is_featured: true },
      order: { display_order: 'ASC', added_date: 'DESC' },
      take: 6,
    });
  }

  async create(dto: CreateTestimonialDto): Promise<Testimonial> {
    const testimonial = this.testimonialRepository.create({
      name: dto.name,
      avatar_url: dto.avatar_url?.trim() || null,
      location: dto.location?.trim() || null,
      message: dto.message,
      rating: dto.rating,
      category: dto.category,
      is_featured: dto.is_featured || false,
      display_order: dto.display_order ?? 0,
      is_enabled: dto.is_enabled !== undefined ? dto.is_enabled : true,
    });
    const saved = await this.testimonialRepository.save(testimonial);
    this.logger.log(`Testimonial created: ${saved.id} by ${dto.name}`);
    return saved;
  }

  /** All non-deleted rows (admin can see disabled too) */
  async findAllForAdmin(): Promise<Testimonial[]> {
    return this.testimonialRepository.find({
      where: { is_deleted: false },
      order: { is_featured: 'DESC', display_order: 'ASC', added_date: 'DESC' },
    });
  }

  async update(id: number, dto: UpdateTestimonialDto): Promise<Testimonial> {
    const existing = await this.testimonialRepository.findOne({
      where: { id, is_deleted: false },
    });
    if (!existing) {
      throw new NotFoundException(`Testimonial ${id} not found`);
    }
    const patch: Partial<Testimonial> = { ...dto };
    if (dto.avatar_url !== undefined) {
      patch.avatar_url = dto.avatar_url?.trim() || null;
    }
    if (dto.location !== undefined) {
      patch.location = dto.location?.trim() || null;
    }
    const merged = this.testimonialRepository.merge(existing, patch);
    return this.testimonialRepository.save(merged);
  }

  async softDelete(id: number): Promise<void> {
    const existing = await this.testimonialRepository.findOne({
      where: { id, is_deleted: false },
    });
    if (!existing) {
      throw new NotFoundException(`Testimonial ${id} not found`);
    }
    existing.is_deleted = true;
    await this.testimonialRepository.save(existing);
    this.logger.log(`Testimonial soft-deleted: ${id}`);
  }
}
