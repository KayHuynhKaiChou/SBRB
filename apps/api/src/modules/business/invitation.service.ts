import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { BusinessInvitation } from './entities/business-invitation.entity';
import { BusinessMember } from './entities/business-member.entity';
import { User } from '../auth/entities/user.entity';
import { InviteMemberDto } from './dto/invite-member.dto';

/** Invitation operations — SRS 4.2.2 */
@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(BusinessInvitation)
    private readonly invitationRepo: Repository<BusinessInvitation>,
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {}

  async invite(businessId: string, inviterId: string, dto: InviteMemberDto): Promise<BusinessInvitation> {
    const inviter = await this.memberRepo.findOne({ where: { businessId, userId: inviterId } });
    if (!inviter) throw new ForbiddenException('Not a member of this business');

    const canInviteAny = inviter.role === 'owner';
    const canInviteSubordinate = inviter.role === 'manager' && ['staff'].includes(dto.role);
    if (!canInviteAny && !canInviteSubordinate) {
      throw new ForbiddenException('Insufficient role to invite this member role');
    }

    const memberCount = await this.memberRepo.count({
      where: [{ businessId, status: 'active' }, { businessId, status: 'invited' }],
    });
    if (memberCount >= 50) {
      throw new BadRequestException('Business member limit reached');
    }

    const token = `${crypto.randomBytes(3).toString('hex').toUpperCase()}-${uuid()}`;
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existingUser) {
      const existing = await this.memberRepo.findOne({
        where: { businessId, userId: existingUser.id },
      });
      if (!existing) {
        const member = this.memberRepo.create({
          businessId,
          userId: existingUser.id,
          role: dto.role,
          status: 'invited',
          assignedWidgetIds: [],
        });
        await this.memberRepo.save(member);
      }
    }

    const invitation = this.invitationRepo.create({
      businessId,
      invitedBy: inviterId,
      email: dto.email,
      role: dto.role,
      token,
      expiresAt,
    });
    const saved = await this.invitationRepo.save(invitation);

    await this.mailService.sendBusinessInvite(dto.email, inviterId, businessId, dto.role, token);
    await this.auditService.log({
      businessId,
      actorId: inviterId,
      action: 'invite_member',
      targetType: 'business_invitation',
      targetId: saved.id,
    });

    return saved;
  }

  async acceptInvitation(token: string, userId: string): Promise<BusinessMember> {
    const invitation = await this.invitationRepo.findOne({ where: { token } });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('Invitation expired');
    if (invitation.usedAt !== null) throw new BadRequestException('Invitation already used');

    const member = await this.memberRepo.findOne({
      where: { businessId: invitation.businessId, userId },
    });
    if (!member) throw new NotFoundException('Member record not found');

    member.status = 'active';
    invitation.usedAt = new Date();

    await this.memberRepo.save(member);
    await this.invitationRepo.save(invitation);

    await this.auditService.log({
      businessId: invitation.businessId,
      actorId: userId,
      action: 'accept_invite',
      targetType: 'business_invitation',
      targetId: invitation.id,
    });

    return member;
  }

  async declineInvitation(token: string, userId: string): Promise<boolean> {
    const invitation = await this.invitationRepo.findOne({ where: { token } });
    if (!invitation) throw new NotFoundException('Invitation not found');

    await this.invitationRepo.delete(invitation.id);

    const member = await this.memberRepo.findOne({
      where: { businessId: invitation.businessId, userId, status: 'invited' },
    });
    if (member) await this.memberRepo.delete(member.id);

    return true;
  }

  async cancelInvitation(businessId: string, invitationId: string, adminId: string): Promise<boolean> {
    const admin = await this.memberRepo.findOne({ where: { businessId, userId: adminId } });
    if (!admin || !['owner', 'manager'].includes(admin.role)) {
      throw new ForbiddenException('Insufficient permissions to cancel invitations');
    }

    const invitation = await this.invitationRepo.findOne({ where: { id: invitationId, businessId } });
    if (!invitation) throw new NotFoundException('Invitation not found');

    await this.invitationRepo.delete(invitation.id);
    return true;
  }

  async pendingInvitations(businessId: string): Promise<BusinessInvitation[]> {
    return this.invitationRepo.find({ where: { businessId } });
  }
}
