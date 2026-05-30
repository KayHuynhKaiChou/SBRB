import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { IJwtPayload } from '@sbrb/shared-types';
import { AdminBusinessService } from './admin-business.service';
import { AdminBusinessListResultType } from './dto/admin-business-list-result.type';
import { AdminBusinessRowType } from './dto/admin-business-row.type';
import { AdminBusinessFilterInput } from './dto/admin-business-filter.input';
import { PageInput } from '../../common/dto/page.input';

/** All admin business resolvers require platform-admin JWT. SRS §5.11 */
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Resolver()
export class AdminBusinessResolver {
  constructor(private readonly adminBusinessService: AdminBusinessService) {}

  @Query(() => AdminBusinessListResultType, {
    description: 'Paginated list of all businesses across the platform. Admin only.',
  })
  async adminBusinesses(
    @Args('filter', { nullable: true }) filter?: AdminBusinessFilterInput,
    @Args('page', { nullable: true }) page?: PageInput,
  ): Promise<AdminBusinessListResultType> {
    return this.adminBusinessService.listBusinesses(filter, page);
  }

  @Mutation(() => AdminBusinessRowType, {
    description: 'Set a business to inactive. Requires reason string. Admin only.',
  })
  async inactivateBusiness(
    @Args('id', { type: () => ID }) id: string,
    @Args('reason') reason: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<AdminBusinessRowType> {
    return this.adminBusinessService.inactivateBusiness(id, user.sub, reason);
  }

  @Mutation(() => AdminBusinessRowType, {
    description: 'Restore an inactive business to active status. Admin only.',
  })
  async reactivateBusiness(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<AdminBusinessRowType> {
    return this.adminBusinessService.reactivateBusiness(id, user.sub);
  }
}
