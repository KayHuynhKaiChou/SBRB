import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from '../department/entities/department.entity';
import { DepartmentMember } from '../department/entities/department-member.entity';
import { Business } from './entities/business.entity';
import { BusinessMember } from './entities/business-member.entity';
import { BusinessInvitation } from './entities/business-invitation.entity';
import { BusinessCrudService } from './business-crud.service';
import { BusinessOwnershipService } from './business-ownership.service';
import { BusinessService } from './business.service';
import { BusinessResolver } from './business.resolver';
import { BusinessController } from './business.controller';
import { MemberService } from './member.service';
import { MemberResolver } from './member.resolver';
import { InvitationService } from './invitation.service';
import { User } from '../auth/entities/user.entity';
import { MailModule } from '../mail/mail.module';
import { MinioModule } from '../minio/minio.module';
import { AuditModule } from '../audit/audit.module';
import { UserModule } from '../user/user.module';

/**
 * Business module — SRS 4.2
 * Handles: CRUD business, member management, role assignment,
 * widget assignment for Staff, business switcher data
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Business, BusinessMember, BusinessInvitation, User, Department, DepartmentMember]),
    MailModule,
    MinioModule,
    AuditModule,
    UserModule,
  ],
  providers: [
    BusinessCrudService,
    BusinessOwnershipService,
    BusinessService,
    BusinessResolver,
    MemberService,
    MemberResolver,
    InvitationService,
  ],
  controllers: [BusinessController],
  exports: [BusinessService, BusinessCrudService, BusinessOwnershipService, MemberService, InvitationService],
})
export class BusinessModule {}
