import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { IApiResponse } from '@sbrb/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlJwtAuthGuard } from '../../common/guards/gql-jwt-auth.guard';
import { created, ok } from '../../common/utils/api-response.util';
import { IJwtPayload } from '../auth/jwt.strategy';
import { CreateTabDto } from './dto/create-tab.dto';
import { TabOrderItemDto } from './dto/reorder-tabs.dto';
import { TabType } from './dto/tab.type';
import { TabResponse } from './dto/tab-response.type';
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

  @Mutation(() => TabResponse)
  async createTab(
    @Args('input') input: CreateTabDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IApiResponse<TabType>> {
    const tab = await this.tabService.create(input.businessId, user.sub, input);
    return created(tab, { vi: 'Đã tạo Tab', en: 'Tab created' });
  }

  @Mutation(() => TabResponse)
  async updateTab(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTabDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IApiResponse<TabType>> {
    const tab = await this.tabService.update(id, user.sub, input);
    return ok(tab, { vi: 'Đã cập nhật Tab', en: 'Tab updated' });
  }

  @Mutation(() => TabResponse)
  async deleteTab(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IApiResponse<TabType>> {
    const snapshot = await this.tabService.delete(id, user.sub);
    return ok(snapshot, { vi: 'Đã xoá Tab', en: 'Tab deleted' });
  }

  @Mutation(() => TabResponse, { nullable: true })
  async reorderTabs(
    @Args('orders', { type: () => [TabOrderItemDto] }) orders: TabOrderItemDto[],
    @CurrentUser() user: IJwtPayload,
  ): Promise<IApiResponse<TabType | null>> {
    await this.tabService.reorder(user.sub, orders);
    return ok(null, { vi: 'Đã sắp xếp Tab', en: 'Tabs reordered' });
  }
}
