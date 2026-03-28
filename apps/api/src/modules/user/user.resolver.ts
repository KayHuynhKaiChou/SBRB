import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SessionType } from '../auth/dto/session.type';
import { UserType } from '../auth/dto/user.type';
import { IJwtPayload } from '../auth/jwt.strategy';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

/** GraphQL user queries and mutations */
@Resolver(() => UserType)
@UseGuards(JwtAuthGuard)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

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

  @Query(() => [SessionType])
  async mySessions(@CurrentUser() user: IJwtPayload): Promise<SessionType[]> {
    const sessions = await this.userService.getSessions(user.sub);
    return sessions;
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
}
