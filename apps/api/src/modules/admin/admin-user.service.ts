import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EAdminUserSortBy, EAdminAuditAction } from '@sbrb/shared-constants';
import { User } from '../auth/entities/user.entity';
import { BusinessMember } from '../business/entities/business-member.entity';
import { Business } from '../business/entities/business.entity';
import { RefreshTokenService } from '../auth/refresh-token.service';
import { AuditService } from '../audit/audit.service';
import { PageInput } from '../../common/dto/page.input';
import { AdminUserFilterInput } from './dto/admin-user-filter.input';
import { AdminUserRowType } from './dto/admin-user-row.type';
import { AdminUserListResultType } from './dto/admin-user-list-result.type';
import { AdminUserDetailType, AdminUserBusinessMembershipType } from './dto/admin-user-detail.type';

interface IRawUserRow {
  u_id: string;
  u_email: string;
  u_full_name: string;
  u_platform_role: string | null;
  u_is_disabled: boolean;
  u_last_login_at: Date | null;
  u_created_at: Date;
  business_count: string;
  business_names: string | null;
}

function toAdminUserRow(raw: IRawUserRow): AdminUserRowType {
  return {
    id: raw.u_id,
    email: raw.u_email,
    fullName: raw.u_full_name,
    platformRole: raw.u_platform_role ?? null,
    isDisabled: raw.u_is_disabled,
    businessCount: parseInt(raw.business_count ?? '0', 10),
    businessNames: raw.business_names ?? null,
    lastLoginAt: raw.u_last_login_at ?? null,
    createdAt: raw.u_created_at,
  };
}

/** Admin-only service for cross-tenant user management. SRS §5.9, §5.10, §5.11 */
@Injectable()
export class AdminUserService {
  private readonly logger = new Logger(AdminUserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly auditService: AuditService,
  ) {}

  async listUsers(
    filter?: AdminUserFilterInput,
    page?: PageInput,
    /** Current admin's user id — excluded from the list (admins don't manage themselves here). */
    excludeUserId?: string,
  ): Promise<AdminUserListResultType> {
    const limit = Math.min(page?.limit ?? 20, 100);
    const offset = page?.offset ?? 0;
    const sortBy = filter?.sortBy ?? EAdminUserSortBy.CREATED_AT;
    const sortOrder: 'ASC' | 'DESC' =
      filter?.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const addFilters = (qb: ReturnType<typeof this.userRepo.createQueryBuilder>) => {
      if (filter?.search) {
        qb.andWhere('(u.email ILIKE :q OR u.full_name ILIKE :q)', {
          q: `%${filter.search}%`,
        });
      }
      if (filter?.isDisabled !== undefined) {
        qb.andWhere('u.is_disabled = :isDisabled', { isDisabled: filter.isDisabled });
      }
      // Hide the requesting admin from their own user-management list.
      if (excludeUserId) {
        qb.andWhere('u.id != :excludeUserId', { excludeUserId });
      }
      return qb;
    };

    // COUNT query — lean, no aggregates
    const countQb = this.userRepo.createQueryBuilder('u');
    addFilters(countQb);
    const total = await countQb.getCount();

    // DATA query — LEFT JOIN business_members for count
    const dataQb = this.userRepo
      .createQueryBuilder('u')
      .leftJoin(
        (subQb) =>
          subQb
            .from(BusinessMember, 'bm')
            .innerJoin(Business, 'b', 'b.id = bm.business_id')
            .select('bm.user_id', 'user_id')
            .addSelect('COUNT(*)', 'cnt')
            .addSelect("STRING_AGG(b.name, ', ' ORDER BY b.name)", 'names')
            .groupBy('bm.user_id'),
        'bc',
        'bc.user_id = u.id',
      )
      .select([
        'u.id AS u_id',
        'u.email AS u_email',
        'u.full_name AS u_full_name',
        'u.platform_role AS u_platform_role',
        'u.is_disabled AS u_is_disabled',
        'u.last_login_at AS u_last_login_at',
        'u.created_at AS u_created_at',
        'COALESCE(bc.cnt, 0) AS business_count',
        'bc.names AS business_names',
      ]);

    addFilters(dataQb);

    const sortColumn =
      sortBy === EAdminUserSortBy.EMAIL
        ? 'u.email'
        : sortBy === EAdminUserSortBy.FULL_NAME
          ? 'u.full_name'
          : sortBy === EAdminUserSortBy.LAST_LOGIN_AT
            ? 'u.last_login_at'
            : 'u.created_at';

    dataQb.orderBy(sortColumn, sortOrder).offset(offset).limit(limit);

    const rows = await dataQb.getRawMany<IRawUserRow>();
    return { rows: rows.map(toAdminUserRow), total };
  }

