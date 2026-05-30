import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { BusinessMember } from '../business/entities/business-member.entity';
import { AuditService } from '../audit/audit.service';
import { DepartmentService } from './department.service';
import { Department } from './entities/department.entity';
import { DepartmentMember } from './entities/department-member.entity';
import { UpdateMemberInfoDto } from './dto/update-member-info.dto';

export type DepartmentMemberWithRole = DepartmentMember & { businessRole: string | null };

export type DepartmentSubtreeMember = DepartmentMemberWithRole & {
  departmentName: string | null;
  isDirect: boolean;
};

const MANAGER_ALLOWED_ROLES = new Set(['owner', 'manager']);

/** Member CRUD + atomic manager swap (B3, B7, B12, B13) */
@Injectable()
export class DepartmentMemberService {
  private readonly logger = new Logger(DepartmentMemberService.name);

  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    @InjectRepository(DepartmentMember)
    private readonly memberRepo: Repository<DepartmentMember>,
    @InjectRepository(BusinessMember)
    private readonly bizMemberRepo: Repository<BusinessMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly departmentService: DepartmentService,
    private readonly auditService: AuditService,
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

  /**
   * The department's direct reports view: this department's OWN members PLUS the
   * managers of its direct child departments (one level down — the people who report
   * up to this department). Each row carries its real department name + an `isDirect`
   * flag (true = belongs directly to the queried department; false = a child-department manager).
   * Ordered: direct first, then child managers grouped by department name.
   */
  async findSubtreeMembers(
    departmentId: string,
    actorId: string,
  ): Promise<DepartmentSubtreeMember[]> {
    const dept = await this.requireDept(departmentId);
    await this.departmentService.assertBusinessMember(dept.businessId, actorId);

    // Direct child departments (one level down).
    const children = await this.deptRepo.find({
      where: { parentId: departmentId },
      select: ['id', 'name'],
    });
    const childIds = children.map((c) => c.id);
    const nameById = new Map<string, string>([[departmentId, dept.name]]);
    for (const ch of children) nameById.set(ch.id, ch.name);

    // OR query: all members of this department + only the MANAGERS of its direct children.
    const where: FindOptionsWhere<DepartmentMember>[] = [{ departmentId }];
    if (childIds.length) {
      where.push({ departmentId: In(childIds), isManager: true });
    }
    const members = await this.memberRepo.find({
      where,
      relations: ['user'],
      order: { isManager: 'DESC', joinedAt: 'ASC' },
    });
    if (!members.length) return [];

    const userIds = members.map((m) => m.userId);
    const bizMembers = await this.bizMemberRepo.find({
      where: { businessId: dept.businessId, userId: In(userIds) },
    });
    const roleByUser = new Map(bizMembers.map((bm) => [bm.userId, bm.role]));

    const rows: DepartmentSubtreeMember[] = members.map((m) => ({
      ...m,
      businessRole: roleByUser.get(m.userId) ?? null,
      departmentName: nameById.get(m.departmentId) ?? null,
      isDirect: m.departmentId === departmentId,
    }));

    // Direct members first, then child managers grouped by department (name, then id to disambiguate).
    // Within a single department the stable sort preserves the DB order (manager first, then joinedAt asc).
    return rows.sort((a, b) => {
      if (a.isDirect !== b.isDirect) return a.isDirect ? -1 : 1;
      const byName = (a.departmentName ?? '').localeCompare(b.departmentName ?? '');
      if (byName !== 0) return byName;
      return a.departmentId.localeCompare(b.departmentId);
    });
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
      throw new BadRequestException({ message: { vi: 'Đã là thành viên Phòng ban', en: 'User is already a member of this department' } });
    }

