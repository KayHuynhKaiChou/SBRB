import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  EBusinessStatus,
  EBusinessRole,
  EAdminBusinessSortBy,
  EAdminAuditAction,
} from '@sbrb/shared-constants';
import { Business } from '../business/entities/business.entity';
import { BusinessMember } from '../business/entities/business-member.entity';
import { Department } from '../department/entities/department.entity';
import { DepartmentMember } from '../department/entities/department-member.entity';
import { User } from '../auth/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import {
  ENotificationType,
  buildBusinessNotification,
} from '../notification/notification.events';
import { AvatarStorageService } from '../user/services/avatar-storage.service';
import { AdminBusinessFilterInput } from './dto/admin-business-filter.input';
import { AdminBusinessRowType } from './dto/admin-business-row.type';
import { AdminBusinessListResultType } from './dto/admin-business-list-result.type';
import { AdminBusinessMemberType } from './dto/admin-business-member.type';
import { AdminBusinessDetailType } from './dto/admin-business-detail.type';
import { PageInput } from '../../common/dto/page.input';

/** Raw row shape returned from QueryBuilder.getRawMany() */
interface IRawBusinessRow {
  b_id: string;
  b_name: string;
  b_industry: string;
  b_status: string;
  b_rejection_reason: string | null;
  b_created_at: Date;
  b_inactivated_at: Date | null;
  b_inactive_reason: string | null;
  owner_email: string;
  member_count: string; // Postgres returns numeric strings for aggregates
}

/** SELECT list shared by the data + single-row queries (keeps shapes in sync). */
const BUSINESS_ROW_SELECT = [
  'b.id AS b_id',
  'b.name AS b_name',
  'b.industry AS b_industry',
  'b.status AS b_status',
  'b.rejection_reason AS b_rejection_reason',
  'b.created_at AS b_created_at',
  'b.inactivated_at AS b_inactivated_at',
  'b.inactive_reason AS b_inactive_reason',
  'u.email AS owner_email',
  'COALESCE(mc.cnt, 0) AS member_count',
];

function toAdminBusinessRow(raw: IRawBusinessRow): AdminBusinessRowType {
  return {
    id: raw.b_id,
    name: raw.b_name,
    industry: raw.b_industry,
    ownerEmail: raw.owner_email ?? '',
    memberCount: parseInt(raw.member_count ?? '0', 10),
    status: raw.b_status,
    rejectionReason: raw.b_rejection_reason ?? null,
    inactivatedAt: raw.b_inactivated_at ?? null,
    inactiveReason: raw.b_inactive_reason ?? null,
    createdAt: raw.b_created_at,
  };
}

