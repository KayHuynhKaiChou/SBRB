import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlJwtAuthGuard } from '../../common/guards/gql-jwt-auth.guard';
import { IJwtPayload } from '../auth/jwt.strategy';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { WidgetType } from './dto/widget.type';
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
    return this.widgetService.findByTab(tabId, user.sub) as unknown as WidgetType[];
  }

  @Query(() => WidgetType, { name: 'widget' })
  async getWidget(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<WidgetType> {
    return this.widgetService.findById(id, user.sub) as unknown as WidgetType;
  }

  @Mutation(() => WidgetType)
  async createWidget(
    @Args('tabId', { type: () => ID }) tabId: string,
    @Args('input') input: CreateWidgetDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<WidgetType> {
    return this.widgetService.create(tabId, user.sub, input) as unknown as WidgetType;
  }

  @Mutation(() => WidgetType)
  async updateWidget(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateWidgetDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<WidgetType> {
    return this.widgetService.update(id, user.sub, input) as unknown as WidgetType;
  }

  @Mutation(() => Boolean)
  async deleteWidget(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<boolean> {
    await this.widgetService.delete(id, user.sub);
    return true;
  }
}
