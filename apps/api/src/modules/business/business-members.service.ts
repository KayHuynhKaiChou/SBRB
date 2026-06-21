import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isManagerRole, type TBusinessRole } from '@sbrb/shared-constants';
import { User } from '../auth/entities/user.entity';
import { BusinessMember } from './entities/business-member.entity';
import { BusinessMembersFilterInput } from './dto/business-members.input';
import {
  BusinessMemberRowType,
  BusinessMembersResultType,
} from './dto/business-member-row.type';

interface IRawMemberRow {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  status: string;
  joined_at: Date;
  last_login_at: Date | null;
}

function toRow(raw: IRawMemberRow): BusinessMemberRowType {
  return {
    userId: raw.user_id,
    fullName: raw.full_name,
    email: raw.email,
    phone: raw.phone ?? null,
    avatarUrl: raw.avatar_url ?? null,
    role: raw.role,
    status: raw.status,
    joinedAt: raw.joined_at,
    lastLoginAt: raw.last_login_at ?? null,
  };
}

/** Read-side query for the personnel (/members) table — joins BusinessMember + User. */
@Injectable()
export class BusinessMembersService {
  constructor(
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
  ) {}

  async businessMembers(
    businessId: string,
    callerId: string,
    filter?: BusinessMembersFilterInput,
  ): Promise<BusinessMembersResultType> {
    // Only owner/manager of THIS business may read the personnel list (FE also route-gates).
    const caller = await this.memberRepo.findOne({ where: { businessId, userId: callerId } });
    if (!caller || !isManagerRole(caller.role as TBusinessRole)) {
      throw new ForbiddenException('Insufficient role to view personnel');
    }

    const limit = Math.min(filter?.limit ?? 20, 100);
    const offset = filter?.offset ?? 0;

    const addFilters = (qb: ReturnType<typeof this.memberRepo.createQueryBuilder>) => {
      qb.where('bm.business_id = :businessId', { businessId });
      if (filter?.search) {
        qb.andWhere('(u.full_name ILIKE :q OR u.email ILIKE :q)', { q: `%${filter.search}%` });
      }
      if (filter?.role) qb.andWhere('bm.role = :role', { role: filter.role });
      if (filter?.status) qb.andWhere('u.status = :status', { status: filter.status });
      return qb;
    };

    const countQb = addFilters(
      this.memberRepo.createQueryBuilder('bm').innerJoin(User, 'u', 'u.id = bm.user_id'),
    );
    const total = await countQb.getCount();

    const dataQb = addFilters(
      this.memberRepo
        .createQueryBuilder('bm')
        .innerJoin(User, 'u', 'u.id = bm.user_id')
        .select([
          'bm.user_id AS user_id',
          'u.full_name AS full_name',
          'u.email AS email',
          'u.phone AS phone',
          'u.avatar_url AS avatar_url',
          'bm.role AS role',
          'u.status AS status',
          'bm.joined_at AS joined_at',
          'u.last_login_at AS last_login_at',
        ]),
    )
      .orderBy('bm.joined_at', 'DESC')
      .offset(offset)
      .limit(limit);

    const rows = await dataQb.getRawMany<IRawMemberRow>();
    return { rows: rows.map(toRow), total };
  }
}
