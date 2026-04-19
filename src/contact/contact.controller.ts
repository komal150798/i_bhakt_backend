import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Contact')
@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // Public endpoint - no auth required
  @Post('home/contact')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a contact inquiry (Public)' })
  @ApiResponse({ status: 201, description: 'Inquiry submitted successfully' })
  async submitInquiry(@Body() dto: CreateContactDto) {
    const inquiry = await this.contactService.create(dto);
    return {
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon.',
      data: { id: inquiry.unique_id },
    };
  }

  // Admin endpoint - list all inquiries
  @Get('admin/contact/inquiries')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all contact inquiries (Admin)' })
  @ApiResponse({ status: 200, description: 'List of contact inquiries' })
  async listInquiries() {
    const inquiries = await this.contactService.findAll();
    return { success: true, data: inquiries };
  }
}
