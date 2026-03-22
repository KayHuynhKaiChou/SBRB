import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MemberService } from '../member.service';
import { InvitationService } from '../invitation.service';

// ---- Shared mock factories ----
const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
});

const mockAudit = () => ({ log: jest.fn() });
const mockMail = () => ({ sendBusinessInvite: jest.fn() });

const BID = 'biz-1';
const ADMIN = 'admin-1';
const TARGET = 'target-1';

// ---- MemberService ----
function makeMemberService() {
  const memberRepo = mockRepo() as any;
  const audit = mockAudit() as any;
  return { service: new MemberService(memberRepo, audit), memberRepo, audit };
}

describe('MemberService', () => {
  describe('changeMemberRole', () => {
    it('owner changes staff role successfully', async () => {
      const { service, memberRepo, audit } = makeMemberService();
      memberRepo.findOne
        .mockResolvedValueOnce({ role: 'owner' })
        .mockResolvedValueOnce({ id: 'm2', role: 'staff' });
      memberRepo.save.mockResolvedValue({ id: 'm2', role: 'viewer' });

      const result = await service.changeMemberRole(BID, ADMIN, TARGET, 'viewer');
      expect(result.role).toBe('viewer');
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'change_member_role' }));
    });

    it('throws ForbiddenException when non-owner tries to change role', async () => {
      const { service, memberRepo } = makeMemberService();
      memberRepo.findOne.mockResolvedValueOnce({ role: 'manager' });
      await expect(service.changeMemberRole(BID, ADMIN, TARGET, 'viewer')).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when attempting to change owner role', async () => {
      const { service, memberRepo } = makeMemberService();
      memberRepo.findOne
        .mockResolvedValueOnce({ role: 'owner' })
        .mockResolvedValueOnce({ id: 'm2', role: 'owner' });
      await expect(service.changeMemberRole(BID, ADMIN, TARGET, 'manager')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException if target member not found', async () => {
      const { service, memberRepo } = makeMemberService();
      memberRepo.findOne
        .mockResolvedValueOnce({ role: 'owner' })
        .mockResolvedValueOnce(null);
      await expect(service.changeMemberRole(BID, ADMIN, TARGET, 'staff')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeMember', () => {
    it('owner removes staff successfully', async () => {
      const { service, memberRepo, audit } = makeMemberService();
      memberRepo.findOne
        .mockResolvedValueOnce({ role: 'owner' })
        .mockResolvedValueOnce({ id: 'm2', role: 'staff' });
      memberRepo.delete.mockResolvedValue({});

      const result = await service.removeMember(BID, ADMIN, TARGET);
      expect(result).toBe(true);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'remove_member' }));
    });

    it('manager removes staff successfully', async () => {
      const { service, memberRepo } = makeMemberService();
      memberRepo.findOne
        .mockResolvedValueOnce({ role: 'manager' })
        .mockResolvedValueOnce({ id: 'm2', role: 'staff' });
      memberRepo.delete.mockResolvedValue({});
      expect(await service.removeMember(BID, ADMIN, TARGET)).toBe(true);
    });

    it('throws ForbiddenException when manager tries to remove manager', async () => {
      const { service, memberRepo } = makeMemberService();
      memberRepo.findOne
        .mockResolvedValueOnce({ role: 'manager' })
        .mockResolvedValueOnce({ id: 'm2', role: 'manager' });
      await expect(service.removeMember(BID, ADMIN, TARGET)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when removing owner', async () => {
      const { service, memberRepo } = makeMemberService();
      memberRepo.findOne
        .mockResolvedValueOnce({ role: 'owner' })
        .mockResolvedValueOnce({ id: 'm2', role: 'owner' });
      await expect(service.removeMember(BID, ADMIN, TARGET)).rejects.toThrow(BadRequestException);
    });
  });

  describe('assignWidgets', () => {
    it('assigns widgets to staff', async () => {
      const { service, memberRepo } = makeMemberService();
      const member = { id: 'm2', role: 'staff', assignedWidgetIds: [] };
      memberRepo.findOne
        .mockResolvedValueOnce({ role: 'manager' })
        .mockResolvedValueOnce(member);
      memberRepo.save.mockImplementation((m: any) => Promise.resolve(m));

      const result = await service.assignWidgets(BID, ADMIN, TARGET, ['w1', 'w2']);
      expect(result.assignedWidgetIds).toEqual(['w1', 'w2']);
    });

    it('throws BadRequestException if target is not staff', async () => {
      const { service, memberRepo } = makeMemberService();
      memberRepo.findOne
        .mockResolvedValueOnce({ role: 'manager' })
        .mockResolvedValueOnce({ id: 'm2', role: 'viewer' });
      await expect(service.assignWidgets(BID, ADMIN, TARGET, [])).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException for viewer trying to assign', async () => {
      const { service, memberRepo } = makeMemberService();
      memberRepo.findOne.mockResolvedValueOnce({ role: 'viewer' });
      await expect(service.assignWidgets(BID, ADMIN, TARGET, [])).rejects.toThrow(ForbiddenException);
    });
  });
});

