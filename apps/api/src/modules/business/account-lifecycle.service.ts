import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import {
  ACCOUNT_INVITE_EXPIRY_HOURS,
  EBusinessRole,
  EUserAccountStatus,
  type TBusinessRole,
} from '@sbrb/shared-constants';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { RedisRateLimitService } from '../auth/redis-rate-limit.service';
import { RefreshTokenService } from '../auth/refresh-token.service';
import { User } from '../auth/entities/user.entity';
import { Business } from './entities/business.entity';
import { BusinessInvitation } from './entities/business-invitation.entity';
import { BusinessMember } from './entities/business-member.entity';
import { BusinessMemberRowType } from './dto/business-member-row.type';
import { CreateStaffAccountDto } from './dto/create-staff-account.dto';
import { SetAccountPasswordDto } from './dto/set-account-password.dto';

const BCRYPT_ROUNDS = 12;
const MEMBER_LIMIT = 50;
const RESEND_KEY = (email: string) => `account:resend:${email}`;
const RESEND_LIMIT = 3;
const RESEND_TTL = 60 * 60; // 1 hour

/** Owner/manager-driven account lifecycle: create → set-password → resend/delete/toggle. */
@Injectable()
export class AccountLifecycleService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
    @InjectRepository(BusinessInvitation)
    private readonly invitationRepo: Repository<BusinessInvitation>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly redis: RedisRateLimitService,
    private readonly config: ConfigService,
  ) {}

  async createStaffAccount(
    businessId: string,
    inviterId: string,
    dto: CreateStaffAccountDto,
  ): Promise<BusinessMemberRowType> {
    const inviter = await this.assertCanManageRole(businessId, inviterId, dto.role);

    if (await this.userRepo.findOne({ where: { email: dto.email } })) {
      throw new ConflictException('Email already in use');
    }

    const memberCount = await this.memberRepo.count({ where: { businessId } });
    if (memberCount >= MEMBER_LIMIT) {
      throw new BadRequestException('Business member limit reached');
    }

    const user = await this.userRepo.save(
      this.userRepo.create({
        email: dto.email,
        fullName: dto.fullName,
        passwordHash: null,
        emailVerified: false,
        status: EUserAccountStatus.PENDING,
      }),
    );
    const member = await this.memberRepo.save(
      this.memberRepo.create({
        businessId,
        userId: user.id,
        role: dto.role,
        status: 'active',
        invitedBy: inviterId,
        assignedWidgetIds: [],
      }),
    );

    await this.issueInvite(businessId, inviterId, user, dto.role);
    await this.auditService.log({
      businessId,
      actorId: inviterId,
      action: 'create_account',
      targetType: 'user',
      targetId: user.id,
      targetName: user.email,
    });

    return this.toRow(user, member);
  }

  /** PUBLIC — invited account sets first password via emailed token. */
  async setAccountPassword(dto: SetAccountPasswordDto): Promise<boolean> {
    const invitation = await this.invitationRepo.findOne({ where: { token: dto.token } });
    if (!invitation || invitation.email !== dto.email) {
      throw new NotFoundException('Invalid invitation');
    }
    if (invitation.usedAt) throw new BadRequestException('Invitation already used');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('Invitation expired');

    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('Account not found');

    await this.userRepo.update(user.id, {
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      status: EUserAccountStatus.ACTIVE,
      emailVerified: true,
      statusChangedAt: new Date(),
    });
    invitation.usedAt = new Date();
    await this.invitationRepo.save(invitation);
    return true;
  }

  async resendAccountInvite(
    businessId: string,
    inviterId: string,
    userId: string,
  ): Promise<boolean> {
    const { user } = await this.assertCanManageTarget(businessId, inviterId, userId);
    if (user.status !== EUserAccountStatus.PENDING) {
      throw new BadRequestException('Account is not pending');
    }

    const count = await this.redis.increment(RESEND_KEY(user.email), RESEND_TTL);
    if (count > RESEND_LIMIT) {
      throw new HttpException('Too many resend requests. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    // Invalidate any outstanding invitations for this email before issuing a fresh one.
    await this.invitationRepo.update(
      { email: user.email, usedAt: IsNull() },
      { usedAt: new Date() },
    );
    const member = await this.memberRepo.findOne({ where: { businessId, userId } });
    await this.issueInvite(businessId, inviterId, user, (member?.role as TBusinessRole) ?? EBusinessRole.STAFF);
    return true;
  }

  async deletePendingAccount(
    businessId: string,
    inviterId: string,
    userId: string,
  ): Promise<boolean> {
    const { user } = await this.assertCanManageTarget(businessId, inviterId, userId);
    if (user.status !== EUserAccountStatus.PENDING) {
      throw new BadRequestException('Only pending accounts can be deleted');
    }

    await this.invitationRepo.delete({ email: user.email });
    await this.memberRepo.delete({ userId });
    await this.userRepo.delete(userId);

    await this.auditService.log({
      businessId,
      actorId: inviterId,
      action: 'delete_account',
      targetType: 'user',
      targetId: userId,
      targetName: user.email,
    });
    return true;
  }

  async setMemberAccountStatus(
    businessId: string,
    inviterId: string,
    userId: string,
    active: boolean,
  ): Promise<BusinessMemberRowType> {
    if (userId === inviterId) throw new BadRequestException('Cannot change your own status');
    const { user, member } = await this.assertCanManageTarget(businessId, inviterId, userId);
    if (user.status === EUserAccountStatus.PENDING) {
      throw new BadRequestException('Cannot change status of a pending account');
    }

    const status = active ? EUserAccountStatus.ACTIVE : EUserAccountStatus.INACTIVE;
    await this.userRepo.update(userId, { status, statusChangedAt: new Date() });
    if (!active) await this.refreshTokenService.revokeAllForUser(userId);

    await this.auditService.log({
      businessId,
      actorId: inviterId,
      action: active ? 'reactivate_account' : 'deactivate_account',
      targetType: 'user',
      targetId: userId,
      targetName: user.email,
    });
    return this.toRow({ ...user, status }, member);
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  /** Guard for create: inviter must be able to grant `targetRole`. */
  private async assertCanManageRole(
    businessId: string,
    inviterId: string,
    targetRole: TBusinessRole,
  ): Promise<BusinessMember> {
    const inviter = await this.memberRepo.findOne({ where: { businessId, userId: inviterId } });
    if (!inviter) throw new ForbiddenException('Not a member of this business');
    const canAny = inviter.role === EBusinessRole.OWNER;
    const canSub = inviter.role === EBusinessRole.MANAGER && targetRole === EBusinessRole.STAFF;
    if (!canAny && !canSub) throw new ForbiddenException('Insufficient role for this action');
    return inviter;
  }

  /** Guard for resend/delete/toggle: load target + check inviter may act on its role. */
  private async assertCanManageTarget(
    businessId: string,
    inviterId: string,
    userId: string,
  ): Promise<{ user: User; member: BusinessMember }> {
    const member = await this.memberRepo.findOne({ where: { businessId, userId } });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === EBusinessRole.OWNER) throw new ForbiddenException('Cannot act on the owner');
    await this.assertCanManageRole(businessId, inviterId, member.role as TBusinessRole);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Account not found');
    return { user, member };
  }

  /** Create a fresh invitation row + send the set-password email. */
  private async issueInvite(
    businessId: string,
    inviterId: string,
    user: User,
    role: TBusinessRole,
  ): Promise<void> {
    const token = `${crypto.randomBytes(3).toString('hex').toUpperCase()}-${uuid()}`;
    const expiresAt = new Date(Date.now() + ACCOUNT_INVITE_EXPIRY_HOURS * 60 * 60 * 1000);
    await this.invitationRepo.save(
      this.invitationRepo.create({ businessId, invitedBy: inviterId, email: user.email, role, token, expiresAt }),
    );

    const [inviter, business] = await Promise.all([
      this.userRepo.findOne({ where: { id: inviterId } }),
      this.businessRepo.findOne({ where: { id: businessId } }),
    ]);
    const feUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const setPasswordUrl = `${feUrl}/set-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    await this.mailService.sendAccountInvite(
      user.email,
      user.fullName,
      inviter?.fullName ?? 'Quản trị viên',
      business?.name ?? 'SBRB',
      role,
      setPasswordUrl,
    );
  }

  private toRow(user: User, member: BusinessMember): BusinessMemberRowType {
    return {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: member.role,
      status: user.status,
      joinedAt: member.joinedAt,
      lastLoginAt: user.lastLoginAt ?? null,
    };
  }
}
