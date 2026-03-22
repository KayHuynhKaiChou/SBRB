import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt.strategy';
import { BusinessService } from './business.service';
import { BusinessType } from './dto/business.type';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

/** GraphQL resolver for Business — SRS 4.2 */
@Resolver(() => BusinessType)
@UseGuards(JwtAuthGuard)
export class BusinessResolver {
  constructor(private readonly businessService: BusinessService) {}

  @Query(() => BusinessType, { name: 'business' })
  async getBusiness(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<BusinessType> {
    return this.businessService.findById(id, user.sub) as unknown as BusinessType;
  }

  @Query(() => [BusinessType], { name: 'myBusinesses' })
  async getMyBusinesses(
    @CurrentUser() user: JwtPayload,
  ): Promise<BusinessType[]> {
    return this.businessService.findMyBusinesses(user.sub) as unknown as BusinessType[];
  }

  @Mutation(() => BusinessType)
  async createBusiness(
    @Args('input') input: CreateBusinessDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BusinessType> {
    return this.businessService.create(user.sub, input) as unknown as BusinessType;
  }

  @Mutation(() => BusinessType)
  async updateBusiness(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateBusinessDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BusinessType> {
    return this.businessService.update(id, user.sub, input) as unknown as BusinessType;
  }

  @Mutation(() => Boolean)
  async deleteBusiness(
    @Args('id', { type: () => ID }) id: string,
    @Args('confirmName') confirmName: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    await this.businessService.delete(id, user.sub, confirmName);
    return true;
  }

  @Mutation(() => Boolean)
  async transferOwnership(
    @Args('id', { type: () => ID }) id: string,
    @Args('newOwnerId', { type: () => ID }) newOwnerId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    await this.businessService.transferOwnership(id, user.sub, newOwnerId);
    return true;
  }
}
