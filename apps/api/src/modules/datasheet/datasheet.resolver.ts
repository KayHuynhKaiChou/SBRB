import { Inject, UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlJwtAuthGuard } from '../../common/guards/gql-jwt-auth.guard';
import { IJwtPayload } from '../auth/jwt.strategy';
import { DatasheetService } from './datasheet.service';
import {
  DataSeriesType,
  DataSheetType,
  ImportProgressType,
} from './dto/datasheet.type';
import { UpdateDatasheetDto } from './dto/update-datasheet.dto';

/** GraphQL resolver for DataSheet — SRS 4.7 / 4.8 */
@Resolver(() => DataSheetType)
@UseGuards(GqlJwtAuthGuard)
export class DatasheetResolver {
  constructor(
    private readonly datasheetService: DatasheetService,
    @Inject('PUBSUB') private readonly pubSub: PubSub,
  ) {}

  @Query(() => [DataSheetType], { name: 'dataSheets' })
  async getDataSheets(
    @Args('businessId', { type: () => ID }) businessId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DataSheetType[]> {
    return this.datasheetService.findByBusiness(
      businessId,
      user.sub,
    ) as unknown as DataSheetType[];
  }

  @Query(() => DataSheetType, { name: 'dataSheet' })
  async getDataSheet(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DataSheetType> {
    return this.datasheetService.findById(id, user.sub) as unknown as DataSheetType;
  }

  @Query(() => [DataSeriesType], { name: 'dataSeries' })
  async getDataSeries(
    @Args('datasheetId', { type: () => ID }) datasheetId: string,
    @Args('search', { type: () => String, nullable: true }) search: string | undefined,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DataSeriesType[]> {
    return this.datasheetService.findSeries(
      datasheetId,
      user.sub,
      search,
    ) as unknown as DataSeriesType[];
  }

  @Mutation(() => DataSheetType)
  async renameDataSheet(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDatasheetDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DataSheetType> {
    return this.datasheetService.rename(id, user.sub, input.name) as unknown as DataSheetType;
  }

  @Mutation(() => Boolean)
  async deleteDataSheet(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<boolean> {
    await this.datasheetService.delete(id, user.sub);
    return true;
  }

  /** Subscription: real-time import progress updates */
  @Subscription(() => ImportProgressType, {
    filter: (payload: { importProgress: ImportProgressType }, variables: { datasheetId: string }) =>
      payload.importProgress.datasheetId === variables.datasheetId,
  })
  importProgress(@Args('datasheetId', { type: () => ID }) _datasheetId: string) {
    return (this.pubSub as any).asyncIterator(['importProgress']);
  }
}
