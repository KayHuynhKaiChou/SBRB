import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import type { IApiResponse } from '@sbrb/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlJwtAuthGuard } from '../../common/guards/gql-jwt-auth.guard';
import { ok } from '../../common/utils/api-response.util';
import { IJwtPayload } from '../auth/jwt.strategy';
import { ChartData } from './dto/chart-data.dto';
import { UpdateDataLinkDto } from './dto/update-data-link.dto';
import { WidgetType } from './dto/widget.type';
import { WidgetResponse } from './dto/widget-response.type';
import { AvailableSeriesType } from './dto/available-series.type';
import { WidgetDataService } from './widget-data.service';

/** GraphQL resolver for chart data + data-link management — SRS 4.5 */
@Resolver()
@UseGuards(GqlJwtAuthGuard)
export class WidgetDataResolver {
  constructor(private readonly widgetDataService: WidgetDataService) {}

  @Query(() => [AvailableSeriesType])
  availableSeries(
    @Args('widgetId', { type: () => ID }) widgetId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<AvailableSeriesType[]> {
    return this.widgetDataService.getAvailableSeries(widgetId, user.sub);
  }

  @Query(() => ChartData)
  widgetChartData(
    @Args('widgetId', { type: () => ID }) widgetId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<ChartData> {
    return this.widgetDataService.getChartData(widgetId, user.sub);
  }

  @Mutation(() => WidgetResponse)
  async updateWidgetConfig(
    @Args('id', { type: () => ID }) id: string,
    @Args('config', { type: () => GraphQLJSON }) config: Record<string, unknown>,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IApiResponse<WidgetType>> {
    const widget = await this.widgetDataService.updateConfig(id, user.sub, config);
    return ok(widget, { vi: 'Đã cập nhật Widget', en: 'Widget updated' });
  }

  @Mutation(() => WidgetResponse)
  async updateWidgetDataLink(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDataLinkDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IApiResponse<WidgetType>> {
    const widget = await this.widgetDataService.updateDataLink(id, user.sub, input);
    return ok(widget, { vi: 'Đã liên kết dữ liệu', en: 'Data linked' });
  }

  @Mutation(() => WidgetResponse)
  async removeWidgetDataLink(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IApiResponse<WidgetType>> {
    const widget = await this.widgetDataService.removeDataLink(id, user.sub);
    return ok(widget, { vi: 'Đã xoá liên kết dữ liệu', en: 'Data link removed' });
  }
}
