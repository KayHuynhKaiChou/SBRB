import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../auth/entities/user.entity';
import { NotificationService } from './notification.service';
import { NotificationResolver } from './notification.resolver';

/**
 * Notification module — bell notifications (business approval/change events).
 * In-app, non-realtime: the FE polls myNotifications / myUnreadCount.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Notification, User])],
  providers: [NotificationService, NotificationResolver],
  exports: [NotificationService],
})
export class NotificationModule {}
