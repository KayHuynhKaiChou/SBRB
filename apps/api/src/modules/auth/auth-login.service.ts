import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from './entities/user.entity';
import { IGoogleProfile } from './google.strategy';
import { IJwtPayload } from './jwt.strategy';
import { RedisRateLimitService } from './redis-rate-limit.service';

const BCRYPT_ROUNDS = 12;
const ATTEMPT_KEY = (email: string) => `auth:attempts:${email}`;
const ATTEMPT_LIMIT = 5;
const ATTEMPT_TTL = 15 * 60; // 15 min
const REFRESH_TTL_DAYS = 365;
const COOKIE_NAME = 'refresh_token';

export interface IAuthTokens {
  accessToken: string;
}

@Injectable()
export class AuthLoginService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly tokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly redis: RedisRateLimitService,
    private readonly config: ConfigService,
  ) {}

  async login(
    dto: LoginDto,
    ip: string,
    userAgent: string,
    res: Response,
  ): Promise<IAuthTokens> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.emailVerified) throw new ForbiddenException('Email not verified');

    const attempts = await this.redis.get(ATTEMPT_KEY(dto.email));
    if (attempts >= ATTEMPT_LIMIT) {
      throw new HttpException('Too many failed attempts. Try again in 15 minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash ?? '');
    if (!valid) {
      await this.redis.increment(ATTEMPT_KEY(dto.email), ATTEMPT_TTL);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.redis.delete(ATTEMPT_KEY(dto.email));
    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    return this.issueTokens(user, ip, userAgent, res);
  }

  async loginWithGoogle(
    profile: IGoogleProfile,
    ip: string,
    userAgent: string,
    res: Response,
  ): Promise<IAuthTokens> {
    let user = await this.userRepo.findOne({ where: { email: profile.email } });
    if (!user) {
      user = this.userRepo.create({
        email: profile.email,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        emailVerified: true,
        passwordHash: null,
      });
      await this.userRepo.save(user);
    }
    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    return this.issueTokens(user, ip, userAgent, res);
  }

  async refresh(rawToken: string, ip: string, userAgent: string, res: Response): Promise<IAuthTokens> {
    if (!rawToken) throw new UnauthorizedException('No refresh token');
    // Find by hash is not efficient — iterate is required since we hash differently each time.
    // Use a deterministic approach: store the raw token hashed with a fixed approach.
    // We use bcrypt.compare against stored hash.
    const records = await this.tokenRepo.find({
      where: { revokedAt: null as unknown as undefined },
      relations: ['user'],
    });

    let matched: RefreshToken | null = null;
    for (const r of records) {
      if (await bcrypt.compare(rawToken, r.tokenHash)) {
        matched = r;
        break;
      }
    }

    if (!matched) throw new UnauthorizedException('Invalid refresh token');
    if (matched.expiresAt < new Date()) throw new UnauthorizedException('Refresh token expired');

    // Revoke old token
    await this.tokenRepo.update(matched.id, { revokedAt: new Date() });

    return this.issueTokens(matched.user, ip, userAgent, res);
  }

  async logout(userId: string, rawToken: string | undefined, res: Response): Promise<void> {
    if (rawToken) {
      const records = await this.tokenRepo.find({
        where: { userId, revokedAt: null as unknown as undefined },
      });
      for (const r of records) {
        if (await bcrypt.compare(rawToken, r.tokenHash)) {
          await this.tokenRepo.update(r.id, { revokedAt: new Date() });
          break;
        }
      }
    }
    res.clearCookie(COOKIE_NAME);
  }

  async issueTokens(user: User, ip: string, userAgent: string, res: Response): Promise<IAuthTokens> {
    const payload: IJwtPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    const rawRefresh = uuidv4();
    const tokenHash = await bcrypt.hash(rawRefresh, BCRYPT_ROUNDS);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);

    await this.tokenRepo.save(
      this.tokenRepo.create({
        userId: user.id,
        tokenHash,
        ipAddress: ip,
        userAgent,
        expiresAt,
      }),
    );

    const isProd = this.config.get('NODE_ENV') === 'production';
    res.cookie(COOKIE_NAME, rawRefresh, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }
}