    return this.memberRepo.save({
      departmentId,
      userId,
      isManager: false,
    });
  }

  /**
   * Add (or TRANSFER) multiple users into a department. An employee belongs to exactly one
   * department per business, so adding someone who is already in another department moves them:
   * their existing NON-manager memberships within the business are dropped first, then they are
   * inserted into the target department. Runs atomically.
   */
  async addMembers(
    departmentId: string,
    userIds: string[],
    actorId: string,
  ): Promise<DepartmentMember[]> {
    const dept = await this.requireDept(departmentId);
    await this.departmentService.assertBusinessMember(dept.businessId, actorId);

    const uniqueUserIds = [...new Set(userIds)];
    if (!uniqueUserIds.length) return [];

    // Every target must belong to the business.
    for (const userId of uniqueUserIds) {
      await this.requireBusinessRole(dept.businessId, userId);
    }

    const businessDepts = await this.deptRepo.find({
      where: { businessId: dept.businessId },
      select: ['id'],
    });
    const businessDeptIds = businessDepts.map((d) => d.id);

    return this.dataSource.transaction(async (mgr) => {
      const repo = mgr.getRepository(DepartmentMember);
      const created: DepartmentMember[] = [];
      for (const userId of uniqueUserIds) {
        // Transfer out of any current (non-manager) department within this business.
        await repo.delete({
          userId,
          departmentId: In(businessDeptIds),
          isManager: false,
        });
        created.push(await repo.save({ departmentId, userId, isManager: false }));
      }
      return created;
    });
  }

  async removeMember(
    departmentId: string,
    userId: string,
    actorId: string,
  ): Promise<DepartmentMember> {
    const dept = await this.requireDept(departmentId);
    await this.departmentService.assertBusinessMember(dept.businessId, actorId);

    const member = await this.memberRepo.findOne({
      where: { departmentId, userId },
    });
    if (!member) throw new NotFoundException({ message: { vi: 'Không tìm thấy thành viên Phòng ban', en: 'Member not found in this department' } });

    if (member.isManager) {
      throw new BadRequestException({ message: { vi: 'Không thể xoá Trưởng phòng — hãy chỉ định Trưởng phòng mới trước', en: 'Cannot remove the current manager — assign a new manager first' } });
    }

    await this.memberRepo.delete(member.id);
    return member;
  }

  /** Atomic swap: demote old manager + promote/insert new (B3/B7/B13).
   *  Only the business OWNER may change a department manager. The ROOT department's
   *  manager (the business head) cannot be reassigned here at all — ownership handover
   *  must go through a platform admin (adminChangeBusinessOwner). */
  async setManager(
    departmentId: string,
    userId: string,
    actorId: string,
  ): Promise<DepartmentMember> {
    const dept = await this.requireDept(departmentId);
    const actor = await this.departmentService.assertBusinessMember(dept.businessId, actorId);

    if (actor.role !== 'owner') {
      throw new ForbiddenException({ message: { vi: 'Chỉ Chủ Doanh nghiệp mới được đổi Trưởng phòng', en: 'Only the business owner can change a department manager' } });
    }

    // Root (top) department — the business head seat. The owner cannot reassign it;
    // it changes only via a platform admin ownership transfer.
    if (dept.isRoot || dept.parentId === null) {
      throw new ForbiddenException({ message: { vi: 'Trưởng Phòng gốc (Ban giám đốc) chỉ thay đổi được khi chuyển quyền sở hữu qua Quản trị viên hệ thống', en: 'The root department head can only change via a platform-admin ownership transfer' } });
    }

    const targetBizMember = await this.requireBusinessRole(dept.businessId, userId);
    if (!MANAGER_ALLOWED_ROLES.has(targetBizMember.role)) {
      throw new BadRequestException({ message: { vi: 'Chỉ Chủ hoặc Quản lý mới có thể làm Trưởng phòng', en: 'User must have business role of owner or manager to be department manager' } });
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

  /**
   * Owner-gated: update a business member's fullName / phone.
   * Audited; audit failure does NOT fail the mutation (SRS §5.18 pattern).
   */
  async updateMemberInfo(
    businessId: string,
    userId: string,
    input: UpdateMemberInfoDto,
    actorId: string,
  ): Promise<User> {
    // Actor must be a business member.
    await this.departmentService.assertBusinessMember(businessId, actorId);

    // Actor must be owner.
    const role = await this.departmentService.findMyRole(businessId, actorId);
    if (role !== 'owner') {
      throw new ForbiddenException({
        message: {
          vi: 'Chỉ Chủ Doanh nghiệp mới được chỉnh sửa thông tin thành viên',
          en: 'Only the business owner can edit member information',
        },
      });
    }

    // Target userId must be a member of this business.
    const targetBizMember = await this.bizMemberRepo.findOne({
      where: { businessId, userId },
    });
    if (!targetBizMember) {
      throw new NotFoundException({
        message: {
          vi: 'Không tìm thấy thành viên trong Doanh nghiệp',
          en: 'User is not a member of this business',
        },
      });
    }

    // Load the User entity and apply only the provided fields.
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        message: { vi: 'Không tìm thấy người dùng', en: 'User not found' },
      });
    }

    const changedFields: Record<string, unknown> = {};
    if (input.fullName !== undefined) {
      changedFields['fullName'] = input.fullName;
      user.fullName = input.fullName;
    }
    if (input.phone !== undefined) {
      changedFields['phone'] = input.phone;
      user.phone = input.phone ?? null;
    }

    const updated = await this.userRepo.save(user);

    // Audit — wrapped in try/catch so audit failure does not break the mutation.
    try {
      await this.auditService.log({
        businessId,
        actorId,
        action: 'member.update_info',
        targetType: 'user',
        targetId: userId,
        targetName: updated.fullName,
        metadata: { changedFields },
      });
    } catch (err) {
      this.logger.warn(
        `Audit log failed for updateMemberInfo(userId=${userId}): ${(err as Error).message}`,
      );
    }

    return updated;
  }

  private async requireDept(departmentId: string): Promise<Department> {
    const dept = await this.deptRepo.findOne({ where: { id: departmentId } });
    if (!dept) throw new NotFoundException({ message: { vi: 'Không tìm thấy Phòng ban', en: 'Department not found' } });
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
      throw new ForbiddenException({ message: { vi: 'Không phải thành viên Doanh nghiệp', en: 'User is not a member of this business' } });
    }
    return member;
  }
}