// ---- InvitationService ----
function makeInvitationService() {
  const invitationRepo = mockRepo() as any;
  const memberRepo = mockRepo() as any;
  const userRepo = mockRepo() as any;
  const mail = mockMail() as any;
  const audit = mockAudit() as any;
  const service = new InvitationService(invitationRepo, memberRepo, userRepo, mail, audit);
  return { service, invitationRepo, memberRepo, userRepo, mail, audit };
}

describe('InvitationService', () => {
  describe('invite', () => {
    it('owner invites manager successfully', async () => {
      const { service, invitationRepo, memberRepo, userRepo, mail, audit } = makeInvitationService();
      memberRepo.findOne.mockResolvedValueOnce({ role: 'owner' });
      memberRepo.count.mockResolvedValue(5);
      userRepo.findOne.mockResolvedValue(null);
      const saved = { id: 'inv-1', token: 'ABC-uuid' };
      invitationRepo.create.mockReturnValue(saved);
      invitationRepo.save.mockResolvedValue(saved);

      const result = await service.invite(BID, ADMIN, { email: 'a@b.com', role: 'manager' });
      expect(result.id).toBe('inv-1');
      expect(mail.sendBusinessInvite).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'invite_member' }));
    });

    it('throws ForbiddenException when manager tries to invite manager', async () => {
      const { service, memberRepo } = makeInvitationService();
      memberRepo.findOne.mockResolvedValueOnce({ role: 'manager' });
      memberRepo.count.mockResolvedValue(5);
      await expect(
        service.invite(BID, ADMIN, { email: 'x@y.com', role: 'manager' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when member count >= 50', async () => {
      const { service, memberRepo } = makeInvitationService();
      memberRepo.findOne.mockResolvedValueOnce({ role: 'owner' });
      memberRepo.count.mockResolvedValue(50);
      await expect(
        service.invite(BID, ADMIN, { email: 'x@y.com', role: 'staff' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptInvitation', () => {
    it('accepts a valid invitation', async () => {
      const { service, invitationRepo, memberRepo, audit } = makeInvitationService();
      const invitation = { id: 'inv-1', businessId: BID, expiresAt: new Date(Date.now() + 10000), usedAt: null };
      invitationRepo.findOne.mockResolvedValue(invitation);
      const member = { id: 'm1', status: 'invited' };
      memberRepo.findOne.mockResolvedValue(member);
      memberRepo.save.mockResolvedValue({ ...member, status: 'active' });
      invitationRepo.save.mockResolvedValue({ ...invitation, usedAt: new Date() });

      const result = await service.acceptInvitation('valid-token', TARGET);
      expect(result.status).toBe('active');
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'accept_invite' }));
    });

    it('throws NotFoundException if invitation not found', async () => {
      const { service, invitationRepo } = makeInvitationService();
      invitationRepo.findOne.mockResolvedValue(null);
      await expect(service.acceptInvitation('bad-token', TARGET)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if invitation expired', async () => {
      const { service, invitationRepo } = makeInvitationService();
      invitationRepo.findOne.mockResolvedValue({
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
      });
      await expect(service.acceptInvitation('token', TARGET)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if invitation already used', async () => {
      const { service, invitationRepo } = makeInvitationService();
      invitationRepo.findOne.mockResolvedValue({
        expiresAt: new Date(Date.now() + 10000),
        usedAt: new Date(),
      });
      await expect(service.acceptInvitation('token', TARGET)).rejects.toThrow(BadRequestException);
    });
  });
});
