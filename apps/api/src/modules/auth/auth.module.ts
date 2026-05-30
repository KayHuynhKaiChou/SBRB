import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthLoginService } from './auth-login.service';
import { AuthPasswordService } from './auth-password.service';
import { AuthRegisterService } from './auth-register.service';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { EmailVerification } from './entities/email-verification.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Session } from './entities/session.entity';
import { User } from './entities/user.entity';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';
import { REDIS_CLIENT, RedisRateLimitService } from './redis-rate-limit.service';
import { RefreshTokenService } from './refresh-token.service';

/**
 * Auth module — SRS 4.1
 * Handles: registration, login (JWT + Google OAuth), email verify,
 * refresh tokens (HttpOnly cookie), password reset, sessions
 */
@Module({
  imports: [
    ConfigModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRY', '30d'),
        },
      }),
    }),
    TypeOrmModule.forFeature([User, RefreshToken, Session, EmailVerification, PasswordReset]),
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => new Redis({
        host: config.get<string>('REDIS_HOST', 'localhost'),
        port: config.get<number>('REDIS_PORT', 6379),
        password: config.get<string>('REDIS_PASSWORD'),
        tls: config.get('REDIS_TLS', 'false') === 'true' ? {} : undefined,
      }),
    },
    RedisRateLimitService,
    RefreshTokenService,
    AuthRegisterService,
    AuthLoginService,
    AuthPasswordService,
    AuthService,
    AuthResolver,
    JwtStrategy,
    GoogleStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, RefreshTokenService],
})
export class AuthModule {}
