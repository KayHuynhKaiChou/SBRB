import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// TODO: Import entities and services when implemented
// import { UserEntity } from './entities/user.entity';
// import { RefreshTokenEntity } from './entities/refresh-token.entity';
// import { AuthService } from './auth.service';
// import { AuthResolver } from './auth.resolver';
// import { AuthController } from './auth.controller';
// import { JwtStrategy } from './strategies/jwt.strategy';
// import { GoogleStrategy } from './strategies/google.strategy';

/**
 * Auth module — SRS 4.1
 * Handles: registration, login (JWT + Google OAuth), email verify,
 * refresh tokens (HttpOnly cookie), password reset, sessions
 */
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRY', '15m'),
        },
      }),
    }),
    // TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
  ],
  // providers: [AuthService, AuthResolver, JwtStrategy, GoogleStrategy],
  // controllers: [AuthController],
  // exports: [AuthService, JwtModule],
})
export class AuthModule {}
