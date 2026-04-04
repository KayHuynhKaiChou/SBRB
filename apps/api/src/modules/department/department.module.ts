import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessMember } from '../business/entities/business-member.entity';
import { Department } from './entities/department.entity';
import { DepartmentService } from './department.service';
import { DepartmentResolver } from './department.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Department, BusinessMember])],
  providers: [DepartmentService, DepartmentResolver],
  exports: [DepartmentService],
})
export class DepartmentModule {}
