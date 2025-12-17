import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './services/notifications.service';
import { AdminNotificationsController } from './controllers/admin/admin-notifications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [NotificationsService],
  controllers: [AdminNotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}





