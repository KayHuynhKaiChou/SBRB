import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import {
  EMAIL_VERIFY_OTP_LENGTH,
  EMAIL_VERIFY_OTP_EXPIRY_MINUTES,
} from '@sbrb/shared-constants';
import { EmailVerification } from './entities/email-verification.entity';
import { User } from './entities/user.entity';
import { MailService } from '../mail/mail.service';
import { RedisRateLimitService } from './redis-rate-limit.service';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 12;
const RESEND_KEY = (email: string) => `auth:resend:${email}`;
const RESEND_TTL = 60; // 1 minute

@Injectable()
export class AuthRegisterService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(EmailVerification)
    private readonly verifyRepo: Repository<EmailVerification>,
    private readonly mailService: MailService,
    private readonly redis: RedisRateLimitService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });

    if (exists) {
      // A verified account is a real conflict — tell the user to log in instead.
      if (exists.emailVerified) {
        throw new ConflictException('Email already registered');
      }
      // Unverified account = an abandoned signup. Let the user resume: refresh
      // their details + issue a new OTP rather than dead-ending on a conflict.
      exists.fullName = dto.fullName;
      exists.passwordHash = passwordHash;
      await this.userRepo.save(exists);
      await this.sendVerificationOtp(exists);
      return { message: 'Verification code sent' };
    }

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      emailVerified: false,
    });
    await this.userRepo.save(user);

    await this.sendVerificationOtp(user);
    return { message: 'Verification code sent' };
  }

  /**
   * Verify a 6-digit OTP for the given email. Marks the code used + flags the
   * account verified. Idempotent no-op if already verified.
   */
  async verifyEmailOtp(email: string, code: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Mã không hợp lệ hoặc đã hết hạn');
    if (user.emailVerified) return;

    const record = await this.verifyRepo.findOne({
      where: { userId: user.id, token: code, usedAt: IsNull() },
    });
    if (!record) throw new BadRequestException('Mã không hợp lệ hoặc đã hết hạn');
    if (record.expiresAt < new Date()) {
      throw new BadRequestException('Mã đã hết hạn, vui lòng gửi lại');
    }

    record.usedAt = new Date();
    await this.verifyRepo.save(record);
    await this.userRepo.update(user.id, { emailVerified: true });
  }

  async resendVerification(email: string): Promise<void> {
    const count = await this.redis.increment(RESEND_KEY(email), RESEND_TTL);
    if (count > 1) {
      throw new HttpException(
        'Please wait 60 seconds before resending',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || user.emailVerified) return; // Silent no-op — prevents enumeration

    await this.sendVerificationOtp(user);
  }

  /** Cryptographically-random zero-padded numeric OTP. */
  private generateOtp(): string {
    const max = 10 ** EMAIL_VERIFY_OTP_LENGTH;
    return randomInt(0, max).toString().padStart(EMAIL_VERIFY_OTP_LENGTH, '0');
  }

  /** Create a fresh OTP (invalidating earlier unused ones) and email it. */
  private async sendVerificationOtp(user: User): Promise<void> {
    // Only the latest code stays valid.
    await this.verifyRepo.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    const code = this.generateOtp();
    const expiresAt = new Date(
      Date.now() + EMAIL_VERIFY_OTP_EXPIRY_MINUTES * 60 * 1000,
    );

    const record = this.verifyRepo.create({ userId: user.id, token: code, expiresAt });
    await this.verifyRepo.save(record);

    await this.mailService.sendVerifyEmail(user.email, user.fullName, code);
  }
}
