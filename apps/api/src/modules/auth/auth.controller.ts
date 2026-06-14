import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { API_CODE, type IApiResponse } from '@sbrb/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { IGoogleProfile } from './google.strategy';
import { IJwtPayload } from './jwt.strategy';

const ok = <T>(data: T, en = 'Success', vi = 'Thành công'): IApiResponse<T> => ({
  code: API_CODE.OK,
  message: { en, vi },
  data,
  error: null,
});

/** REST auth endpoints — SRS 4.1 */
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return ok(result, 'Registration successful', 'Đăng ký thành công');
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(
      dto,
      req.ip ?? '',
      req.headers['user-agent'] ?? '',
      res,
    );
    return ok(tokens, 'Login successful', 'Đăng nhập thành công');
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Public — refresh_token cookie is the auth proof. Allows logout when
    // access token has already expired without leaving zombie refresh rows.
    return this.authService.logout(req.cookies?.['refresh_token'], res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['refresh_token'];
    const tokens = await this.authService.refresh(
      token,
      req.ip ?? '',
      req.headers['user-agent'] ?? '',
      res,
    );
    return ok(tokens, 'Token refreshed', 'Làm mới token thành công');
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyEmailOtp(@Body('email') email: string, @Body('code') code: string) {
    const result = await this.authService.verifyEmailOtp(email, code);
    return ok(result, 'Email verified', 'Xác thực email thành công');
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body('email') email: string) {
    const result = await this.authService.resendVerification(email);
    return ok(result, 'Verification email sent', 'Email xác thực đã gửi');
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    const result = await this.authService.forgotPassword(email);
    return ok(result, 'Password reset email sent', 'Email đặt lại mật khẩu đã gửi');
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto.token, dto.newPassword);
    return ok(result, 'Password reset successfully', 'Đặt lại mật khẩu thành công');
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: IGoogleProfile },
    @Res() res: Response,
  ) {
    const tokens = await this.authService.loginWithGoogle(
      req.user,
      req.ip ?? '',
      req.headers['user-agent'] ?? '',
      res,
    );
    const feUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:3000';
    res.redirect(`${feUrl}/auth/callback?token=${tokens.accessToken}`);
  }
}
