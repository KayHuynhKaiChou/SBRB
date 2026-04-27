import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TBusinessRole } from '@sbrb/shared-constants';
import { AuditService } from '../audit/audit.service';
import { BusinessMember } from './entities/business-member.entity';

/** Member management operations — SRS 4.2.2 */
@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
    private readonly auditService: AuditService,
  ) {}

  async members(businessId: string, filter?: string): Promise<BusinessMember[]> {
    const where: Record<string, unknown> = { businessId };
    if (filter) where['status'] = filter;
    return this.memberRepo.find({ where, relations: ['user'] });
  }

  async changeMemberRole(
    businessId: string,
    adminId: string,
    targetUserId: string,
    role: TBusinessRole,
  ): Promise<BusinessMember> {
    const admin = await this.memberRepo.findOne({ where: { businessId, userId: adminId } });
    if (!admin || admin.role !== 'owner') {
      throw new ForbiddenException('Only owner can change member roles');
    }

    const target = await this.memberRepo.findOne({ where: { businessId, userId: targetUserId } });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'owner') throw new BadRequestException('Cannot change owner role');

    target.role = role;
    const updated = await this.memberRepo.save(target);

    await this.auditService.log({
      businessId,
      actorId: adminId,
      action: 'change_member_role',
      targetType: 'business_member',
      targetId: targetUserId,
    });

    return updated;
  }

  async removeMember(
    businessId: string,
    adminId: string,
    targetUserId: string,
  ): Promise<boolean> {
    const admin = await this.memberRepo.findOne({ where: { businessId, userId: adminId } });
    if (!admin) throw new ForbiddenException('Not a member of this business');

    const target = await this.memberRepo.findOne({ where: { businessId, userId: targetUserId } });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'owner') throw new BadRequestException('Cannot remove owner');

    const adminIsOwner = admin.role === 'owner';
    const adminIsManagerAndTargetSubordinate =
      admin.role === 'manager' && ['staff', 'viewer'].includes(target.role);

    if (!adminIsOwner && !adminIsManagerAndTargetSubordinate) {
      throw new ForbiddenException('Insufficient permissions to remove this member');
    }

    await this.memberRepo.delete(target.id);

    await this.auditService.log({
      businessId,
      actorId: adminId,
      action: 'remove_member',
      targetType: 'business_member',
      targetId: targetUserId,
    });

    return true;
  }

  async assignWidgets(
    businessId: string,
    adminId: string,
    targetUserId: string,
    widgetIds: string[],
  ): Promise<BusinessMember> {
    const admin = await this.memberRepo.findOne({ where: { businessId, userId: adminId } });
    if (!admin || !['owner', 'manager'].includes(admin.role)) {
      throw new ForbiddenException('Insufficient permissions to assign widgets');
    }

    const target = await this.memberRepo.findOne({ where: { businessId, userId: targetUserId } });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role !== 'staff') throw new BadRequestException('Can only assign widgets to staff');

    target.assignedWidgetIds = widgetIds;
    return this.memberRepo.save(target);
  }
}
