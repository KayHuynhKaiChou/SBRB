import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../auth/entities/session.entity';
import { User } from '../auth/entities/user.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

/** User CRUD — SRS 4.1 user management */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
    @InjectRepository(RefreshToken) private readonly tokenRepo: Repository<RefreshToken>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    await this.userRepo.update(id, dto);
    return this.findById(id);
  }

  async getSessions(userId: string): Promise<Session[]> {
    return this.sessionRepo.find({ where: { userId }, order: { lastActiveAt: 'DESC' } });
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Session not found');
    // Revoke associated refresh token by user+session linkage (via device/ip)
    await this.tokenRepo.update(
      { userId, ipAddress: session.ipAddress ?? undefined },
      { revokedAt: new Date() },
    );
    await this.sessionRepo.delete(sessionId);
  }

  async deleteAccount(id: string): Promise<void> {
    await this.userRepo.delete(id);
  }
}
