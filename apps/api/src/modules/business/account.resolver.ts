import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { IJwtPayload } from '@sbrb/shared-types';
import { AccountLifecycleService } from './account-lifecycle.service';
import { BusinessMembersService } from './business-members.service';
import { BusinessMembersFilterInput } from './dto/business-members.input';
import {
  BusinessMemberRowType,
  BusinessMembersResultType,
} from './dto/business-member-row.type';
import { CreateStaffAccountDto } from './dto/create-staff-account.dto';
import { SetAccountPasswordDto } from './dto/set-account-password.dto';

/**
 * Personnel account lifecycle resolver. All mutations enforce business-role rules
 * inside the service (owner → manager|staff, manager → staff). setAccountPassword is public.
 */
@Resolver()
@UseGuards(JwtAuthGuard)
export class AccountResolver {
  constructor(
    private readonly lifecycle: AccountLifecycleService,
    private readonly membersService: BusinessMembersService,
  ) {}

  @Query(() => BusinessMembersResultType, { name: 'businessMembers' })
  async businessMembers(
    @Args('businessId', { type: () => ID }) businessId: string,
    @CurrentUser() user: IJwtPayload,
    @Args('filter', { nullable: true }) filter?: BusinessMembersFilterInput,
  ): Promise<BusinessMembersResultType> {
    return this.membersService.businessMembers(businessId, user.sub, filter);
  }

  @Mutation(() => BusinessMemberRowType)
  async createStaffAccount(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('input') input: CreateStaffAccountDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<BusinessMemberRowType> {
    return this.lifecycle.createStaffAccount(businessId, user.sub, input);
  }

  @Public()
  @Mutation(() => Boolean)
  async setAccountPassword(
    @Args('input') input: SetAccountPasswordDto,
  ): Promise<boolean> {
    return this.lifecycle.setAccountPassword(input);
  }

  @Mutation(() => Boolean)
  async resendAccountInvite(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<boolean> {
    return this.lifecycle.resendAccountInvite(businessId, user.sub, userId);
  }

  @Mutation(() => Boolean)
  async deletePendingAccount(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<boolean> {
    return this.lifecycle.deletePendingAccount(businessId, user.sub, userId);
  }

  @Mutation(() => BusinessMemberRowType)
  async setMemberAccountStatus(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('active') active: boolean,
    @CurrentUser() user: IJwtPayload,
  ): Promise<BusinessMemberRowType> {
    return this.lifecycle.setMemberAccountStatus(businessId, user.sub, userId, active);
  }
}
