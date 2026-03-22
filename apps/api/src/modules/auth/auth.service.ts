import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { AuthLoginService, IAuthTokens } from './auth-login.service';
import { AuthPasswordService } from './auth-password.service';
import { AuthRegisterService } from './auth-register.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { IGoogleProfile } from './google.strategy';

/**
 * Facade service — delegates to focused sub-services.
 * SRS 4.1: register, login, OAuth, email verify, refresh, logout, password reset
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly registerService: AuthRegisterService,
    private readonly loginService: AuthLoginService,
    private readonly passwordService: AuthPasswordService,
  ) {}

  register(dto: RegisterDto) {
    return this.registerService.register(dto);
  }

  verifyEmail(token: string) {
    return this.registerService.verifyEmail(token);
  }

  resendVerification(email: string) {
    return this.registerService.resendVerification(email);
  }

  login(dto: LoginDto, ip: string, userAgent: string, res: Response): Promise<IAuthTokens> {
    return this.loginService.login(dto, ip, userAgent, res);
  }

  loginWithGoogle(profile: IGoogleProfile, ip: string, ua: string, res: Response): Promise<IAuthTokens> {
    return this.loginService.loginWithGoogle(profile, ip, ua, res);
  }

  refresh(rawToken: string, ip: string, userAgent: string, res: Response): Promise<IAuthTokens> {
    return this.loginService.refresh(rawToken, ip, userAgent, res);
  }

  logout(userId: string, rawToken: string | undefined, res: Response): Promise<void> {
    return this.loginService.logout(userId, rawToken, res);
  }

  forgotPassword(email: string) {
    return this.passwordService.forgotPassword(email);
  }

  resetPassword(token: string, newPassword: string) {
    return this.passwordService.resetPassword(token, newPassword);
  }

  changePassword(userId: string, dto: ChangePasswordDto) {
    return this.passwordService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }
}
