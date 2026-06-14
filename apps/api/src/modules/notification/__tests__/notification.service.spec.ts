import { NotificationService } from '../notification.service';
import { EPlatformRole } from '@sbrb/shared-constants';
import type { INotificationPayload } from '../notification.events';

const payload: INotificationPayload = {
  type: 'business.approved',
  title: 'T',
  message: 'M',
  businessId: 'biz-1',
  metadata: { route: '/my-business' },
};

function buildService() {
  const notificationRepo = {
    create: jest.fn((x) => x),
    save: jest.fn((x) => Promise.resolve(x)),
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const userRepo = { find: jest.fn().mockResolvedValue([]) };
  const service = new NotificationService(notificationRepo as never, userRepo as never);
  return { service, notificationRepo, userRepo };
}

describe('NotificationService', () => {
  it('notifyUser saves a row for the user', async () => {
    const { service, notificationRepo } = buildService();
    await service.notifyUser('user-1', payload);
    expect(notificationRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', type: 'business.approved' }),
    );
  });

  it('notifyAdmins fans out to every platform admin', async () => {
    const { service, notificationRepo, userRepo } = buildService();
    userRepo.find.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);
    await service.notifyAdmins(payload);
    expect(userRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { platformRole: EPlatformRole.ADMIN } }),
    );
    const saved = notificationRepo.save.mock.calls[0][0];
    expect(saved).toHaveLength(2);
  });

  it('notifyAdmins is a no-op when there are no admins', async () => {
    const { service, notificationRepo, userRepo } = buildService();
    userRepo.find.mockResolvedValue([]);
    await service.notifyAdmins(payload);
    expect(notificationRepo.save).not.toHaveBeenCalled();
  });

  it('markRead scopes the update to the owner', async () => {
    const { service, notificationRepo } = buildService();
    const ok = await service.markRead('n-1', 'user-1');
    expect(notificationRepo.update).toHaveBeenCalledWith(
      { id: 'n-1', userId: 'user-1' },
      { isRead: true },
    );
    expect(ok).toBe(true);
  });

  it('unreadCount counts only unread for the user', async () => {
    const { service, notificationRepo } = buildService();
    await service.unreadCount('user-1');
    expect(notificationRepo.count).toHaveBeenCalledWith({
      where: { userId: 'user-1', isRead: false },
    });
  });
});
