import { Module } from '@nestjs/common';

/**
 * Notification module — SRS 4.9
 * Handles: bell icon notifications (invite, import done, alert threshold),
 * mark read, delete
 * GraphQL: subscription for realtime new notification
 */
@Module({
  imports: [],
  // providers: [NotificationService, NotificationResolver],
  // exports: [NotificationService],
})
export class NotificationModule {}
