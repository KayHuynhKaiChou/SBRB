import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EBusinessStatus } from '@sbrb/shared-constants';
import { Business } from '../business/entities/business.entity';
import { User } from '../auth/entities/user.entity';
import { AdminMetricsType } from './dto/admin-metrics.type';

/**
 * Computes platform-wide aggregate stats for the admin dashboard.
 * Runs all counts in parallel via Promise.all for minimal latency.
 * SRS §5.9, §5.17.
 */
@Injectable()
export class AdminMetricsService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getMetrics(): Promise<AdminMetricsType> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalBusinesses,
      activeBusinesses,
      inactiveBusinesses,
      totalUsers,
      newBusinessesLast30d,
      newUsersLast30d,
    ] = await Promise.all([
      this.businessRepo.createQueryBuilder('b').getCount(),

      this.businessRepo
        .createQueryBuilder('b')
        .where('b.status = :status', { status: EBusinessStatus.ACTIVE })
        .getCount(),

      this.businessRepo
        .createQueryBuilder('b')
        .where('b.status = :status', { status: EBusinessStatus.INACTIVE })
        .getCount(),

      this.userRepo.createQueryBuilder('u').getCount(),

      this.businessRepo
        .createQueryBuilder('b')
        .where('b.created_at >= :since', { since: thirtyDaysAgo })
        .getCount(),

      this.userRepo
        .createQueryBuilder('u')
        .where('u.created_at >= :since', { since: thirtyDaysAgo })
        .getCount(),
    ]);

    return {
      totalBusinesses,
      activeBusinesses,
      inactiveBusinesses,
      totalUsers,
      newBusinessesLast30d,
      newUsersLast30d,
    };
  }
}
