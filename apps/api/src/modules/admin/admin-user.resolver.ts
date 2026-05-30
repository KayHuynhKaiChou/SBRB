import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { IJwtPayload } from '@sbrb/shared-types';
import { AdminUserService } from './admin-user.service';
import { AdminUserListResultType } from './dto/admin-user-list-result.type';
import { AdminUserRowType } from './dto/admin-user-row.type';
import { AdminUserDetailType } from './dto/admin-user-detail.type';
import { AdminUserFilterInput } from './dto/admin-user-filter.input';
import { PageInput } from '../../common/dto/page.input';

/** All admin user resolvers require platform-admin JWT. SRS §5.11 */
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Resolver()
export class AdminUserResolver {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Query(() => AdminUserListResultType, {
    description: 'Paginated list of all users across the platform. Admin only.',
  })
  async adminUsers(
    @Args('filter', { nullable: true }) filter?: AdminUserFilterInput,
    @Args('page', { nullable: true }) page?: PageInput,
  ): Promise<AdminUserListResultType> {
    return this.adminUserService.listUsers(filter, page);
  }

  @Query(() => AdminUserDetailType, {
    description: 'Full read-only profile of any user. Admin only.',
  })
  async adminUserDetail(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<AdminUserDetailType> {
    return this.adminUserService.getUserDetail(id);
  }

  @Mutation(() => AdminUserRowType, {
    description: 'Disable a user account. Admin cannot disable themselves. SRS §5.11.',
  })
  async disableUser(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() admin: IJwtPayload,
  ): Promise<AdminUserRowType> {
    return this.adminUserService.disableUser(id, admin.sub);
  }

  @Mutation(() => AdminUserRowType, {
    description: 'Re-enable a previously disabled user account. Admin only.',
  })
  async enableUser(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() admin: IJwtPayload,
  ): Promise<AdminUserRowType> {
    return this.adminUserService.enableUser(id, admin.sub);
  }
}
