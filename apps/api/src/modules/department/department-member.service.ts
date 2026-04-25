import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { BusinessMember } from '../business/entities/business-member.entity';
import { DepartmentService } from './department.service';
import { Department } from './entities/department.entity';
import { DepartmentMember } from './entities/department-member.entity';

export type DepartmentMemberWithRole = DepartmentMember & { businessRole: string | null };

const MANAGER_ALLOWED_ROLES = new Set(['owner', 'manager']);

/** Member CRUD + atomic manager swap (B3, B7, B12, B13) */
@Injectable()
export class DepartmentMemberService {
  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    @InjectRepository(DepartmentMember)
    private readonly memberRepo: Repository<DepartmentMember>,
    @InjectRepository(BusinessMember)
    private readonly bizMemberRepo: Repository<BusinessMember>,
    private readonly departmentService: DepartmentService,
    private readonly dataSource: DataSource,
  ) {}

  async findMembers(
    departmentId: string,
    actorId: string,
  ): Promise<DepartmentMemberWithRole[]> {
    const dept = await this.requireDept(departmentId);
    await this.departmentService.assertBusinessMember(dept.businessId, actorId);

    const members = await this.memberRepo.find({
      where: { departmentId },
      relations: ['user'],
      order: { isManager: 'DESC', joinedAt: 'ASC' },
    });
    if (!members.length) return [];

    const userIds = members.map((m) => m.userId);
    const bizMembers = await this.bizMemberRepo.find({
      where: { businessId: dept.businessId, userId: In(userIds) },
    });
    const roleByUser = new Map(bizMembers.map((bm) => [bm.userId, bm.role]));

    return members.map((m) => ({
      ...m,
      businessRole: roleByUser.get(m.userId) ?? null,
    }));
  }

  async addMember(
    departmentId: string,
    userId: string,
    actorId: string,
  ): Promise<DepartmentMember> {
    const dept = await this.requireDept(departmentId);
    await this.departmentService.assertBusinessMember(dept.businessId, actorId);
    await this.requireBusinessRole(dept.businessId, userId);

    const existing = await this.memberRepo.findOne({
      where: { departmentId, userId },
    });
    if (existing) {
      throw new BadRequestException('User is already a member of this department');
    }

    return this.memberRepo.save({
      departmentId,
      userId,
      isManager: false,
    });
  }

  async removeMember(
    departmentId: string,
    userId: string,
    actorId: string,
  ): Promise<void> {
    const dept = await this.requireDept(departmentId);
    await this.departmentService.assertBusinessMember(dept.businessId, actorId);

    const member = await this.memberRepo.findOne({
      where: { departmentId, userId },
    });
    if (!member) throw new NotFoundException('Member not found in this department');

    if (member.isManager) {
      throw new BadRequestException(
        'Cannot remove the current manager — assign a new manager first',
      );
    }

    await this.memberRepo.delete(member.id);
  }

  /** Atomic swap: demote old manager + promote/insert new (B3/B7/B13) */
  async setManager(
    departmentId: string,
    userId: string,
    actorId: string,
  ): Promise<DepartmentMember> {
    const dept = await this.requireDept(departmentId);
    await this.departmentService.assertBusinessMember(dept.businessId, actorId);

    const targetBizMember = await this.requireBusinessRole(dept.businessId, userId);
    if (!MANAGER_ALLOWED_ROLES.has(targetBizMember.role)) {
      throw new BadRequestException(
        'User must have business role of owner or manager to be department manager',
      );
    }

    return this.dataSource.transaction(async (mgr) => {
      const repo = mgr.getRepository(DepartmentMember);

      await repo
        .createQueryBuilder()
        .update(DepartmentMember)
        .set({ isManager: false })
        .where('department_id = :departmentId AND is_manager = true', { departmentId })
        .execute();

      const existing = await repo.findOne({ where: { departmentId, userId } });
      if (existing) {
        existing.isManager = true;
        return repo.save(existing);
      }

      return repo.save({
        departmentId,
        userId,
        isManager: true,
      });
    });
  }

  private async requireDept(departmentId: string): Promise<Department> {
    const dept = await this.deptRepo.findOne({ where: { id: departmentId } });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  private async requireBusinessRole(
    businessId: string,
    userId: string,
  ): Promise<BusinessMember> {
    const member = await this.bizMemberRepo.findOne({
      where: { businessId, userId },
    });
    if (!member) {
      throw new ForbiddenException('User is not a member of this business');
    }
    return member;
  }
}