  async getUserDetail(id: string): Promise<AdminUserDetailType> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    // Load memberships with business name
    const members = await this.memberRepo
      .createQueryBuilder('bm')
      .innerJoin(Business, 'b', 'b.id = bm.business_id')
      .select([
        'bm.business_id AS business_id',
        'b.name AS business_name',
        'bm.role AS role',
        'bm.joined_at AS joined_at',
      ])
      .where('bm.user_id = :id', { id })
      .getRawMany<{
        business_id: string;
        business_name: string;
        role: string;
        joined_at: Date;
      }>();

    const memberships: AdminUserBusinessMembershipType[] = members.map((m) => ({
      businessId: m.business_id,
      businessName: m.business_name,
      role: m.role,
      joinedAt: m.joined_at,
    }));

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone ?? null,
      avatarUrl: user.avatarUrl ?? null,
      language: user.language,
      bio: user.bio ?? null,
      emailVerified: user.emailVerified,
      isDisabled: user.isDisabled,
      platformRole: user.platformRole ?? null,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt ?? null,
      memberships,
    };
  }

  async disableUser(id: string, adminUserId: string): Promise<AdminUserRowType> {
    // SRS §5.11: admin cannot disable themselves
    if (id === adminUserId) {
      throw new BadRequestException('Cannot disable yourself');
    }

    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    await this.userRepo.update(id, {
      isDisabled: true,
      disabledAt: new Date(),
    });

    // Invalidate all refresh tokens immediately — SRS §11
    await this.refreshTokenService.revokeAllForUser(id);

    // Audit — businessId is null for platform-scope events (Phase 5 migration made column nullable)
    try {
      await this.auditService.log({
        businessId: null,
        actorId: adminUserId,
        action: EAdminAuditAction.USER_DISABLE,
        targetType: 'user',
        targetId: id,
        targetName: user.email,
        metadata: {},
      });
    } catch (err) {
      this.logger.warn(`Audit log failed for disableUser(${id}): ${(err as Error).message}`);
    }

    this.logger.log(`Admin ${adminUserId} disabled user ${id}`);

    return this.fetchRow(id);
  }

  async enableUser(id: string, adminUserId: string): Promise<AdminUserRowType> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    await this.userRepo.update(id, {
      isDisabled: false,
      disabledAt: null,
    });

    // No token revoke needed on enable — tokens were revoked at disable time
    try {
      await this.auditService.log({
        businessId: null,
        actorId: adminUserId,
        action: EAdminAuditAction.USER_ENABLE,
        targetType: 'user',
        targetId: id,
        targetName: user.email,
        metadata: {},
      });
    } catch (err) {
      this.logger.warn(`Audit log failed for enableUser(${id}): ${(err as Error).message}`);
    }

    this.logger.log(`Admin ${adminUserId} enabled user ${id}`);

    return this.fetchRow(id);
  }

  /** Re-fetch a single user row with business count for return value. */
  private async fetchRow(id: string): Promise<AdminUserRowType> {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoin(
        (subQb) =>
          subQb
            .from(BusinessMember, 'bm')
            .innerJoin(Business, 'b', 'b.id = bm.business_id')
            .select('bm.user_id', 'user_id')
            .addSelect('COUNT(*)', 'cnt')
            .addSelect("STRING_AGG(b.name, ', ' ORDER BY b.name)", 'names')
            .groupBy('bm.user_id'),
        'bc',
        'bc.user_id = u.id',
      )
      .select([
        'u.id AS u_id',
        'u.email AS u_email',
        'u.full_name AS u_full_name',
        'u.platform_role AS u_platform_role',
        'u.is_disabled AS u_is_disabled',
        'u.last_login_at AS u_last_login_at',
        'u.created_at AS u_created_at',
        'COALESCE(bc.cnt, 0) AS business_count',
        'bc.names AS business_names',
      ])
      .where('u.id = :id', { id });

    const row = await qb.getRawOne<IRawUserRow>();
    if (!row) throw new NotFoundException(`User ${id} not found`);
    return toAdminUserRow(row);
  }
}
