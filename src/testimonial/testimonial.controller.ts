import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TestimonialService } from './testimonial.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Testimonials')
@Controller()
export class TestimonialController {
  constructor(private readonly testimonialService: TestimonialService) {}

  // Public - get featured testimonials for homepage
  @Get('home/testimonials')
  @ApiOperation({ summary: 'Get featured testimonials (Public)' })
  @ApiResponse({ status: 200, description: 'List of featured testimonials' })
  async getFeatured() {
    const testimonials = await this.testimonialService.findFeatured();
    return { success: true, data: testimonials };
  }

  // Public - get all testimonials with optional category filter
  @Get('home/testimonials/all')
  @ApiOperation({ summary: 'Get all testimonials (Public)' })
  @ApiResponse({ status: 200, description: 'List of testimonials' })
  async getAll(@Query('category') category?: string) {
    const testimonials = await this.testimonialService.findAll(category);
    return { success: true, data: testimonials };
  }

  // Admin - list all (including not featured / disabled)
  @Get('admin/testimonials')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List testimonials for admin' })
  @ApiResponse({ status: 200, description: 'List of testimonials' })
  async adminList() {
    const testimonials = await this.testimonialService.findAllForAdmin();
    return { success: true, data: testimonials };
  }

  // Admin - create testimonial
  @Post('admin/testimonials')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a testimonial (Admin)' })
  @ApiResponse({ status: 201, description: 'Testimonial created' })
  async create(@Body() dto: CreateTestimonialDto) {
    const testimonial = await this.testimonialService.create(dto);
    return { success: true, data: testimonial };
  }

  @Patch('admin/testimonials/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a testimonial (Admin)' })
  @ApiResponse({ status: 200, description: 'Testimonial updated' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTestimonialDto) {
    const testimonial = await this.testimonialService.update(id, dto);
    return { success: true, data: testimonial };
  }

  @Delete('admin/testimonials/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a testimonial (Admin)' })
  @ApiResponse({ status: 200, description: 'Testimonial deleted' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.testimonialService.softDelete(id);
    return { success: true, data: { id } };
  }
}
