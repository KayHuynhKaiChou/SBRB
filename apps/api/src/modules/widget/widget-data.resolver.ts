import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlJwtAuthGuard } from '../../common/guards/gql-jwt-auth.guard';
import { IJwtPayload } from '../auth/jwt.strategy';
import { ChartData } from './dto/chart-data.dto';
import { UpdateDataLinkDto } from './dto/update-data-link.dto';
import { WidgetType } from './dto/widget.type';
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

  @Mutation(() => WidgetType)
  updateWidgetConfig(
    @Args('id', { type: () => ID }) id: string,
    @Args('config', { type: () => GraphQLJSON }) config: Record<string, unknown>,
    @CurrentUser() user: IJwtPayload,
  ): Promise<WidgetType> {
    return this.widgetDataService.updateConfig(id, user.sub, config);
  }

  @Mutation(() => WidgetType)
  updateWidgetDataLink(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDataLinkDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<WidgetType> {
    return this.widgetDataService.updateDataLink(id, user.sub, input);
  }

  @Mutation(() => WidgetType)
  removeWidgetDataLink(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<WidgetType> {
    return this.widgetDataService.removeDataLink(id, user.sub);
  }
}
