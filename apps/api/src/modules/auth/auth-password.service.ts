import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PASSWORD_RESET_EXPIRY_HOURS } from '@sbrb/shared-constants';
import { PasswordReset } from './entities/password-reset.entity';
import { User } from './entities/user.entity';
import { MailService } from '../mail/mail.service';
import { RedisRateLimitService } from './redis-rate-limit.service';

const BCRYPT_ROUNDS = 12;
const FORGOT_KEY = (email: string) => `auth:forgot:${email}`;
const FORGOT_LIMIT = 3;
const FORGOT_TTL = 60 * 60; // 1 hour

@Injectable()
export class AuthPasswordService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(PasswordReset)
    private readonly resetRepo: Repository<PasswordReset>,
    private readonly mailService: MailService,
    private readonly redis: RedisRateLimitService,
    private readonly config: ConfigService,
  ) {}

  async forgotPassword(email: string): Promise<void> {
    const count = await this.redis.increment(FORGOT_KEY(email), FORGOT_TTL);
    if (count > FORGOT_LIMIT) {
      throw new HttpException('Too many password reset requests. Try again in 1 hour.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) return; // Silently no-op — no user enumeration

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_EXPIRY_HOURS);

    await this.resetRepo.save(this.resetRepo.create({ userId: user.id, token, expiresAt }));

    const feUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${feUrl}/auth/reset-password?token=${token}`;
    await this.mailService.sendPasswordReset(user.email, user.fullName, resetUrl);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this.resetRepo.findOne({ where: { token } });
    if (!record) throw new NotFoundException('Invalid reset token');
    if (record.usedAt) throw new BadRequestException('Token already used');
    if (record.expiresAt < new Date()) throw new BadRequestException('Token expired');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.userRepo.update(record.userId, { passwordHash });

    record.usedAt = new Date();
    await this.resetRepo.save(record);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.passwordHash) throw new BadRequestException('Cannot change password for OAuth accounts');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.userRepo.update(userId, { passwordHash });
  }
}
