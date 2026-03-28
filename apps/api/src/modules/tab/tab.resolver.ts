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
    return this.tabService.findByBusiness(businessId, user.sub);
  }

  @Mutation(() => TabType)
  async createTab(
    @Args('input') input: CreateTabDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<TabType> {
    return this.tabService.create(input.businessId, user.sub, input);
  }

  @Mutation(() => TabType)
  async updateTab(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTabDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<TabType> {
    return this.tabService.update(id, user.sub, input);
  }

  @Mutation(() => Boolean)
  async deleteTab(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<boolean> {
    await this.tabService.delete(id, user.sub);
    return true;
  }

  @Mutation(() => Boolean)
  async reorderTabs(
    @Args('orders', { type: () => [TabOrderItemDto] }) orders: TabOrderItemDto[],
    @CurrentUser() user: IJwtPayload,
  ): Promise<boolean> {
    await this.tabService.reorder(user.sub, orders);
    return true;
  }
}
