import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IJwtPayload } from '../auth/jwt.strategy';
import { BusinessService } from './business.service';
import { BusinessType } from './dto/business.type';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { AvatarUploadUrlType } from '../user/dto/avatar-upload.type';
import { GetAvatarUploadUrlDto } from '../user/dto/get-avatar-upload-url.dto';
import { AvatarStorageService } from '../user/services/avatar-storage.service';

/** GraphQL resolver for Business — SRS 4.2 */
@Resolver(() => BusinessType)
@UseGuards(JwtAuthGuard)
export class BusinessResolver {
  constructor(
    private readonly businessService: BusinessService,
    private readonly imageStorage: AvatarStorageService,
  ) {}

  @Query(() => BusinessType, { name: 'business' })
  async getBusiness(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<BusinessType> {
    return this.businessService.findById(id, user.sub);
  }

  @Query(() => [BusinessType], { name: 'myBusinesses' })
  async getMyBusinesses(
    @CurrentUser() user: IJwtPayload,
  ): Promise<BusinessType[]> {
    return this.businessService.findMyBusinesses(user.sub);
  }

  @Mutation(() => BusinessType)
  async createBusiness(
    @Args('input') input: CreateBusinessDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<BusinessType> {
    return this.businessService.create(user.sub, input);
  }

  @Mutation(() => BusinessType)
  async updateBusiness(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateBusinessDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<BusinessType> {
    return this.businessService.update(id, user.sub, input);
  }

  @Mutation(() => Boolean)
  async deleteBusiness(
    @Args('id', { type: () => ID }) id: string,
    @Args('confirmName') confirmName: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<boolean> {
    await this.businessService.delete(id, user.sub, confirmName);
    return true;
  }

  @Mutation(() => AvatarUploadUrlType)
  async getLogoUploadUrl(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('input') input: GetAvatarUploadUrlDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<AvatarUploadUrlType> {
    await this.businessService.findById(businessId, user.sub);
    return this.imageStorage.createUploadUrl('logo', businessId, input.filename);
  }

  @Mutation(() => Boolean)
  async transferOwnership(
    @Args('id', { type: () => ID }) id: string,
    @Args('newOwnerId', { type: () => ID }) newOwnerId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<boolean> {
    await this.businessService.transferOwnership(id, user.sub, newOwnerId);
    return true;
  }
}
