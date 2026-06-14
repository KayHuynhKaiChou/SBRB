import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { IJwtPayload } from '../auth/jwt.strategy';
import { NotificationService } from './notification.service';
import { NotificationType } from './dto/notification.type';
import { Notification } from './entities/notification.entity';

function toType(n: Notification): NotificationType {
  return {
    id: n.id,
    businessId: n.businessId,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    metadata: n.metadata ?? null,
    createdAt: n.createdAt,
  };
}

/** Bell notifications — each user only sees their own. */
@Resolver(() => NotificationType)
@UseGuards(JwtAuthGuard)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @Query(() => [NotificationType], { name: 'myNotifications' })
  async myNotifications(
    @CurrentUser() user: IJwtPayload,
    @Args('unreadOnly', { type: () => Boolean, nullable: true }) unreadOnly?: boolean,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<NotificationType[]> {
    const rows = await this.notificationService.list(user.sub, { unreadOnly, limit });
    return rows.map(toType);
  }

  @Query(() => Int, { name: 'myUnreadCount' })
  async myUnreadCount(@CurrentUser() user: IJwtPayload): Promise<number> {
    return this.notificationService.unreadCount(user.sub);
  }

  @Mutation(() => Boolean)
  async markNotificationRead(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<boolean> {
    return this.notificationService.markRead(id, user.sub);
  }

  @Mutation(() => Boolean)
  async markAllNotificationsRead(@CurrentUser() user: IJwtPayload): Promise<boolean> {
    return this.notificationService.markAllRead(user.sub);
  }
}