/** Admin-only service for cross-tenant business management — SRS §5.9, §5.10, §5.18 */
@Injectable()
export class AdminBusinessService {
  private readonly logger = new Logger(AdminBusinessService.name);

  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly storageService: AvatarStorageService,
    private readonly dataSource: DataSource,
  ) {}

  async listBusinesses(
    filter?: AdminBusinessFilterInput,
    page?: PageInput,
  ): Promise<AdminBusinessListResultType> {
    const limit = Math.min(page?.limit ?? 20, 100);
    const offset = page?.offset ?? 0;
    const sortBy = filter?.sortBy ?? EAdminBusinessSortBy.CREATED_AT;
    const sortOrder: 'ASC' | 'DESC' =
      filter?.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Shared filter builder — used by both the count and data queries.
    const addFilters = (qb: ReturnType<typeof this.businessRepo.createQueryBuilder>) => {
      if (filter?.status) {
        qb.andWhere('b.status = :status', { status: filter.status });
      }
      if (filter?.search) {
        // search requires the users join — added by each QB separately
        qb.andWhere('(b.name ILIKE :q OR u.email ILIKE :q)', {
          q: `%${filter.search}%`,
        });
      }
      return qb;
    };

    // COUNT query — lean SELECT COUNT(*) with only the joins needed for filter correctness.
    // Skip member-count aggregate join; it doesn't affect row count.
    const countQb = this.businessRepo.createQueryBuilder('b').leftJoin(User, 'u', 'u.id = b.owner_id');
    addFilters(countQb);
    const total = await countQb.getCount();

    // DATA query — full JOIN + SELECT for result rows.
    const dataQb = this.businessRepo
      .createQueryBuilder('b')
      .leftJoin(User, 'u', 'u.id = b.owner_id')
      .leftJoin(
        (subQb) =>
          subQb
            .from(BusinessMember, 'bm')
            .select('bm.business_id', 'business_id')
            .addSelect('COUNT(*)', 'cnt')
            .groupBy('bm.business_id'),
        'mc',
        'mc.business_id = b.id',
      )
      .select(BUSINESS_ROW_SELECT);

    addFilters(dataQb);

    // Resolve sort column
    const sortColumn =
      sortBy === EAdminBusinessSortBy.NAME
        ? 'b.name'
        : sortBy === EAdminBusinessSortBy.MEMBER_COUNT
          ? 'member_count'
          : 'b.created_at';

    dataQb.orderBy(sortColumn, sortOrder).offset(offset).limit(limit);

    const rows = await dataQb.getRawMany<IRawBusinessRow>();

    return { rows: rows.map(toAdminBusinessRow), total };
  }

  async inactivateBusiness(
    id: string,
    adminUserId: string,
    reason: string,
  ): Promise<AdminBusinessRowType> {
    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException(`Business ${id} not found`);
    if (business.status !== EBusinessStatus.APPROVED) {
      throw new ConflictException('Only an approved business can be deactivated');
    }

    await this.businessRepo.update(id, {
      status: EBusinessStatus.INACTIVE,
      inactivatedAt: new Date(),
      inactivatedBy: adminUserId,
      inactiveReason: reason,
    });

    // Audit log — wrapped in try/catch: audit failure must not break the mutation (SRS §5.18)
    try {
      await this.auditService.log({
        businessId: id,
        actorId: adminUserId,
        action: EAdminAuditAction.BUSINESS_INACTIVATE,
        targetType: 'business',
        targetId: id,
        targetName: business.name,
        metadata: { reason },
      });
    } catch (err) {
      this.logger.warn(`Audit log failed for inactivateBusiness(${id}): ${(err as Error).message}`);
    }

    this.safeNotifyOwner(business, ENotificationType.BUSINESS_INACTIVATED, reason);

    return this.fetchRow(id);
  }

  async reactivateBusiness(
    id: string,
    adminUserId: string,
  ): Promise<AdminBusinessRowType> {
    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException(`Business ${id} not found`);
    if (business.status !== EBusinessStatus.INACTIVE) {
      throw new ConflictException('Only an inactive business can be reactivated');
    }

    await this.businessRepo.update(id, {
      status: EBusinessStatus.APPROVED,
      inactivatedAt: null,
      inactivatedBy: null,
      inactiveReason: null,
    });

    try {
      await this.auditService.log({
        businessId: id,
        actorId: adminUserId,
        action: EAdminAuditAction.BUSINESS_REACTIVATE,
        targetType: 'business',
        targetId: id,
        targetName: business.name,
        metadata: {},
      });
    } catch (err) {
      this.logger.warn(`Audit log failed for reactivateBusiness(${id}): ${(err as Error).message}`);
    }

    this.safeNotifyOwner(business, ENotificationType.BUSINESS_REACTIVATED);

    return this.fetchRow(id);
  }

  /**
   * List all business_members for a business, joined with user info.
   * Returns [{ userId, fullName, email, role }]. NotFound if business missing.
   */
  async listBusinessMembers(businessId: string): Promise<AdminBusinessMemberType[]> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException(`Business ${businessId} not found`);

    const rows = await this.memberRepo
      .createQueryBuilder('bm')
      .innerJoin(User, 'u', 'u.id = bm.user_id')
      .select([
        'bm.user_id AS user_id',
        'u.full_name AS full_name',
        'u.email AS email',
        'bm.role AS role',
      ])
      .where('bm.business_id = :businessId', { businessId })
      .getRawMany<{ user_id: string; full_name: string; email: string; role: string }>();

    return rows.map((r) => ({
      userId: r.user_id,
      fullName: r.full_name,
      email: r.email,
      role: r.role,
    }));
  }

  /**
   * Transfer business ownership to an existing member.
   *
   * Transaction steps:
   *   a. Demote all current `owner` business_members → `manager`.
   *   b. Promote newOwner business_member → `owner`.
   *   c. Set business.ownerId = newOwnerUserId.
   *   d. Reassign root department head: demote current manager, promote newOwner.
   *
   * Audit log is written after the transaction; failure there does NOT roll back.
   */
  async changeOwner(
    businessId: string,
    newOwnerUserId: string,
    adminId: string,
  ): Promise<AdminBusinessRowType> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException(`Business ${businessId} not found`);

    // newOwner MUST already be a business_member
    const newOwnerMember = await this.memberRepo.findOne({
      where: { businessId, userId: newOwnerUserId },
    });
    if (!newOwnerMember) {
      throw new BadRequestException({
        message: {
          vi: 'Người dùng phải là thành viên của doanh nghiệp trước khi trở thành chủ sở hữu',
          en: 'User must be a member of the business before becoming the owner',
        },
      });
    }

    const fromUserId = business.ownerId;

    await this.dataSource.transaction(async (manager) => {
      const bmRepo = manager.getRepository(BusinessMember);
      const bizRepo = manager.getRepository(Business);
      const deptRepo = manager.getRepository(Department);
      const deptMemberRepo = manager.getRepository(DepartmentMember);

      // a. Demote all current owners → manager
      await bmRepo
        .createQueryBuilder()
        .update(BusinessMember)
        .set({ role: EBusinessRole.MANAGER })
        .where('business_id = :businessId AND role = :role', {
          businessId,
          role: EBusinessRole.OWNER,
        })
        .execute();

      // b. Promote newOwner → owner
      await bmRepo
        .createQueryBuilder()
        .update(BusinessMember)
        .set({ role: EBusinessRole.OWNER })
        .where('business_id = :businessId AND user_id = :userId', {
          businessId,
          userId: newOwnerUserId,
        })
        .execute();

      // c. Update business.ownerId
      await bizRepo.update(businessId, { ownerId: newOwnerUserId });

      // d. Reassign root department head
      // Find root department: prefer isRoot=true, fallback to parentId IS NULL
      const rootDept = await deptRepo
        .createQueryBuilder('d')
        .where('d.business_id = :businessId', { businessId })
        .andWhere('d.is_root = true OR d.parent_id IS NULL')
        .orderBy('d.is_root', 'DESC') // true first
        .getOne();

      if (rootDept) {
        // Demote current manager(s) of root dept
        await deptMemberRepo
          .createQueryBuilder()
          .update(DepartmentMember)
          .set({ isManager: false })
          .where('department_id = :deptId AND is_manager = true', { deptId: rootDept.id })
          .execute();

        // Promote newOwner as root dept manager
        const existing = await deptMemberRepo.findOne({
          where: { departmentId: rootDept.id, userId: newOwnerUserId },
        });
        if (existing) {
          await deptMemberRepo.update(
            { departmentId: rootDept.id, userId: newOwnerUserId },
            { isManager: true },
          );
        } else {
          await deptMemberRepo.save({
            departmentId: rootDept.id,
            userId: newOwnerUserId,
            isManager: true,
          });
        }
      }
    });

    // Audit log — failure must NOT roll back the ownership transfer
    try {
      await this.auditService.log({
        businessId,
        actorId: adminId,
        action: EAdminAuditAction.BUSINESS_CHANGE_OWNER,
        targetType: 'business',
        targetId: businessId,
        targetName: business.name,
        metadata: { fromUserId, toUserId: newOwnerUserId },
      });
    } catch (err) {
      this.logger.warn(`Audit log failed for changeOwner(${businessId}): ${(err as Error).message}`);
    }

    return this.fetchRow(businessId);
  }

  /** Re-fetch a single business row with joins for return value. */
  private async fetchRow(id: string): Promise<AdminBusinessRowType> {
    const qb = this.businessRepo
      .createQueryBuilder('b')
      .leftJoin(User, 'u', 'u.id = b.owner_id')
      .leftJoin(
        (subQb) =>
          subQb
            .from(BusinessMember, 'bm')
            .select('bm.business_id', 'business_id')
            .addSelect('COUNT(*)', 'cnt')
            .groupBy('bm.business_id'),
        'mc',
        'mc.business_id = b.id',
      )
      .select(BUSINESS_ROW_SELECT)
      .where('b.id = :id', { id });

    const row = await qb.getRawOne<IRawBusinessRow>();
    if (!row) throw new NotFoundException(`Business ${id} not found`);
    return toAdminBusinessRow(row);
  }

  /** Full business detail for the admin review drawer (KYB + owner + signed licence URL). */
  async getBusinessDetail(id: string): Promise<AdminBusinessDetailType> {
    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException(`Business ${id} not found`);

    const owner = await this.userRepo.findOne({ where: { id: business.ownerId } });
    const memberCount = await this.memberRepo.count({ where: { businessId: id } });
    const licenseSignedUrl = await this.storageService.createSignedReadUrl(
      'license',
      business.licenseFileUrl,
    );

    return {
      id: business.id,
      name: business.name,
      industry: business.industry,
      currency: business.currency,
      status: business.status,
      rejectionReason: business.rejectionReason ?? null,
      memberCount,
      legalName: business.legalName ?? null,
      taxCode: business.taxCode ?? null,
      businessType: business.businessType ?? null,
      address: business.address ?? null,
      contactPhone: business.contactPhone ?? null,
      contactEmail: business.contactEmail ?? null,
      website: business.website ?? null,
      description: business.description ?? null,
      logoUrl: business.logoUrl ?? null,
      bannerUrl: business.bannerUrl ?? null,
      licenseSignedUrl,
      foundedYear: business.foundedYear ?? null,
      companySize: business.companySize ?? null,
      createdAt: business.createdAt,
      owner: {
        id: owner?.id ?? business.ownerId,
        fullName: owner?.fullName ?? '',
        email: owner?.email ?? '',
        phone: owner?.phone ?? null,
        avatarUrl: owner?.avatarUrl ?? null,
      },
    };
  }

  /** Admin approves a pending/rejected business → approved + usable. */
  async approveBusiness(id: string, adminId: string): Promise<AdminBusinessRowType> {
    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException(`Business ${id} not found`);
    // A rejected business CANNOT be approved directly — the owner must amend it first
    // (which moves it to `resubmitted`). Only pending/resubmitted are approvable.
    if (
      business.status !== EBusinessStatus.PENDING &&
      business.status !== EBusinessStatus.RESUBMITTED
    ) {
      throw new ConflictException('Only a pending or resubmitted business can be approved');
    }

    await this.businessRepo.update(id, {
      status: EBusinessStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: adminId,
      rejectionReason: null,
      rejectedAt: null,
      rejectedBy: null,
    });

    this.safeAudit(adminId, business, EAdminAuditAction.BUSINESS_APPROVE, {});
    this.safeNotifyOwner(business, ENotificationType.BUSINESS_APPROVED);

    return this.fetchRow(id);
  }

  /** Admin rejects a business with a required reason → owner edits + resubmits. */
  async rejectBusiness(
    id: string,
    adminId: string,
    reason: string,
  ): Promise<AdminBusinessRowType> {
    if (!reason?.trim()) {
      throw new BadRequestException('A rejection reason is required');
    }
    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException(`Business ${id} not found`);
    if (
      business.status !== EBusinessStatus.PENDING &&
      business.status !== EBusinessStatus.RESUBMITTED
    ) {
      throw new ConflictException('Only a pending or resubmitted business can be rejected');
    }

    await this.businessRepo.update(id, {
      status: EBusinessStatus.REJECTED,
      rejectionReason: reason,
      rejectedAt: new Date(),
      rejectedBy: adminId,
    });

    this.safeAudit(adminId, business, EAdminAuditAction.BUSINESS_REJECT, { reason });
    this.safeNotifyOwner(business, ENotificationType.BUSINESS_REJECTED, reason);

    return this.fetchRow(id);
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
    reason?: string,
  ): void {
    void this.notificationService
      .notifyUser(
        business.ownerId,
        buildBusinessNotification(type, {
          businessId: business.id,
          businessName: business.name,
          reason,
        }),
      )
      .catch((err: Error) =>
        this.logger.warn(`notifyUser(${type}) failed: ${err.message}`),
      );
  }
}
