import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { BusinessMember } from './entities/business-member.entity';

/** Business ownership/transfer operations — SRS 4.2 */
@Injectable()
export class BusinessOwnershipService {
  constructor(
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
    private readonly auditService: AuditService,
  ) {}

  async transferOwnership(
    businessId: string,
    ownerId: string,
    newOwnerId: string,
  ): Promise<void> {
    const ownerMember = await this.memberRepo.findOne({
      where: { businessId, userId: ownerId, role: 'owner' },
    });
    if (!ownerMember) {
      throw new NotFoundException('Business not found or you are not the owner');
    }

    const newOwnerMember = await this.memberRepo.findOne({
      where: { businessId, userId: newOwnerId, role: 'manager' },
    });
    if (!newOwnerMember) {
      throw new BadRequestException('Target user must be a manager of this business');
    }

    ownerMember.role = 'manager';
    newOwnerMember.role = 'owner';

    await this.memberRepo.save([ownerMember, newOwnerMember]);

    await this.auditService.log({
      businessId,
      actorId: ownerId,
      action: 'transfer_ownership',
      targetType: 'business_member',
      targetId: newOwnerId,
    });
  }
}
