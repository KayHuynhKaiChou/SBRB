import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { User } from '../auth/entities/user.entity';
import { AdminAuditFilterInput } from './dto/admin-audit-filter.input';
import { AdminAuditListResultType } from './dto/admin-audit-list-result.type';
import { AdminAuditRowType } from './dto/admin-audit-row.type';
import { PageInput } from '../../common/dto/page.input';

interface IRawAuditRow {
  al_id: string;
  al_action: string;
  al_actor_id: string;
  al_target_id: string | null;
  al_target_type: string | null;
  al_target_name: string | null;
  al_business_id: string | null;
  al_metadata: Record<string, unknown>;
  al_created_at: Date;
  actor_email: string | null;
}

function toAuditRow(raw: IRawAuditRow): AdminAuditRowType {
  return {
    id: raw.al_id,
    action: raw.al_action,
    actorId: raw.al_actor_id,
    actorEmail: raw.actor_email ?? 'system',
    targetId: raw.al_target_id ?? null,
    targetType: raw.al_target_type ?? null,
    targetName: raw.al_target_name ?? null,
    businessId: raw.al_business_id ?? null,
    meta: JSON.stringify(raw.al_metadata ?? {}),
    createdAt: raw.al_created_at,
  };
}

/**
 * Queries audit_logs for the admin audit log page.
 * Supports filtering by actor email, action, and date range.
 * SRS §5.16.
 */
@Injectable()
export class AdminAuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async listAuditLogs(
    filter?: AdminAuditFilterInput,
    page?: PageInput,
  ): Promise<AdminAuditListResultType> {
    const limit = Math.min(page?.limit ?? 20, 100);
    const offset = page?.offset ?? 0;

    const addFilters = (qb: ReturnType<typeof this.auditRepo.createQueryBuilder>) => {
      if (filter?.actorEmail) {
        qb.andWhere('u.email ILIKE :actorEmail', {
          actorEmail: `%${filter.actorEmail}%`,
        });
      }
      if (filter?.action) {
        qb.andWhere('al.action = :action', { action: filter.action });
      }
      if (filter?.dateFrom) {
        qb.andWhere('al.created_at >= :dateFrom', { dateFrom: filter.dateFrom });
      }
      if (filter?.dateTo) {
        qb.andWhere('al.created_at <= :dateTo', { dateTo: filter.dateTo });
      }
      return qb;
    };

    // COUNT query — lean, only the joins required for filters
    const countQb = this.auditRepo
      .createQueryBuilder('al')
      .leftJoin(User, 'u', 'u.id = al.actor_id');
    addFilters(countQb);
    const total = await countQb.getCount();

    // DATA query — full select with actor email join
    const dataQb = this.auditRepo
      .createQueryBuilder('al')
      .leftJoin(User, 'u', 'u.id = al.actor_id')
      .select([
        'al.id AS al_id',
        'al.action AS al_action',
        'al.actor_id AS al_actor_id',
        'al.target_id AS al_target_id',
        'al.target_type AS al_target_type',
        'al.target_name AS al_target_name',
        'al.business_id AS al_business_id',
        'al.metadata AS al_metadata',
        'al.created_at AS al_created_at',
        'u.email AS actor_email',
      ]);

    addFilters(dataQb);
    dataQb.orderBy('al.created_at', 'DESC').offset(offset).limit(limit);

    const rows = await dataQb.getRawMany<IRawAuditRow>();
    return { rows: rows.map(toAuditRow), total };
  }
}
