import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { BusinessMember } from '../business/entities/business-member.entity';
import { AuditModule } from '../audit/audit.module';
import { Department } from './entities/department.entity';
import { DepartmentMember } from './entities/department-member.entity';
import { DepartmentService } from './department.service';
import { DepartmentMemberService } from './department-member.service';
import { DepartmentResolver } from './department.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([Department, DepartmentMember, BusinessMember, User]),
    AuditModule,
  ],
  providers: [DepartmentService, DepartmentMemberService, DepartmentResolver],
  exports: [DepartmentService, DepartmentMemberService],
})
export class DepartmentModule {}
