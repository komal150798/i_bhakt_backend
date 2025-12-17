import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChallengesService } from '../challenges.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Challenges (App)')
@Controller('app/challenges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  /**
   * GET /api/v1/app/challenges
   * Get all available challenges
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all available challenges (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Challenges retrieved successfully',
  })
  async getChallenges(@CurrentUser() user: any) {
    const challenges = await this.challengesService.getAvailableChallenges();
    const userChallenges = await this.challengesService.getUserChallenges(user.id);

    return {
      success: true,
      data: {
        available: challenges.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          challenge_type: c.challenge_type,
          duration_days: c.duration_days,
          daily_tasks: c.daily_tasks,
        })),
        user_challenges: userChallenges.map((uc) => ({
          id: uc.id,
          challenge_id: uc.challenge_id,
          challenge_title: uc.challenge.title,
          start_date: uc.start_date,
          end_date: uc.end_date,
          status: uc.status,
          current_day: uc.current_day,
          completed_days: uc.completed_days || [],
        })),
      },
    };
  }

  /**
   * GET /api/v1/app/challenges/:id
   * Get a challenge by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get challenge by ID (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Challenge retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async getChallenge(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const challenge = await this.challengesService.getChallengeById(id);
    
    // Try to get user's progress if they have this challenge
    let userChallenge = null;
    try {
      userChallenge = await this.challengesService.getUserChallenge(user.id, id);
    } catch (e) {
      // User doesn't have this challenge yet
    }

    return {
      success: true,
      data: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        challenge_type: challenge.challenge_type,
        duration_days: challenge.duration_days,
        daily_tasks: challenge.daily_tasks,
        user_progress: userChallenge
          ? {
              status: userChallenge.status,
              current_day: userChallenge.current_day,
              completed_days: userChallenge.completed_days || [],
              start_date: userChallenge.start_date,
              end_date: userChallenge.end_date,
            }
          : null,
      },
    };
  }

  /**
   * POST /api/v1/app/challenges/:id/start
   * Start a challenge
   */
  @Post(':id/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a challenge (Mobile App)' })
  @ApiResponse({
    status: 201,
    description: 'Challenge started successfully',
  })
  async startChallenge(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const userChallenge = await this.challengesService.startChallenge(user.id, id);

    return {
      success: true,
      data: {
        id: userChallenge.id,
        challenge_id: userChallenge.challenge_id,
        start_date: userChallenge.start_date,
        end_date: userChallenge.end_date,
        status: userChallenge.status,
        current_day: userChallenge.current_day,
      },
    };
  }

  /**
   * POST /api/v1/app/challenges/day-complete
   * Mark a day as complete
   */
  @Post('day-complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark challenge day as complete (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Day marked as complete',
  })
  async markDayComplete(
    @Body() body: { challenge_id: number; day: number },
    @CurrentUser() user: any,
  ) {
    const userChallenge = await this.challengesService.markDayComplete(
      user.id,
      body.challenge_id,
      body.day,
    );

    return {
      success: true,
      data: {
        challenge_id: userChallenge.challenge_id,
        current_day: userChallenge.current_day,
        completed_days: userChallenge.completed_days || [],
        status: userChallenge.status,
        is_completed: userChallenge.status === 'completed',
      },
    };
  }
}



