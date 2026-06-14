import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EPlatformRole } from '@sbrb/shared-constants';
import { User } from '../auth/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { INotificationPayload } from './notification.events';

interface IListOptions {
  unreadOnly?: boolean;
  limit?: number;
}

/** Creates + reads in-app (bell) notifications. Non-realtime; FE polls. */
@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /** Create one notification for a single user. */
  async notifyUser(userId: string, payload: INotificationPayload): Promise<void> {
    const row = this.notificationRepo.create({
      userId,
      businessId: payload.businessId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata,
    });
    await this.notificationRepo.save(row);
  }

  /** Fan-out a notification to every platform admin. */
  async notifyAdmins(payload: INotificationPayload): Promise<void> {
    const admins = await this.userRepo.find({
      where: { platformRole: EPlatformRole.ADMIN },
      select: ['id'],
    });
    if (!admins.length) return;
    const rows = admins.map((a) =>
      this.notificationRepo.create({
        userId: a.id,
        businessId: payload.businessId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata,
      }),
    );
    await this.notificationRepo.save(rows);
  }

  async list(userId: string, opts: IListOptions = {}): Promise<Notification[]> {
    const limit = Math.min(opts.limit ?? 30, 100);
    return this.notificationRepo.find({
      where: { userId, ...(opts.unreadOnly ? { isRead: false } : {}) },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({ where: { userId, isRead: false } });
  }

  /** Mark one notification read (scoped to its owner). Returns true if updated. */
  async markRead(id: string, userId: string): Promise<boolean> {
    const res = await this.notificationRepo.update({ id, userId }, { isRead: true });
    return (res.affected ?? 0) > 0;
  }

  async markAllRead(userId: string): Promise<boolean> {
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
    return true;
  }
}
