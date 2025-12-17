import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Get notifications for admin (all notifications or filtered)
   */
  async getAdminNotifications(limit: number = 10, userId?: number) {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.user', 'user')
      .where('notification.is_deleted = :isDeleted', { isDeleted: false })
      .orderBy('notification.added_date', 'DESC')
      .limit(limit);

    if (userId) {
      queryBuilder.andWhere('notification.user_id = :userId', { userId });
    }

    const notifications = await queryBuilder.getMany();
    const unreadCount = await this.notificationRepository.count({
      where: { is_read: false, is_deleted: false },
    });

    return {
      notifications: notifications.map(notif => ({
        id: notif.id,
        user_id: notif.user_id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        action_url: notif.action_url,
        read: notif.is_read,
        created_at: notif.added_date,
        relative_time: this.getRelativeTime(notif.added_date),
      })),
      unread_count: unreadCount,
    };
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: number[]) {
    if (notificationIds.length === 0) {
      return { success: true, message: 'No notifications to mark as read' };
    }

    await this.notificationRepository.update(
      { id: In(notificationIds), is_deleted: false },
      { is_read: true, read_at: new Date() },
    );

    return { success: true, message: 'Notifications marked as read' };
  }

  /**
   * Get relative time string (e.g., "2 hours ago")
   */
  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }
}
