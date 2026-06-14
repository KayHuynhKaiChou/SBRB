import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EBusinessStatus } from '@sbrb/shared-constants';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import {
  ENotificationType,
  buildBusinessNotification,
} from '../notification/notification.events';
import { Department } from '../department/entities/department.entity';
import { DepartmentMember } from '../department/entities/department-member.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from './entities/business.entity';
import { BusinessMember } from './entities/business-member.entity';

const BOD_DEFAULT_NAME = 'Ban giám đốc';

/**
 * KYB/profile fields that, once a business is APPROVED, may only be changed via an
 * admin-reviewed change-request (not a live update). Operational/canvas fields
 * (snapGrid, canvasWidth/Height, weekStart, logoUrl-for-settings) stay live-editable.
 */
const APPROVED_LOCKED_FIELDS = [
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
  'bannerUrl',
  'licenseFileUrl',
] as const;

/** Business CRUD operations — SRS 4.2 */
@Injectable()
export class BusinessCrudService {
  private readonly logger = new Logger(BusinessCrudService.name);

  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    @InjectRepository(DepartmentMember)
    private readonly deptMemberRepo: Repository<DepartmentMember>,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  /** Notify all platform admins about a business event (submitted / resubmitted), non-blocking. */
  private notifyAdmins(business: Business, type: ENotificationType): void {
    void this.notificationService
      .notifyAdmins(
        buildBusinessNotification(type, {
          businessId: business.id,
          businessName: business.name,
        }),
      )
      .catch((err: Error) => this.logger.warn(`notifyAdmins(${type}) failed: ${err.message}`));
  }

  async create(userId: string, dto: CreateBusinessDto): Promise<Business> {
    const ownerCount = await this.memberRepo.count({
      where: { userId, role: 'owner' },
    });
    if (ownerCount >= 3) {
      throw new BadRequestException('You can own at most 3 businesses');
    }

    // New businesses start in PENDING — an admin must approve before features unlock.
    // (Migration backfills existing rows to 'approved'; only fresh creates are pending.)
    const business = this.businessRepo.create({
      name: dto.name,
      industry: dto.industry ?? 'Other',
      currency: dto.currency ?? 'VND',
      ownerId: userId,
      status: EBusinessStatus.PENDING,
      legalName: dto.legalName ?? null,
      taxCode: dto.taxCode ?? null,
      businessType: dto.businessType ?? null,
      address: dto.address ?? null,
      contactPhone: dto.contactPhone ?? null,
      contactEmail: dto.contactEmail ?? null,
      website: dto.website ?? null,
      description: dto.description ?? null,
      foundedYear: dto.foundedYear ?? null,
      companySize: dto.companySize ?? null,
      logoUrl: dto.logoUrl ?? null,
      bannerUrl: dto.bannerUrl ?? null,
      licenseFileUrl: dto.licenseFileUrl ?? null,
    });
    const saved = await this.businessRepo.save(business);

    const member = this.memberRepo.create({
      businessId: saved.id,
      userId,
      role: 'owner',
      status: 'active',
    });
    await this.memberRepo.save(member);

    // Auto-seed BOD root department + assign owner as manager (B12, SRS §4.1)
    const bod = await this.deptRepo.save({
      businessId: saved.id,
      parentId: null,
      name: BOD_DEFAULT_NAME,
      isRoot: true,
    });
    await this.deptMemberRepo.save({
      departmentId: bod.id,
      userId,
      isManager: true,
    });

    await this.auditService.log({
      businessId: saved.id,
      actorId: userId,
      action: 'create_business',
      targetType: 'business',
      targetId: saved.id,
      targetName: saved.name,
    });

    this.notifyAdmins(saved, ENotificationType.BUSINESS_SUBMITTED);

    return saved;
  }

  async findById(id: string, userId: string): Promise<Business> {
    const member = await this.memberRepo.findOne({
      where: { businessId: id, userId },
    });
    if (!member) throw new NotFoundException('Business not found or access denied');

    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async findMyBusinesses(userId: string): Promise<Business[]> {
    const members = await this.memberRepo.find({ where: { userId } });
    if (!members.length) return [];
    const ids = members.map((m) => m.businessId);
    return this.businessRepo
      .createQueryBuilder('b')
      .where('b.id IN (:...ids)', { ids })
      .getMany();
  }

  async update(id: string, userId: string, dto: UpdateBusinessDto): Promise<Business> {
    const member = await this.memberRepo.findOne({
      where: { businessId: id, userId, role: 'owner' },
    });
    if (!member) throw new NotFoundException('Business not found or insufficient permissions');

    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');

    // Once approved, KYB/profile fields are change-request-gated (admin must approve).
    // Live update only applies them while pending/rejected. Operational fields always OK.
    if (business.status === EBusinessStatus.APPROVED) {
      const touchedLocked = APPROVED_LOCKED_FIELDS.filter(
        (f) => (dto as Record<string, unknown>)[f] !== undefined,
      );
      if (touchedLocked.length > 0) {
        throw new BadRequestException(
          'These fields require admin approval — submit a change-request instead.',
        );
      }
    }

    // Owner editing a REJECTED business = "fixed the admin's reason" → moves to RESUBMITTED
    // (awaits re-review). Other statuses keep their value (live edit while pending/resubmitted).
    const wasRejected = business.status === EBusinessStatus.REJECTED;

    // ValidationPipe strips unknown keys + `exposeUnsetFields: false` keeps only
    // fields the client actually sent. Direct merge — DTO is already clean.
    Object.assign(business, dto);
    if (wasRejected) business.status = EBusinessStatus.RESUBMITTED;

    const updated = await this.businessRepo.save(business);

    await this.auditService.log({
      businessId: id,
      actorId: userId,
      action: 'update_business',
      targetType: 'business',
      targetId: id,
      targetName: updated.name,
    });

    if (wasRejected) this.notifyAdmins(updated, ENotificationType.BUSINESS_RESUBMITTED);

    return updated;
  }

  /**
   * Owner resubmits a rejected (or pending) business for admin review.
   * Flips rejected → pending and clears the rejection reason. Owner-gated.
   */
  async submitForReview(id: string, userId: string): Promise<Business> {
    const member = await this.memberRepo.findOne({
      where: { businessId: id, userId, role: 'owner' },
    });
    if (!member) throw new NotFoundException('Business not found or insufficient permissions');

    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');

    if (
      business.status !== EBusinessStatus.PENDING &&
      business.status !== EBusinessStatus.REJECTED
    ) {
      throw new BadRequestException('Only a pending or rejected business can be submitted for review');
    }

    business.status = EBusinessStatus.PENDING;
    business.rejectionReason = null;
    const saved = await this.businessRepo.save(business);

    this.notifyAdmins(saved, ENotificationType.BUSINESS_SUBMITTED);

    return saved;
  }

  async delete(id: string, userId: string, confirmName: string): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { businessId: id, userId, role: 'owner' },
    });
    if (!member) throw new NotFoundException('Business not found or insufficient permissions');

    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');

    if (confirmName !== business.name) {
      throw new BadRequestException('Name confirmation does not match');
    }

    await this.auditService.log({
      businessId: id,
      actorId: userId,
      action: 'delete_business',
      targetType: 'business',
      targetId: id,
      targetName: business.name,
    });

    await this.businessRepo.delete(id);
  }
}
