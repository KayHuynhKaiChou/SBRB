import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessMember } from '../business/entities/business-member.entity';
import { Department } from './entities/department.entity';
import { DepartmentMember } from './entities/department-member.entity';
import { DepartmentService } from './department.service';
import { DepartmentMemberService } from './department-member.service';
import { DepartmentResolver } from './department.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Department, DepartmentMember, BusinessMember])],
  providers: [DepartmentService, DepartmentMemberService, DepartmentResolver],
  exports: [DepartmentService, DepartmentMemberService],
})
export class DepartmentModule {}
