import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EBusinessStatus, EAdminBusinessSortBy, EAdminAuditAction } from '@sbrb/shared-constants';
import { Business } from '../business/entities/business.entity';
import { BusinessMember } from '../business/entities/business-member.entity';
import { User } from '../auth/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { AdminBusinessFilterInput } from './dto/admin-business-filter.input';
import { AdminBusinessRowType } from './dto/admin-business-row.type';
import { AdminBusinessListResultType } from './dto/admin-business-list-result.type';
import { PageInput } from '../../common/dto/page.input';

/** Raw row shape returned from QueryBuilder.getRawMany() */
interface IRawBusinessRow {
  b_id: string;
  b_name: string;
  b_industry: string;
  b_status: string;
  b_created_at: Date;
  b_inactivated_at: Date | null;
  b_inactive_reason: string | null;
  owner_email: string;
  member_count: string; // Postgres returns numeric strings for aggregates
}

function toAdminBusinessRow(raw: IRawBusinessRow): AdminBusinessRowType {
  return {
    id: raw.b_id,
    name: raw.b_name,
    industry: raw.b_industry,
    ownerEmail: raw.owner_email ?? '',
    memberCount: parseInt(raw.member_count ?? '0', 10),
    status: raw.b_status,
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
      .select([
        'b.id AS b_id',
        'b.name AS b_name',
        'b.industry AS b_industry',
        'b.status AS b_status',
        'b.created_at AS b_created_at',
        'b.inactivated_at AS b_inactivated_at',
        'b.inactive_reason AS b_inactive_reason',
        'u.email AS owner_email',
        'COALESCE(mc.cnt, 0) AS member_count',
      ]);

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
    if (business.status === EBusinessStatus.INACTIVE) {
      throw new ConflictException('Business is already inactive');
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

    return this.fetchRow(id);
  }

  async reactivateBusiness(
    id: string,
    adminUserId: string,
  ): Promise<AdminBusinessRowType> {
    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException(`Business ${id} not found`);
    if (business.status === EBusinessStatus.ACTIVE) {
      throw new ConflictException('Business is already active');
    }

    await this.businessRepo.update(id, {
      status: EBusinessStatus.ACTIVE,
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

    return this.fetchRow(id);
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
      .select([
        'b.id AS b_id',
        'b.name AS b_name',
        'b.industry AS b_industry',
        'b.status AS b_status',
        'b.created_at AS b_created_at',
        'b.inactivated_at AS b_inactivated_at',
        'b.inactive_reason AS b_inactive_reason',
        'u.email AS owner_email',
        'COALESCE(mc.cnt, 0) AS member_count',
      ])
      .where('b.id = :id', { id });

    const row = await qb.getRawOne<IRawBusinessRow>();
    if (!row) throw new NotFoundException(`Business ${id} not found`);
    return toAdminBusinessRow(row);
  }
}
