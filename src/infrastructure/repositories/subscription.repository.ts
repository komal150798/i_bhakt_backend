import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import {
  ISubscriptionRepository,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from '../../core/interfaces/repositories/subscription-repository.interface';

@Injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async findById(id: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { id },
      relations: ['user', 'plan'],
    });
  }

  async findByUniqueId(uniqueId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { unique_id: uniqueId },
      relations: ['user', 'plan'],
    });
  }

  async findByUserId(userId: number, options?: { is_active?: boolean }): Promise<Subscription[]> {
    const where: any = { user_id: userId, is_deleted: false };
    if (options?.is_active !== undefined) {
      where.is_active = options.is_active;
    }
    return this.subscriptionRepository.find({
      where,
      relations: ['plan'],
      order: { added_date: 'DESC' },
    });
  }

  async findActiveByUserId(userId: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: {
        user_id: userId,
        is_active: true,
        is_deleted: false,
      },
      relations: ['plan'],
      order: { added_date: 'DESC' },
    });
  }

  async findAll(options?: { is_active?: boolean }): Promise<Subscription[]> {
    const where: any = { is_deleted: false };
    if (options?.is_active !== undefined) {
      where.is_active = options.is_active;
    }
    return this.subscriptionRepository.find({ where, relations: ['user', 'plan'] });
  }

  async create(data: CreateSubscriptionInput): Promise<Subscription> {
    const subscription = this.subscriptionRepository.create(data);
    return this.subscriptionRepository.save(subscription);
  }

  async update(subscription: Subscription, data: UpdateSubscriptionInput): Promise<Subscription> {
    Object.assign(subscription, data);
    return this.subscriptionRepository.save(subscription);
  }

  async delete(subscription: Subscription): Promise<void> {
    subscription.is_deleted = true;
    await this.subscriptionRepository.save(subscription);
  }
}

