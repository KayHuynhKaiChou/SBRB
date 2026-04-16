import { Inject, UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GqlJwtAuthGuard } from '../../common/guards/gql-jwt-auth.guard';
import { IJwtPayload } from '../auth/jwt.strategy';
import { DatasheetEditService } from './datasheet-edit.service';
import { DatasheetService } from './datasheet.service';
import { AddPeriodDto } from './dto/add-period.dto';
import { AddSeriesDto } from './dto/add-series.dto';
import {
  DataSeriesType,
  DataSheetType,
  ImportProgressType,
} from './dto/datasheet.type';
import { UpdateDatasheetDto } from './dto/update-datasheet.dto';
import { UpdateSeriesValueDto } from './dto/update-series-value.dto';

/** GraphQL resolver for DataSheet — SRS 4.7 / 4.8 */
@Resolver(() => DataSheetType)
@UseGuards(GqlJwtAuthGuard)
export class DatasheetResolver {
  constructor(
    private readonly datasheetService: DatasheetService,
    private readonly editService: DatasheetEditService,
    @Inject('PUBSUB') private readonly pubSub: PubSub,
  ) {}

  @Query(() => [DataSheetType], { name: 'dataSheets' })
  async getDataSheets(
    @Args('businessId', { type: () => ID }) businessId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DataSheetType[]> {
    return this.datasheetService.findByBusiness(businessId, user.sub);
  }

  @Query(() => DataSheetType, { name: 'dataSheet' })
  async getDataSheet(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DataSheetType> {
    return this.datasheetService.findById(id, user.sub);
  }

  @Query(() => [DataSeriesType], { name: 'dataSeries' })
  async getDataSeries(
    @Args('datasheetId', { type: () => ID }) datasheetId: string,
    @Args('search', { type: () => String, nullable: true }) search: string | undefined,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DataSeriesType[]> {
    return this.datasheetService.findSeries(datasheetId, user.sub, search);
  }

  @Mutation(() => DataSheetType)
  async renameDataSheet(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDatasheetDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DataSheetType> {
    return this.datasheetService.update(id, user.sub, input.name, input.departmentId);
  }

  @Mutation(() => Boolean)
  async deleteDataSheet(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<boolean> {
    await this.datasheetService.delete(id, user.sub);
    return true;
  }

  @Mutation(() => DataSeriesType)
  async updateSeriesValue(
    @Args('input') input: UpdateSeriesValueDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DataSeriesType> {
    return this.editService.updateSeriesValue(input.seriesId, input.period, input.value, user.sub);
  }

  @Mutation(() => DataSeriesType)
  async addSeries(
    @Args('input') input: AddSeriesDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DataSeriesType> {
    return this.editService.addSeries(input.datasheetId, input.name, user.sub);
  }

  @Mutation(() => Boolean)
  async deleteSeries(
    @Args('seriesId', { type: () => ID }) seriesId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<boolean> {
    return this.editService.deleteSeries(seriesId, user.sub);
  }

  @Mutation(() => DataSheetType)
  async addPeriod(
    @Args('input') input: AddPeriodDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DataSheetType> {
    return this.editService.addPeriod(input.datasheetId, input.periodName, user.sub);
  }

  @Mutation(() => DataSheetType)
  async deletePeriod(
    @Args('datasheetId', { type: () => ID }) datasheetId: string,
    @Args('periodName') periodName: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DataSheetType> {
    return this.editService.deletePeriod(datasheetId, periodName, user.sub);
  }

  @Mutation(() => DataSeriesType)
  async renameSeries(
    @Args('seriesId', { type: () => ID }) seriesId: string,
    @Args('name') name: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DataSeriesType> {
    return this.editService.renameSeries(seriesId, name, user.sub);
  }

  /** Subscription: real-time import progress updates */
  @Subscription(() => ImportProgressType, {
    filter: (
      payload: { importProgress: ImportProgressType },
      variables: { datasheetId: string },
    ) => payload.importProgress.datasheetId === variables.datasheetId,
  })
  importProgress(@Args('datasheetId', { type: () => ID }) _datasheetId: string) {
    return (this.pubSub as any).asyncIterator(['importProgress']);
  }
}
