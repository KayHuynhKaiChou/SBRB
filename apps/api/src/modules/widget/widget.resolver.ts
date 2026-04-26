import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { IApiResponse } from '@sbrb/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlJwtAuthGuard } from '../../common/guards/gql-jwt-auth.guard';
import { created, ok } from '../../common/utils/api-response.util';
import { IJwtPayload } from '../auth/jwt.strategy';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { WidgetType } from './dto/widget.type';
import { WidgetResponse } from './dto/widget-response.type';
import { WidgetService } from './widget.service';

/** GraphQL resolver for Widget — SRS 4.4 / 4.5 */
@Resolver(() => WidgetType)
@UseGuards(GqlJwtAuthGuard)
export class WidgetResolver {
  constructor(private readonly widgetService: WidgetService) {}

  @Query(() => [WidgetType], { name: 'widgets' })
  async getWidgets(
    @Args('tabId', { type: () => ID }) tabId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<WidgetType[]> {
    return this.widgetService.findByTab(tabId, user.sub);
  }

  @Query(() => WidgetType, { name: 'widget' })
  async getWidget(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<WidgetType> {
    return this.widgetService.findById(id, user.sub);
  }

  @Mutation(() => WidgetResponse)
  async createWidget(
    @Args('input') input: CreateWidgetDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IApiResponse<WidgetType>> {
    const widget = await this.widgetService.create(input.tabId, user.sub, input);
    return created(widget, { vi: 'Đã tạo Widget', en: 'Widget created' });
  }

  @Mutation(() => WidgetResponse)
  async updateWidget(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateWidgetDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IApiResponse<WidgetType>> {
    const widget = await this.widgetService.update(id, user.sub, input);
    return ok(widget, { vi: 'Đã cập nhật Widget', en: 'Widget updated' });
  }

  @Mutation(() => WidgetResponse)
  async deleteWidget(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IApiResponse<WidgetType>> {
    const snapshot = await this.widgetService.delete(id, user.sub);
    return ok(snapshot, { vi: 'Đã xoá Widget', en: 'Widget deleted' });
  }
}
