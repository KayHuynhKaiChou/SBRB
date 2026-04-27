import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isManagerRole } from '@sbrb/shared-constants';
import { BusinessMember } from '../../modules/business/entities/business-member.entity';

/**
 * Shared authorization service — centralizes member/manager role checks
 * across all services (datasheet, widget, tab, widget-auth).
 * All checks enforce status: 'active' consistently.
 */
@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
  ) {}

  /**
   * Assert the user is an active member of the business.
   * Throws ForbiddenException if not a member or member is inactive.
   */
  async requireMember(businessId: string, userId: string): Promise<BusinessMember> {
    const member = await this.memberRepo.findOne({
      where: { businessId, userId, status: 'active' },
    });
    if (!member) {
      throw new ForbiddenException('Access denied to this business');
    }
    return member;
  }

  /**
   * Assert the user is an active manager or owner of the business.
   * Throws ForbiddenException if not a member, inactive, or insufficient role.
   */
  async requireManager(businessId: string, userId: string): Promise<BusinessMember> {
    const member = await this.requireMember(businessId, userId);
    if (!isManagerRole(member.role)) {
      throw new ForbiddenException('Manager role required');
    }
    return member;
  }
}
