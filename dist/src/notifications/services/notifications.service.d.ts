import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
export declare class NotificationsService {
    private notificationRepository;
    constructor(notificationRepository: Repository<Notification>);
    getAdminNotifications(limit?: number, userId?: number): Promise<{
        notifications: {
            id: number;
            user_id: number;
            title: string;
            message: string;
            type: string;
            action_url: string;
            read: boolean;
            created_at: Date;
            relative_time: string;
        }[];
        unread_count: number;
    }>;
    markAsRead(notificationIds: number[]): Promise<{
        success: boolean;
        message: string;
    }>;
    private getRelativeTime;
}
