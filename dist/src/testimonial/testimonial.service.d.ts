import { Repository } from 'typeorm';
import { Testimonial } from './entities/testimonial.entity';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
export declare class TestimonialService {
    private readonly testimonialRepository;
    private readonly logger;
    constructor(testimonialRepository: Repository<Testimonial>);
    findAll(category?: string): Promise<Testimonial[]>;
    findFeatured(): Promise<Testimonial[]>;
    create(dto: CreateTestimonialDto): Promise<Testimonial>;
    findAllForAdmin(): Promise<Testimonial[]>;
    update(id: number, dto: UpdateTestimonialDto): Promise<Testimonial>;
    softDelete(id: number): Promise<void>;
}
