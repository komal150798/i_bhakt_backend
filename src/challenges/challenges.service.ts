import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { UserChallenge } from './entities/user-challenge.entity';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
    @InjectRepository(UserChallenge)
    private userChallengeRepository: Repository<UserChallenge>,
  ) {}

  /**
   * Get a challenge by ID
   */
  async getChallengeById(challengeId: number): Promise<Challenge> {
    const challenge = await this.challengeRepository.findOne({
      where: {
        id: challengeId,
        is_active: true,
        is_deleted: false,
      },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return challenge;
  }

  /**
   * Get user's active challenge
   */
  async getUserChallenge(
    userId: number,
    challengeId: number,
  ): Promise<UserChallenge> {
    const userChallenge = await this.userChallengeRepository.findOne({
      where: {
        user_id: userId,
        challenge_id: challengeId,
        is_deleted: false,
      },
      relations: ['challenge'],
    });

    if (!userChallenge) {
      throw new NotFoundException('User challenge not found');
    }

    return userChallenge;
  }

  /**
   * Start a challenge for a user
   */
  async startChallenge(userId: number, challengeId: number): Promise<UserChallenge> {
    const challenge = await this.getChallengeById(challengeId);

    // Check if user already has an active challenge of this type
    const existingChallenge = await this.userChallengeRepository.findOne({
      where: {
        user_id: userId,
        challenge_id: challengeId,
        status: 'active',
        is_deleted: false,
      },
    });

    if (existingChallenge) {
      throw new BadRequestException('You already have an active challenge of this type');
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + challenge.duration_days);

    const userChallenge = this.userChallengeRepository.create({
      user_id: userId,
      challenge_id: challengeId,
      start_date: startDate,
      end_date: endDate,
      status: 'active',
      current_day: 1,
      completed_days: [],
    });

    return await this.userChallengeRepository.save(userChallenge);
  }

  /**
   * Mark a day as complete
   */
  async markDayComplete(
    userId: number,
    challengeId: number,
    day: number,
  ): Promise<UserChallenge> {
    const userChallenge = await this.getUserChallenge(userId, challengeId);

    if (userChallenge.status !== 'active') {
      throw new BadRequestException('Challenge is not active');
    }

    if (day < 1 || day > userChallenge.challenge.duration_days) {
      throw new BadRequestException(`Day must be between 1 and ${userChallenge.challenge.duration_days}`);
    }

    // Add day to completed days if not already completed
    const completedDays = userChallenge.completed_days || [];
    if (!completedDays.includes(day)) {
      completedDays.push(day);
      userChallenge.completed_days = completedDays.sort((a, b) => a - b);
    }

    // Update current day
    userChallenge.current_day = Math.max(userChallenge.current_day, day + 1);

    // Check if challenge is completed
    if (completedDays.length === userChallenge.challenge.duration_days) {
      userChallenge.status = 'completed';
    }

    return await this.userChallengeRepository.save(userChallenge);
  }

  /**
   * Get all available challenges
   */
  async getAvailableChallenges(): Promise<Challenge[]> {
    return this.challengeRepository.find({
      where: {
        is_active: true,
        is_deleted: false,
      },
      order: {
        duration_days: 'ASC',
      },
    });
  }

  /**
   * Get user's challenges
   */
  async getUserChallenges(userId: number): Promise<UserChallenge[]> {
    return this.userChallengeRepository.find({
      where: {
        user_id: userId,
        is_deleted: false,
      },
      relations: ['challenge'],
      order: {
        added_date: 'DESC',
      },
    });
  }
}

