import { Repository } from 'typeorm';
import { UsageTracking } from '../entities/usage-tracking.entity';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
export declare class UsageTrackingService {
    private usageTrackingRepository;
    private subscriptionRepository;
    private subscriptionsService;
    constructor(usageTrackingRepository: Repository<UsageTracking>, subscriptionRepository: Repository<Subscription>, subscriptionsService: SubscriptionsService);
    trackUsage(userId: number, moduleSlug: string, actionType: string, increment?: number): Promise<UsageTracking>;
    canPerformAction(userId: number, moduleSlug: string, actionType: string): Promise<{
        allowed: boolean;
        usage?: UsageTracking;
        limit?: number;
    }>;
    getUserUsageLimits(userId: number): Promise<Record<string, any>>;
}
