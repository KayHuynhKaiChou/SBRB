import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { EBusinessRole, EUserAccountStatus } from '@sbrb/shared-constants';
import { AccountLifecycleService } from '../account-lifecycle.service';

type AnyRepo = {
  findOne: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  count: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

function repo(): AnyRepo {
  return {
    findOne: jest.fn(),
    save: jest.fn((x) => Promise.resolve({ id: 'generated-id', ...x })),
    create: jest.fn((x) => x),
    count: jest.fn().mockResolvedValue(0),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  };
}

function build() {
  const userRepo = repo();
  const memberRepo = repo();
  const invitationRepo = repo();
  const businessRepo = repo();
  const mailService = { sendAccountInvite: jest.fn().mockResolvedValue(undefined) };
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };
  const refreshTokenService = { revokeAllForUser: jest.fn().mockResolvedValue(undefined) };
  const redis = { increment: jest.fn().mockResolvedValue(1) };
  const config = { get: jest.fn().mockReturnValue('http://localhost:3000') };

  const service = new AccountLifecycleService(
    userRepo as never,
    memberRepo as never,
    invitationRepo as never,
    businessRepo as never,
    mailService as never,
    auditService as never,
    refreshTokenService as never,
    redis as never,
    config as never,
  );

  return { service, userRepo, memberRepo, invitationRepo, businessRepo, mailService, refreshTokenService, redis };
}

const inviter = (role: EBusinessRole) => ({ businessId: 'biz-1', userId: 'inviter-1', role });
const targetMember = (role: EBusinessRole, userId = 'target-1') => ({ businessId: 'biz-1', userId, role });

