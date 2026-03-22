import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';

/**
 * Notification module — SRS 4.9
 * Handles: bell icon notifications (invite, import done, alert threshold),
 * mark read, delete
 * GraphQL: subscription for realtime new notification
 */
@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  // providers: [NotificationService, NotificationResolver],
  // exports: [NotificationService],
})
export class NotificationModule {}
