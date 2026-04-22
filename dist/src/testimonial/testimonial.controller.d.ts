import { TestimonialService } from './testimonial.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
export declare class TestimonialController {
    private readonly testimonialService;
    constructor(testimonialService: TestimonialService);
    getFeatured(): Promise<{
        success: boolean;
        data: import("./entities/testimonial.entity").Testimonial[];
    }>;
    getAll(category?: string): Promise<{
        success: boolean;
        data: import("./entities/testimonial.entity").Testimonial[];
    }>;
    adminList(): Promise<{
        success: boolean;
        data: import("./entities/testimonial.entity").Testimonial[];
    }>;
    create(dto: CreateTestimonialDto): Promise<{
        success: boolean;
        data: import("./entities/testimonial.entity").Testimonial;
    }>;
    update(id: number, dto: UpdateTestimonialDto): Promise<{
        success: boolean;
        data: import("./entities/testimonial.entity").Testimonial;
    }>;
    remove(id: number): Promise<{
        success: boolean;
        data: {
            id: number;
        };
    }>;
}
