import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  EBusinessStatus,
  EBusinessChangeRequestStatus,
  EAdminAuditAction,
} from '@sbrb/shared-constants';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import {
  ENotificationType,
  buildBusinessNotification,
} from '../notification/notification.events';
import { Business } from './entities/business.entity';
import { BusinessMember } from './entities/business-member.entity';
import { BusinessChangeRequest } from './entities/business-change-request.entity';
import { UpdateBusinessDto } from './dto/update-business.dto';

/** Business KYB/profile fields an owner may request to change after approval. */
const CHANGEABLE_FIELDS: (keyof Business)[] = [
  'name',
  'industry',
  'currency',
  'legalName',
  'taxCode',
  'businessType',
  'address',
  'contactPhone',
  'contactEmail',
  'website',
  'description',
  'foundedYear',
  'companySize',
  'logoUrl',
  'bannerUrl',
  'licenseFileUrl',
];

/**
 * Owner change-requests on an APPROVED business + admin review of them.
 * Live `businesses` row only mutates when admin approves (docs/business-approval-rules.md §5).
 */
@Injectable()
export class BusinessChangeRequestService {
  private readonly logger = new Logger(BusinessChangeRequestService.name);

  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
    @InjectRepository(BusinessChangeRequest)
    private readonly changeRepo: Repository<BusinessChangeRequest>,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
  ) {}

  private async assertOwner(businessId: string, userId: string): Promise<Business> {
    const member = await this.memberRepo.findOne({
      where: { businessId, userId, role: 'owner' },
    });
    if (!member) {
      throw new ForbiddenException('Only the business owner can perform this action');
    }
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  /** Compute { field: {old,new} } for only the fields the owner actually changed. */
  private buildDiff(
    business: Business,
    dto: UpdateBusinessDto,
  ): Record<string, { old: unknown; new: unknown }> {
    const diff: Record<string, { old: unknown; new: unknown }> = {};
    const businessRecord = business as unknown as Record<string, unknown>;
    const dtoRecord = dto as unknown as Record<string, unknown>;
    for (const key of CHANGEABLE_FIELDS) {
      const incoming = dtoRecord[key as string];
      if (incoming === undefined) continue;
      const current = businessRecord[key as string] ?? null;
      const next = incoming ?? null;
      if (current !== next) {
        diff[key as string] = { old: current, new: next };
      }
    }
    return diff;
  }

  /**
   * Owner submits a change to an approved business. Creates or replaces the single
   * open (pending) change-request. Live data is NOT touched.
   */
  async requestChange(
    businessId: string,
    userId: string,
    dto: UpdateBusinessDto,
  ): Promise<BusinessChangeRequest> {
    const business = await this.assertOwner(businessId, userId);

    if (business.status !== EBusinessStatus.APPROVED) {
      throw new BadRequestException(
        'Change-requests only apply to approved businesses. Edit directly while pending/rejected.',
      );
    }

    const diff = this.buildDiff(business, dto);
    if (Object.keys(diff).length === 0) {
      throw new BadRequestException('No changes detected');
    }

    // Upsert the single open request (KISS — at most one pending per business).
    let request = await this.changeRepo.findOne({
      where: { businessId, status: EBusinessChangeRequestStatus.PENDING },
    });
    if (request) {
      request.changes = diff;
      request.requestedBy = userId;
    } else {
      request = this.changeRepo.create({
        businessId,
        requestedBy: userId,
        status: EBusinessChangeRequestStatus.PENDING,
        changes: diff,
      });
    }
    const saved = await this.changeRepo.save(request);

    // Notify all platform admins (non-blocking).
    try {
      await this.notificationService.notifyAdmins(
        buildBusinessNotification(ENotificationType.BUSINESS_CHANGE_SUBMITTED, {
          businessId,
          businessName: business.name,
          changeRequestId: saved.id,
        }),
      );
    } catch (err) {
      this.logger.warn(`notifyAdmins(change_submitted) failed: ${(err as Error).message}`);
    }

    return saved;
  }

  /** The owner's currently-open change-request, if any. */
  async getOpenRequest(
    businessId: string,
    userId: string,
  ): Promise<BusinessChangeRequest | null> {
    await this.assertOwner(businessId, userId);
    return this.changeRepo.findOne({
      where: { businessId, status: EBusinessChangeRequestStatus.PENDING },
    });
  }

  /** Admin: list pending change-requests (optionally for one business). */
  async listPending(businessId?: string): Promise<BusinessChangeRequest[]> {
    return this.changeRepo.find({
      where: {
        status: EBusinessChangeRequestStatus.PENDING,
        ...(businessId ? { businessId } : {}),
      },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Admin: pending change-requests enriched with business name + requester email
   * for the review surface.
   */
  async listPendingForAdmin(businessId?: string): Promise<
    Array<{
      id: string;
      businessId: string;
      businessName: string;
      requestedByEmail: string;
      status: string;
      changes: Record<string, { old: unknown; new: unknown }>;
      createdAt: Date;
    }>
  > {
    const qb = this.changeRepo
      .createQueryBuilder('cr')
      .innerJoin(Business, 'b', 'b.id = cr.business_id')
      .leftJoin('users', 'u', 'u.id = cr.requested_by')
      .where('cr.status = :status', { status: EBusinessChangeRequestStatus.PENDING })
      .select([
        'cr.id AS id',
        'cr.business_id AS "businessId"',
        'b.name AS "businessName"',
        'u.email AS "requestedByEmail"',
        'cr.status AS status',
        'cr.changes AS changes',
        'cr.created_at AS "createdAt"',
      ])
      .orderBy('cr.created_at', 'ASC');

    if (businessId) {
      qb.andWhere('cr.business_id = :businessId', { businessId });
    }

    return qb.getRawMany();
  }

  /** Admin approves: apply the diff onto the live business row in one transaction. */
  async approve(requestId: string, adminId: string): Promise<BusinessChangeRequest> {
    const request = await this.changeRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Change request not found');
    if (request.status !== EBusinessChangeRequestStatus.PENDING) {
      throw new BadRequestException('Change request already reviewed');
    }

    const business = await this.businessRepo.findOne({ where: { id: request.businessId } });
    if (!business) throw new NotFoundException('Business not found');

    await this.dataSource.transaction(async (manager) => {
      const bizRepo = manager.getRepository(Business);
      const reqRepo = manager.getRepository(BusinessChangeRequest);

      const patch: Record<string, unknown> = {};
      for (const [field, change] of Object.entries(request.changes)) {
        patch[field] = change.new ?? null;
      }
      await bizRepo.update(request.businessId, patch);

      request.status = EBusinessChangeRequestStatus.APPROVED;
      request.reviewedAt = new Date();
      request.reviewedBy = adminId;
      await reqRepo.save(request);
    });

    this.safeAudit(adminId, business, EAdminAuditAction.BUSINESS_CHANGE_APPROVE, {
      changeRequestId: requestId,
    });
    this.safeNotifyOwner(
      business,
      ENotificationType.BUSINESS_CHANGE_APPROVED,
      requestId,
    );

    return request;
  }

  /** Admin rejects: keep live data, store reason, notify owner. */
  async reject(
    requestId: string,
    adminId: string,
    reason: string,
  ): Promise<BusinessChangeRequest> {
    if (!reason?.trim()) {
      throw new BadRequestException('A rejection reason is required');
    }
    const request = await this.changeRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Change request not found');
    if (request.status !== EBusinessChangeRequestStatus.PENDING) {
      throw new BadRequestException('Change request already reviewed');
    }

    request.status = EBusinessChangeRequestStatus.REJECTED;
    request.reviewReason = reason;
    request.reviewedAt = new Date();
    request.reviewedBy = adminId;
    const saved = await this.changeRepo.save(request);

    const business = await this.businessRepo.findOne({ where: { id: request.businessId } });
    if (business) {
      this.safeAudit(adminId, business, EAdminAuditAction.BUSINESS_CHANGE_REJECT, {
        changeRequestId: requestId,
        reason,
      });
      this.safeNotifyOwner(
        business,
        ENotificationType.BUSINESS_CHANGE_REJECTED,
        requestId,
        reason,
      );
    }

    return saved;
  }

  private safeAudit(
    adminId: string,
    business: Business,
    action: EAdminAuditAction,
    metadata: Record<string, unknown>,
  ): void {
    void this.auditService
      .log({
        businessId: business.id,
        actorId: adminId,
        action,
        targetType: 'business',
        targetId: business.id,
        targetName: business.name,
        metadata,
      })
      .catch((err: Error) =>
        this.logger.warn(`Audit log failed (${action}): ${err.message}`),
      );
  }

  private safeNotifyOwner(
    business: Business,
    type: ENotificationType,
    changeRequestId: string,
    reason?: string,
  ): void {
    void this.notificationService
      .notifyUser(
        business.ownerId,
        buildBusinessNotification(type, {
          businessId: business.id,
          businessName: business.name,
          changeRequestId,
          reason,
        }),
      )
      .catch((err: Error) =>
        this.logger.warn(`notifyUser(${type}) failed: ${err.message}`),
      );
  }
}
