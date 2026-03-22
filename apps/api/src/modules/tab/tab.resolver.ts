import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlJwtAuthGuard } from '../../common/guards/gql-jwt-auth.guard';
import { IJwtPayload } from '../auth/jwt.strategy';
import { CreateTabDto } from './dto/create-tab.dto';
import { TabOrderItemDto } from './dto/reorder-tabs.dto';
import { TabType } from './dto/tab.type';
import { UpdateTabDto } from './dto/update-tab.dto';
import { TabService } from './tab.service';

/** GraphQL resolver for Tab — SRS 4.3 */
@Resolver(() => TabType)
@UseGuards(GqlJwtAuthGuard)
export class TabResolver {
  constructor(private readonly tabService: TabService) {}

  @Query(() => [TabType], { name: 'tabs' })
  async getTabs(
    @Args('businessId', { type: () => ID }) businessId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<TabType[]> {
    return this.tabService.findByBusiness(businessId, user.sub) as unknown as TabType[];
  }

  @Mutation(() => TabType)
  async createTab(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('input') input: CreateTabDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<TabType> {
    return this.tabService.create(businessId, user.sub, input) as unknown as TabType;
  }

  @Mutation(() => TabType)
  async updateTab(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTabDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<TabType> {
    return this.tabService.update(id, user.sub, input) as unknown as TabType;
  }

  @Mutation(() => Boolean)
  async deleteTab(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<boolean> {
    await this.tabService.delete(id, user.sub);
    return true;
  }

  @Mutation(() => [TabType])
  async reorderTabs(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('orders', { type: () => [TabOrderItemDto] }) orders: TabOrderItemDto[],
    @CurrentUser() user: IJwtPayload,
  ): Promise<TabType[]> {
    return this.tabService.reorder(businessId, user.sub, orders) as unknown as TabType[];
  }
}
