import { MemberResolver } from '../member.resolver';

const mockMemberService = () => ({
  members: jest.fn(),
  changeMemberRole: jest.fn(),
  removeMember: jest.fn(),
  assignWidgets: jest.fn(),
  findByUserAndBusiness: jest.fn(),
});

const mockInvitationService = () => ({
  invite: jest.fn(),
  cancelInvitation: jest.fn(),
  acceptInvitation: jest.fn(),
  declineInvitation: jest.fn(),
  pendingInvitations: jest.fn(),
});

function makeResolver() {
  const ms = mockMemberService() as any;
  const is = mockInvitationService() as any;
  return { resolver: new MemberResolver(ms, is), ms, is };
}

const BID = 'biz-1';
const USER = { sub: 'user-1', email: 'u@test.com' };

describe('MemberResolver', () => {
  it('members() delegates to memberService.members', async () => {
    const { resolver, ms } = makeResolver();
    ms.members.mockResolvedValue([{ id: 'm1' }]);
    const result = await resolver.members(BID, 'active');
    expect(ms.members).toHaveBeenCalledWith(BID, 'active');
    expect(result).toHaveLength(1);
  });

  it('pendingInvitations() delegates to invitationService.pendingInvitations', async () => {
    const { resolver, is } = makeResolver();
    is.pendingInvitations.mockResolvedValue([{ id: 'inv-1' }]);
    const result = await resolver.pendingInvitations(BID);
    expect(is.pendingInvitations).toHaveBeenCalledWith(BID);
    expect(result).toHaveLength(1);
  });

  it('inviteMember() delegates to invitationService.invite', async () => {
    const { resolver, is } = makeResolver();
    const dto = { email: 'a@b.com', role: 'staff' as const };
    is.invite.mockResolvedValue({ id: 'inv-2' });
    const result = await resolver.inviteMember(BID, dto, USER as any);
    expect(is.invite).toHaveBeenCalledWith(BID, USER.sub, dto);
    expect(result).toEqual({ id: 'inv-2' });
  });

  it('cancelInvitation() delegates to invitationService.cancelInvitation', async () => {
    const { resolver, is } = makeResolver();
    is.cancelInvitation.mockResolvedValue(true);
    const result = await resolver.cancelInvitation(BID, 'inv-1', USER as any);
    expect(is.cancelInvitation).toHaveBeenCalledWith(BID, 'inv-1', USER.sub);
    expect(result).toBe(true);
  });

  it('acceptInvitation() delegates to invitationService.acceptInvitation', async () => {
    const { resolver, is } = makeResolver();
    is.acceptInvitation.mockResolvedValue({ id: 'm1', status: 'active' });
    const result = await resolver.acceptInvitation('token-abc', USER as any);
    expect(is.acceptInvitation).toHaveBeenCalledWith('token-abc', USER.sub);
    expect(result).toEqual({ id: 'm1', status: 'active' });
  });

  it('declineInvitation() delegates to invitationService.declineInvitation', async () => {
    const { resolver, is } = makeResolver();
    is.declineInvitation.mockResolvedValue(true);
    const result = await resolver.declineInvitation('token-abc', USER as any);
    expect(is.declineInvitation).toHaveBeenCalledWith('token-abc', USER.sub);
    expect(result).toBe(true);
  });

  it('changeMemberRole() delegates to memberService.changeMemberRole', async () => {
    const { resolver, ms } = makeResolver();
    ms.changeMemberRole.mockResolvedValue({ id: 'm1', role: 'staff' });
    const dto = { role: 'staff' as const };
    const result = await resolver.changeMemberRole(BID, 'target-1', dto, USER as any);
    expect(ms.changeMemberRole).toHaveBeenCalledWith(BID, USER.sub, 'target-1', 'staff');
    expect(result).toEqual({ id: 'm1', role: 'staff' });
  });

  it('removeMember() delegates to memberService.removeMember', async () => {
    const { resolver, ms } = makeResolver();
    ms.removeMember.mockResolvedValue(true);
    const result = await resolver.removeMember(BID, 'target-1', USER as any);
    expect(ms.removeMember).toHaveBeenCalledWith(BID, USER.sub, 'target-1');
    expect(result).toBe(true);
  });

  it('assignWidgets() delegates to memberService.assignWidgets', async () => {
    const { resolver, ms } = makeResolver();
    ms.assignWidgets.mockResolvedValue({ id: 'm1', assignedWidgetIds: ['w1'] });
    const dto = { widgetIds: ['w1'] };
    const result = await resolver.assignWidgets(BID, 'target-1', dto as any, USER as any);
    expect(ms.assignWidgets).toHaveBeenCalledWith(BID, USER.sub, 'target-1', ['w1']);
    expect(result).toEqual({ id: 'm1', assignedWidgetIds: ['w1'] });
  });

  it('myMembership() returns current user membership when found', async () => {
    const { resolver, ms } = makeResolver();
    ms.findByUserAndBusiness.mockResolvedValue({
      id: 'm1',
      userId: 'user-1',
      businessId: BID,
      role: 'manager',
      status: 'active',
    });

    const result = await resolver.myMembership(BID, USER as any);

    expect(ms.findByUserAndBusiness).toHaveBeenCalledWith('user-1', BID);
    expect(result).toEqual({
      id: 'm1',
      userId: 'user-1',
      businessId: BID,
      role: 'manager',
      status: 'active',
    });
  });

  it('myMembership() returns null when user is not a member', async () => {
    const { resolver, ms } = makeResolver();
    ms.findByUserAndBusiness.mockResolvedValue(null);

    const result = await resolver.myMembership(BID, USER as any);

    expect(ms.findByUserAndBusiness).toHaveBeenCalledWith('user-1', BID);
    expect(result).toBeNull();
  });
});
