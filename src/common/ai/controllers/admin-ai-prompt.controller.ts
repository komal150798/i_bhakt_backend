import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PromptService } from '../prompt.service';
import { CreateAIPromptDto } from '../dtos/create-ai-prompt.dto';
import { UpdateAIPromptDto } from '../dtos/update-ai-prompt.dto';
import { AIPrompt } from '../entities/ai-prompt.entity';

@ApiTags('Admin - AI Prompts')
@Controller('admin/ai-prompts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminAIPromptController {
  constructor(private readonly promptService: PromptService) {}

  /**
   * GET /admin/ai-prompts
   * List all prompts with optional filters
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all AI prompts (Admin only)' })
  @ApiResponse({ status: 200, description: 'Prompts retrieved successfully' })
  @ApiQuery({ name: 'scope', required: false, description: 'Filter by scope' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type' })
  @ApiQuery({ name: 'language', required: false, description: 'Filter by language' })
  @ApiQuery({ name: 'is_active', required: false, description: 'Filter by active status' })
  async listPrompts(
    @Query('scope') scope?: string,
    @Query('type') type?: string,
    @Query('language') language?: string,
    @Query('is_active') is_active?: string,
  ): Promise<{ success: boolean; data: AIPrompt[]; count: number }> {
    const isActiveBool = is_active === 'true' ? true : is_active === 'false' ? false : undefined;

    const prompts = await this.promptService.getAllPrompts({
      scope,
      type,
      language,
      is_active: isActiveBool,
    });

    return {
      success: true,
      data: prompts,
      count: prompts.length,
    };
  }

  /**
   * GET /admin/ai-prompts/:id
   * Get a single prompt by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI prompt by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Prompt retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  async getPrompt(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; data: AIPrompt }> {
    const prompt = await this.promptService.getPromptById(id);
    if (!prompt) {
      throw new Error(`Prompt not found: ${id}`);
    }

    return {
      success: true,
      data: prompt,
    };
  }

  /**
   * POST /admin/ai-prompts
   * Create a new prompt
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new AI prompt (Admin only)' })
  @ApiResponse({ status: 201, description: 'Prompt created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Prompt key already exists' })
  async createPrompt(
    @Body() createDto: CreateAIPromptDto,
    @CurrentUser() user: any,
  ): Promise<{ success: boolean; message: string; data: AIPrompt }> {
    // Check if key already exists
    try {
      await this.promptService.getPrompt(createDto.key);
      throw new Error(`Prompt with key '${createDto.key}' already exists`);
    } catch (error: any) {
      // If error is "not found", that's fine - we can create it
      if (!error.message.includes('not found')) {
        throw error;
      }
    }

    const prompt = await this.promptService.createPrompt({
      ...createDto,
      language: createDto.language || 'en',
      is_active: createDto.is_active !== undefined ? createDto.is_active : true,
      version: 1,
      updated_by: user.id,
    });

    return {
      success: true,
      message: 'Prompt created successfully',
      data: prompt,
    };
  }

  /**
   * PATCH /admin/ai-prompts/:id
   * Update an existing prompt
   * Automatically increments version and clears cache
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an AI prompt (Admin only)' })
  @ApiResponse({ status: 200, description: 'Prompt updated successfully' })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  async updatePrompt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateAIPromptDto,
    @CurrentUser() user: any,
  ): Promise<{ success: boolean; message: string; data: AIPrompt }> {
    const prompt = await this.promptService.updatePrompt(id, {
      ...updateDto,
      updated_by: user.id,
    });

    return {
      success: true,
      message: 'Prompt updated successfully. Cache cleared.',
      data: prompt,
    };
  }

  /**
   * DELETE /admin/ai-prompts/:id
   * Soft delete a prompt (sets is_active = false)
   * Clears cache automatically
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an AI prompt (Admin only)' })
  @ApiResponse({ status: 200, description: 'Prompt deleted successfully' })
  @ApiResponse({ status: 404, description: 'Prompt not found' })
  async deletePrompt(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.promptService.deletePrompt(id);

    return {
      success: true,
      message: 'Prompt deleted successfully. Cache cleared.',
    };
  }

  /**
   * POST /admin/ai-prompts/:id/clear-cache
   * Manually clear cache for a specific prompt
   */
  @Post(':id/clear-cache')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear cache for a specific prompt (Admin only)' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearCache(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    const prompt = await this.promptService.getPromptById(id);
    if (!prompt) {
      throw new Error(`Prompt not found: ${id}`);
    }

    await this.promptService.clearPromptCacheByKey(prompt.key);

    return {
      success: true,
      message: `Cache cleared for prompt: ${prompt.key}`,
    };
  }

  /**
   * POST /admin/ai-prompts/clear-all-cache
   * Clear all prompt caches
   */
  @Post('clear-all-cache')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all prompt caches (Admin only)' })
  @ApiResponse({ status: 200, description: 'All caches cleared successfully' })
  async clearAllCache(): Promise<{ success: boolean; message: string }> {
    await this.promptService.clearAllPromptCache();

    return {
      success: true,
      message: 'All prompt caches cleared successfully',
    };
  }
}
