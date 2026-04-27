import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthResult } from './dto/auth-result.type';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { IJwtPayload } from './jwt.strategy';

/** GraphQL mutations — SRS 4.1 auth flows */
@Resolver()
@UseGuards(JwtAuthGuard)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthResult)
  async register(
    @Args('input') input: RegisterDto,
  ): Promise<AuthResult> {
    const result = await this.authService.register(input);
    return { message: result.message };
  }

  @Public()
  @Mutation(() => AuthResult)
  async login(
    @Args('input') input: LoginDto,
    @Context() ctx: { req: Request; res: Response },
  ): Promise<AuthResult> {
    const ip = ctx.req.ip ?? '';
    const ua = ctx.req.headers['user-agent'] ?? '';
    return this.authService.login(input, ip, ua, ctx.res);
  }

  @Public()
  @Mutation(() => Boolean)
  async logout(@Context() ctx: { req: Request; res: Response }): Promise<boolean> {
    // Public — refresh_token cookie is the auth proof. Allows logout when
    // access has expired without leaving zombie refresh rows (C-2).
    const token = ctx.req.cookies?.['refresh_token'];
    await this.authService.logout(token, ctx.res);
    return true;
  }

  @Public()
  @Mutation(() => AuthResult)
  async refreshToken(
    @Context() ctx: { req: Request; res: Response },
  ): Promise<AuthResult> {
    const token = ctx.req.cookies?.['refresh_token'];
    const ip = ctx.req.ip ?? '';
    const ua = ctx.req.headers['user-agent'] ?? '';
    return this.authService.refresh(token, ip, ua, ctx.res);
  }

  @Public()
  @Mutation(() => Boolean)
  async verifyEmail(@Args('token') token: string): Promise<boolean> {
    await this.authService.verifyEmail(token);
    return true;
  }

  @Public()
  @Mutation(() => Boolean)
  async forgotPassword(@Args('email') email: string): Promise<boolean> {
    await this.authService.forgotPassword(email);
    return true;
  }

  @Public()
  @Mutation(() => Boolean)
  async resetPassword(@Args('input') input: ResetPasswordDto): Promise<boolean> {
    await this.authService.resetPassword(input.token, input.newPassword);
    return true;
  }

  @Mutation(() => Boolean)
  async changePassword(
    @CurrentUser() user: IJwtPayload,
    @Args('input') input: ChangePasswordDto,
  ): Promise<boolean> {
    await this.authService.changePassword(user.sub, input);
    return true;
  }
}
