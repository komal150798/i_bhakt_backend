import { NotificationsService } from '../../services/notifications.service';
export declare class AdminNotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(user: any, limit?: string, userId?: string): Promise<{
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
    markNotificationsRead(body: {
        notification_ids: number[];
    }, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
