import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt.strategy';
import { InvitationService } from './invitation.service';
import { MemberService } from './member.service';
import { AssignWidgetsDto } from './dto/assign-widgets.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { InvitationType, MemberType } from './dto/member.type';

/** GraphQL resolver for Member management — SRS 4.2.2 */
@Resolver(() => MemberType)
@UseGuards(JwtAuthGuard)
export class MemberResolver {
  constructor(
    private readonly memberService: MemberService,
    private readonly invitationService: InvitationService,
  ) {}

  @Query(() => [MemberType], { name: 'members' })
  async members(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('filter', { nullable: true }) filter?: string,
  ): Promise<MemberType[]> {
    return this.memberService.members(businessId, filter) as unknown as MemberType[];
  }

  @Query(() => [InvitationType], { name: 'pendingInvitations' })
  async pendingInvitations(
    @Args('businessId', { type: () => ID }) businessId: string,
  ): Promise<InvitationType[]> {
    return this.invitationService.pendingInvitations(businessId) as unknown as InvitationType[];
  }

  @Mutation(() => InvitationType)
  async inviteMember(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('input') input: InviteMemberDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<InvitationType> {
    return this.invitationService.invite(businessId, user.sub, input) as unknown as InvitationType;
  }

  @Mutation(() => Boolean)
  async cancelInvitation(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('invitationId', { type: () => ID }) invitationId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    return this.invitationService.cancelInvitation(businessId, invitationId, user.sub);
  }

  @Mutation(() => MemberType)
  async acceptInvitation(
    @Args('token') token: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<MemberType> {
    return this.invitationService.acceptInvitation(token, user.sub) as unknown as MemberType;
  }

  @Mutation(() => Boolean)
  async declineInvitation(
    @Args('token') token: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    return this.invitationService.declineInvitation(token, user.sub);
  }

  @Mutation(() => MemberType)
  async changeMemberRole(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('targetUserId', { type: () => ID }) targetUserId: string,
    @Args('input') input: UpdateMemberRoleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<MemberType> {
    return this.memberService.changeMemberRole(
      businessId,
      user.sub,
      targetUserId,
      input.role,
    ) as unknown as MemberType;
  }

  @Mutation(() => Boolean)
  async removeMember(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('targetUserId', { type: () => ID }) targetUserId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    return this.memberService.removeMember(businessId, user.sub, targetUserId);
  }

  @Mutation(() => MemberType)
  async assignWidgets(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('targetUserId', { type: () => ID }) targetUserId: string,
    @Args('input') input: AssignWidgetsDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<MemberType> {
    return this.memberService.assignWidgets(
      businessId,
      user.sub,
      targetUserId,
      input.widgetIds,
    ) as unknown as MemberType;
  }
}