describe('AccountLifecycleService', () => {
  describe('createStaffAccount', () => {
    it('owner creates a manager account → pending user + invite email', async () => {
      const { service, userRepo, memberRepo, mailService, invitationRepo } = build();
      memberRepo.findOne.mockResolvedValue(inviter(EBusinessRole.OWNER));
      userRepo.findOne
        .mockResolvedValueOnce(null) // duplicate-email check
        .mockResolvedValueOnce({ id: 'inviter-1', fullName: 'Boss' }); // inviter for email
      businessFound(service);

      const row = await service.createStaffAccount('biz-1', 'inviter-1', {
        email: 'new@x.com',
        fullName: 'New Hire',
        role: EBusinessRole.MANAGER,
      });

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: EUserAccountStatus.PENDING, passwordHash: null }),
      );
      expect(invitationRepo.save).toHaveBeenCalled();
      expect(mailService.sendAccountInvite).toHaveBeenCalled();
      expect(row.status).toBe(EUserAccountStatus.PENDING);
    });

    it('manager cannot create a manager → Forbidden', async () => {
      const { service, memberRepo } = build();
      memberRepo.findOne.mockResolvedValue(inviter(EBusinessRole.MANAGER));
      await expect(
        service.createStaffAccount('biz-1', 'inviter-1', {
          email: 'x@x.com',
          fullName: 'X',
          role: EBusinessRole.MANAGER,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects duplicate email → Conflict', async () => {
      const { service, memberRepo, userRepo } = build();
      memberRepo.findOne.mockResolvedValue(inviter(EBusinessRole.OWNER));
      userRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(
        service.createStaffAccount('biz-1', 'inviter-1', {
          email: 'dupe@x.com',
          fullName: 'Dup',
          role: EBusinessRole.STAFF,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('setAccountPassword', () => {
    const validInvite = {
      token: 'tok',
      email: 'a@x.com',
      usedAt: null,
      expiresAt: new Date(Date.now() + 3600_000),
    };

    it('activates account on valid token + email', async () => {
      const { service, invitationRepo, userRepo } = build();
      invitationRepo.findOne.mockResolvedValue({ ...validInvite });
      userRepo.findOne.mockResolvedValue({ id: 'u1', email: 'a@x.com' });

      const ok = await service.setAccountPassword({ token: 'tok', email: 'a@x.com', password: 'Abcdef12' });

      expect(ok).toBe(true);
      expect(userRepo.update).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ status: EUserAccountStatus.ACTIVE, emailVerified: true }),
      );
      expect(invitationRepo.save).toHaveBeenCalledWith(expect.objectContaining({ usedAt: expect.any(Date) }));
    });

    it('rejects mismatched email', async () => {
      const { service, invitationRepo } = build();
      invitationRepo.findOne.mockResolvedValue({ ...validInvite, email: 'other@x.com' });
      await expect(
        service.setAccountPassword({ token: 'tok', email: 'a@x.com', password: 'Abcdef12' }),
      ).rejects.toThrow();
    });

    it('rejects expired invitation', async () => {
      const { service, invitationRepo } = build();
      invitationRepo.findOne.mockResolvedValue({ ...validInvite, expiresAt: new Date(Date.now() - 1000) });
      await expect(
        service.setAccountPassword({ token: 'tok', email: 'a@x.com', password: 'Abcdef12' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects already-used invitation', async () => {
      const { service, invitationRepo } = build();
      invitationRepo.findOne.mockResolvedValue({ ...validInvite, usedAt: new Date() });
      await expect(
        service.setAccountPassword({ token: 'tok', email: 'a@x.com', password: 'Abcdef12' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendAccountInvite', () => {
    it('resends for a pending account', async () => {
      const { service, memberRepo, userRepo, mailService } = build();
      memberRepo.findOne
        .mockResolvedValueOnce(targetMember(EBusinessRole.STAFF)) // assertCanManageTarget: target member
        .mockResolvedValueOnce(inviter(EBusinessRole.OWNER)) // assertCanManageRole: inviter
        .mockResolvedValueOnce(targetMember(EBusinessRole.STAFF)); // member for role in issueInvite
      userRepo.findOne
        .mockResolvedValueOnce({ id: 'target-1', email: 'p@x.com', status: EUserAccountStatus.PENDING }) // target user
        .mockResolvedValueOnce({ id: 'inviter-1', fullName: 'Boss' }); // inviter for email
      businessFound(service);

      const ok = await service.resendAccountInvite('biz-1', 'inviter-1', 'target-1');
      expect(ok).toBe(true);
      expect(mailService.sendAccountInvite).toHaveBeenCalled();
    });

    it('rejects resend for non-pending account', async () => {
      const { service, memberRepo, userRepo } = build();
      memberRepo.findOne
        .mockResolvedValueOnce(targetMember(EBusinessRole.STAFF))
        .mockResolvedValueOnce(inviter(EBusinessRole.OWNER));
      userRepo.findOne.mockResolvedValue({ id: 'target-1', email: 'a@x.com', status: EUserAccountStatus.ACTIVE });
      await expect(service.resendAccountInvite('biz-1', 'inviter-1', 'target-1')).rejects.toThrow(BadRequestException);
    });

    it('rate-limits excessive resends', async () => {
      const { service, memberRepo, userRepo, redis } = build();
      memberRepo.findOne
        .mockResolvedValueOnce(targetMember(EBusinessRole.STAFF))
        .mockResolvedValueOnce(inviter(EBusinessRole.OWNER));
      userRepo.findOne.mockResolvedValue({ id: 'target-1', email: 'a@x.com', status: EUserAccountStatus.PENDING });
      redis.increment.mockResolvedValue(99);
      await expect(service.resendAccountInvite('biz-1', 'inviter-1', 'target-1')).rejects.toThrow(HttpException);
    });
  });

  describe('deletePendingAccount', () => {
    it('deletes a pending account', async () => {
      const { service, memberRepo, userRepo } = build();
      memberRepo.findOne
        .mockResolvedValueOnce(targetMember(EBusinessRole.STAFF))
        .mockResolvedValueOnce(inviter(EBusinessRole.OWNER));
      userRepo.findOne.mockResolvedValue({ id: 'target-1', email: 'a@x.com', status: EUserAccountStatus.PENDING });

      const ok = await service.deletePendingAccount('biz-1', 'inviter-1', 'target-1');
      expect(ok).toBe(true);
      expect(userRepo.delete).toHaveBeenCalledWith('target-1');
    });

    it('refuses to delete an active account', async () => {
      const { service, memberRepo, userRepo } = build();
      memberRepo.findOne
        .mockResolvedValueOnce(targetMember(EBusinessRole.STAFF))
        .mockResolvedValueOnce(inviter(EBusinessRole.OWNER));
      userRepo.findOne.mockResolvedValue({ id: 'target-1', email: 'a@x.com', status: EUserAccountStatus.ACTIVE });
      await expect(service.deletePendingAccount('biz-1', 'inviter-1', 'target-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('setMemberAccountStatus', () => {
    it('cannot target yourself', async () => {
      const { service } = build();
      await expect(
        service.setMemberAccountStatus('biz-1', 'inviter-1', 'inviter-1', false),
      ).rejects.toThrow(BadRequestException);
    });

    it('cannot target the owner', async () => {
      const { service, memberRepo } = build();
      memberRepo.findOne.mockResolvedValueOnce(targetMember(EBusinessRole.OWNER));
      await expect(
        service.setMemberAccountStatus('biz-1', 'inviter-1', 'target-1', false),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects toggling a pending account', async () => {
      const { service, memberRepo, userRepo } = build();
      memberRepo.findOne
        .mockResolvedValueOnce(targetMember(EBusinessRole.STAFF))
        .mockResolvedValueOnce(inviter(EBusinessRole.OWNER));
      userRepo.findOne.mockResolvedValue({ id: 'target-1', email: 'a@x.com', status: EUserAccountStatus.PENDING });
      await expect(
        service.setMemberAccountStatus('biz-1', 'inviter-1', 'target-1', false),
      ).rejects.toThrow(BadRequestException);
    });

    it('deactivation sets inactive and revokes tokens', async () => {
      const { service, memberRepo, userRepo, refreshTokenService } = build();
      memberRepo.findOne
        .mockResolvedValueOnce(targetMember(EBusinessRole.STAFF))
        .mockResolvedValueOnce(inviter(EBusinessRole.OWNER));
      userRepo.findOne.mockResolvedValue({ id: 'target-1', email: 'a@x.com', status: EUserAccountStatus.ACTIVE });

      const row = await service.setMemberAccountStatus('biz-1', 'inviter-1', 'target-1', false);
      expect(userRepo.update).toHaveBeenCalledWith('target-1', expect.objectContaining({ status: EUserAccountStatus.INACTIVE }));
      expect(refreshTokenService.revokeAllForUser).toHaveBeenCalledWith('target-1');
      expect(row.status).toBe(EUserAccountStatus.INACTIVE);
    });

    it('reactivation sets active without revoking tokens', async () => {
      const { service, memberRepo, userRepo, refreshTokenService } = build();
      memberRepo.findOne
        .mockResolvedValueOnce(targetMember(EBusinessRole.STAFF))
        .mockResolvedValueOnce(inviter(EBusinessRole.OWNER));
      userRepo.findOne.mockResolvedValue({ id: 'target-1', email: 'a@x.com', status: EUserAccountStatus.INACTIVE });

      const row = await service.setMemberAccountStatus('biz-1', 'inviter-1', 'target-1', true);
      expect(userRepo.update).toHaveBeenCalledWith('target-1', expect.objectContaining({ status: EUserAccountStatus.ACTIVE }));
      expect(refreshTokenService.revokeAllForUser).not.toHaveBeenCalled();
      expect(row.status).toBe(EUserAccountStatus.ACTIVE);
    });
  });
});

/** Make businessRepo.findOne resolve to a business (for issueInvite email). */
function businessFound(service: AccountLifecycleService) {
  // @ts-expect-error reach into private repo for test stubbing
  service.businessRepo.findOne.mockResolvedValue({ id: 'biz-1', name: 'Biz One' });
}
