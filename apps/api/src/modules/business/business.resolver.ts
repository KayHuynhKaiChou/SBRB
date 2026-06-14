import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IJwtPayload } from '../auth/jwt.strategy';
import { BusinessService } from './business.service';
import { BusinessType } from './dto/business.type';
import { BusinessChangeRequestType } from './dto/business-change-request.type';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { GetBusinessAssetUploadUrlDto } from './dto/get-business-asset-upload-url.dto';
import { AvatarUploadUrlType } from '../user/dto/avatar-upload.type';
import { GetAvatarUploadUrlDto } from '../user/dto/get-avatar-upload-url.dto';
import { AvatarStorageService } from '../user/services/avatar-storage.service';
import { BusinessChangeRequest } from './entities/business-change-request.entity';

function toChangeRequestType(r: BusinessChangeRequest): BusinessChangeRequestType {
  return {
    id: r.id,
    businessId: r.businessId,
    requestedBy: r.requestedBy,
    status: r.status,
    changes: r.changes,
    reviewReason: r.reviewReason ?? null,
    reviewedAt: r.reviewedAt ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

/** GraphQL resolver for Business — SRS 4.2 + business-approval-rules. */
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

  @Query(() => BusinessChangeRequestType, { name: 'myOpenChangeRequest', nullable: true })
  async myOpenChangeRequest(
    @Args('businessId', { type: () => ID }) businessId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<BusinessChangeRequestType | null> {
    const req = await this.businessService.getOpenChangeRequest(businessId, user.sub);
    return req ? toChangeRequestType(req) : null;
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

  @Mutation(() => BusinessType, {
    description: 'Owner resubmits a rejected/pending business for admin review.',
  })
  async submitBusinessForReview(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<BusinessType> {
    return this.businessService.submitForReview(id, user.sub);
  }

  @Mutation(() => BusinessChangeRequestType, {
    description: 'Owner requests a change to an approved business (admin must approve).',
  })
  async requestBusinessChange(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateBusinessDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<BusinessChangeRequestType> {
    const req = await this.businessService.requestChange(id, user.sub, input);
    return toChangeRequestType(req);
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

  @Mutation(() => AvatarUploadUrlType, {
    description:
      'Signed upload URL for a business asset (logo/banner image or licence doc). ' +
      'businessId omitted during signup (no business yet) → path keyed by the owner.',
  })
  async getBusinessAssetUploadUrl(
    @Args('input') input: GetBusinessAssetUploadUrlDto,
    @CurrentUser() user: IJwtPayload,
    @Args('businessId', { type: () => ID, nullable: true }) businessId?: string,
  ): Promise<AvatarUploadUrlType> {
    // Existing business → verify ownership. Signup (no businessId) → key by user id.
    if (businessId) {
      await this.businessService.findById(businessId, user.sub);
    }
    const storageKey = businessId ?? user.sub;
    return this.imageStorage.createUploadUrl(input.kind, storageKey, input.filename);
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
