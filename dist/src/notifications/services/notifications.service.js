"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("../entities/notification.entity");
let NotificationsService = class NotificationsService {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async getAdminNotifications(limit = 10, userId) {
        const queryBuilder = this.notificationRepository
            .createQueryBuilder('notification')
            .leftJoinAndSelect('notification.customer', 'customer')
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
    async markAsRead(notificationIds) {
        if (notificationIds.length === 0) {
            return { success: true, message: 'No notifications to mark as read' };
        }
        await this.notificationRepository.update({ id: (0, typeorm_2.In)(notificationIds), is_deleted: false }, { is_read: true, read_at: new Date() });
        return { success: true, message: 'Notifications marked as read' };
    }
    getRelativeTime(date) {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0)
            return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0)
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0)
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map