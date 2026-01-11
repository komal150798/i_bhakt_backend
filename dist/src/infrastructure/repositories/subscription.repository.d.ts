import { Repository } from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { ISubscriptionRepository, CreateSubscriptionInput, UpdateSubscriptionInput } from '../../core/interfaces/repositories/subscription-repository.interface';
export declare class SubscriptionRepository implements ISubscriptionRepository {
    private readonly subscriptionRepository;
    constructor(subscriptionRepository: Repository<Subscription>);
    findById(id: number): Promise<Subscription | null>;
    findByUniqueId(uniqueId: string): Promise<Subscription | null>;
    findByUserId(userId: number, options?: {
        is_active?: boolean;
    }): Promise<Subscription[]>;
    findActiveByUserId(userId: number): Promise<Subscription | null>;
    findAll(options?: {
        is_active?: boolean;
    }): Promise<Subscription[]>;
    create(data: CreateSubscriptionInput): Promise<Subscription>;
    update(subscription: Subscription, data: UpdateSubscriptionInput): Promise<Subscription>;
    delete(subscription: Subscription): Promise<void>;
}
