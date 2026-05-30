import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity';
import { BusinessMember } from '../business/entities/business-member.entity';
import { User } from '../auth/entities/user.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AdminBusinessService } from './admin-business.service';
import { AdminBusinessResolver } from './admin-business.resolver';
import { AdminUserService } from './admin-user.service';
import { AdminUserResolver } from './admin-user.resolver';
import { AdminMetricsService } from './admin-metrics.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminPlatformResolver } from './admin-platform.resolver';

/**
 * Admin module — platform-admin-only features.
 * SRS §5.9-§5.18: business list, inactivate, reactivate, user list, disable, enable, audit, metrics.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Business, BusinessMember, User, AuditLog]),
    AuditModule,
    AuthModule,
  ],
  providers: [
    AdminBusinessService,
    AdminBusinessResolver,
    AdminUserService,
    AdminUserResolver,
    AdminMetricsService,
    AdminAuditService,
    AdminPlatformResolver,
  ],
})
export class AdminModule {}
