import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { EMAIL_VERIFY_LINK_EXPIRY_HOURS } from '@sbrb/shared-constants';
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
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      emailVerified: false,
    });
    await this.userRepo.save(user);

    await this.sendVerificationEmail(user);
    return { message: 'Verification email sent' };
  }

  async verifyEmail(token: string): Promise<void> {
    const record = await this.verifyRepo.findOne({
      where: { token },
      relations: ['user'],
    });
    if (!record) throw new NotFoundException('Invalid verification token');
    if (record.usedAt) throw new BadRequestException('Token already used');
    if (record.expiresAt < new Date()) throw new BadRequestException('Token expired');

    record.usedAt = new Date();
    await this.verifyRepo.save(record);

    await this.userRepo.update(record.userId, { emailVerified: true });
  }

  async resendVerification(email: string): Promise<void> {
    const count = await this.redis.increment(RESEND_KEY(email), RESEND_TTL);
    if (count > 1) throw new HttpException('Please wait 60 seconds before resending', HttpStatus.TOO_MANY_REQUESTS);

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || user.emailVerified) return; // Silently no-op to prevent enumeration

    await this.sendVerificationEmail(user);
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFY_LINK_EXPIRY_HOURS);

    const record = this.verifyRepo.create({ userId: user.id, token, expiresAt });
    await this.verifyRepo.save(record);

    const feUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const verifyUrl = `${feUrl}/auth/verify-email?token=${token}`;
    await this.mailService.sendVerifyEmail(user.email, user.fullName, verifyUrl);
  }
}
