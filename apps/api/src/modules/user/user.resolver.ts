import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SessionType } from '../auth/dto/session.type';
import { UserType } from '../auth/dto/user.type';
import { User } from '../auth/entities/user.entity';
import { IJwtPayload } from '../auth/jwt.strategy';
import { Department } from '../department/entities/department.entity';
import { DepartmentType } from '../department/dto/department.type';
import { AvatarUploadUrlType } from './dto/avatar-upload.type';
import { GetAvatarUploadUrlDto } from './dto/get-avatar-upload-url.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AvatarStorageService } from './services/avatar-storage.service';
import { UserService } from './user.service';

/** GraphQL user queries and mutations */
@Resolver(() => UserType)
@UseGuards(JwtAuthGuard)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly avatarStorage: AvatarStorageService,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) {}

  @Query(() => UserType)
  async me(@CurrentUser() user: IJwtPayload): Promise<UserType> {
    const u = await this.userService.findById(user.sub);
    return u;
  }

  @Mutation(() => UserType)
  async updateMe(
    @CurrentUser() user: IJwtPayload,
    @Args('input') input: UpdateProfileDto,
  ): Promise<UserType> {
    const u = await this.userService.updateProfile(user.sub, input);
    return u;
  }

  @ResolveField('department', () => DepartmentType, { nullable: true })
  async resolveDepartment(@Parent() user: User): Promise<DepartmentType | null> {
    if (!user.departmentId) return null;
    const d = await this.departmentRepo.findOne({ where: { id: user.departmentId } });
    return (d as DepartmentType | null) ?? null;
  }

  @Query(() => [SessionType])
  async mySessions(@CurrentUser() user: IJwtPayload): Promise<SessionType[]> {
    const sessions = await this.userService.getSessions(user.sub);
    return sessions.map((s) => ({
      ...s,
      isCurrent: !!user.sessionId && s.id === user.sessionId,
    }));
  }

  @Mutation(() => Boolean)
  async deleteSession(
    @CurrentUser() user: IJwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.userService.deleteSession(user.sub, id);
    return true;
  }

  @Mutation(() => Boolean)
  async deleteAccount(@CurrentUser() user: IJwtPayload): Promise<boolean> {
    await this.userService.deleteAccount(user.sub);
    return true;
  }

  @Mutation(() => AvatarUploadUrlType)
  async getAvatarUploadUrl(
    @CurrentUser() user: IJwtPayload,
    @Args('input') input: GetAvatarUploadUrlDto,
  ): Promise<AvatarUploadUrlType> {
    return this.avatarStorage.createUploadUrl('avatar', user.sub, input.filename);
  }
}
