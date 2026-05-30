import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { BusinessMember } from '../business/entities/business-member.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentPositionInput, DepartmentType } from './dto/department.type';
import { Department } from './entities/department.entity';
import { DepartmentMember } from './entities/department-member.entity';

const MAX_DEPTH = 3;

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    @InjectRepository(DepartmentMember)
    private readonly memberRepo: Repository<DepartmentMember>,
    @InjectRepository(BusinessMember)
    private readonly bizMemberRepo: Repository<BusinessMember>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateDepartmentDto): Promise<Department> {
    await this.assertBusinessMember(dto.businessId, userId);

    if (dto.parentId) {
      await this.validateParent(dto.parentId, dto.businessId);
    }

    return this.dataSource.transaction(async (manager) => {
      const dept = await manager.getRepository(Department).save({
        businessId: dto.businessId,
        name: dto.name,
        parentId: dto.parentId ?? null,
        isRoot: false,
      });

      // B12 — auto-assign creator as manager
      await manager.getRepository(DepartmentMember).save({
        departmentId: dept.id,
        userId,
        isManager: true,
      });

      return dept;
    });
  }

  async findByBusiness(businessId: string, userId: string): Promise<Department[]> {
    await this.assertBusinessMember(businessId, userId);
    return this.deptRepo.find({
      where: { businessId },
      order: { name: 'ASC' },
    });
  }

  /** Return nested tree (BOD root → children → grandchildren) with manager + memberCount */
  async findTree(businessId: string, userId: string): Promise<DepartmentType[]> {
    await this.assertBusinessMember(businessId, userId);

    const depts = await this.deptRepo.find({
      where: { businessId },
      order: { isRoot: 'DESC', name: 'ASC' },
    });
    if (!depts.length) return [];

    const deptIds = depts.map((d) => d.id);
    const members = await this.memberRepo.find({
      where: { departmentId: In(deptIds) },
      relations: ['user'],
    });

    const countByDept = new Map<string, number>();
    const managerByDept = new Map<string, DepartmentMember>();
    for (const m of members) {
      countByDept.set(m.departmentId, (countByDept.get(m.departmentId) ?? 0) + 1);
      if (m.isManager) managerByDept.set(m.departmentId, m);
    }

    const nodeMap = new Map<string, DepartmentType>();
    const roots: DepartmentType[] = [];

    for (const d of depts) {
      const node: DepartmentType = {
        ...d,
        memberCount: countByDept.get(d.id) ?? 0,
        manager: managerByDept.get(d.id) ?? null,
        children: [],
      } as DepartmentType;
      nodeMap.set(d.id, node);
    }

    for (const d of depts) {
      const node = nodeMap.get(d.id)!;
      if (d.parentId && nodeMap.has(d.parentId)) {
        nodeMap.get(d.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    // Direct-report count shown on the org-chart card = the modal's MEMBERS count:
    // this department's own non-manager members + the managers of its direct child departments.
    for (const d of depts) {
      const node = nodeMap.get(d.id)!;
      const directNonManager = (node.memberCount ?? 0) - (node.manager ? 1 : 0);
      const childManagers = (node.children ?? []).filter((c) => c.manager).length;
      node.directReportCount = directNonManager + childManagers;
    }

    return roots;
  }

  async update(id: string, userId: string, dto: UpdateDepartmentDto): Promise<Department> {
    const dept = await this.deptRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException({ message: { vi: 'Không tìm thấy Phòng ban', en: 'Department not found' } });

    await this.assertBusinessMember(dept.businessId, userId);

    if (dto.parentId !== undefined) {
      if (dept.isRoot && dto.parentId !== null) {
        throw new BadRequestException('Root department cannot have a parent');
      }
      if (dto.parentId === id) {
        throw new BadRequestException('Department cannot be its own parent');
      }
      if (dto.parentId) {
        await this.validateParent(dto.parentId, dept.businessId, id);
      }
      dept.parentId = dto.parentId;
    }

    if (dto.name !== undefined) dept.name = dto.name;

    return this.deptRepo.save(dept);
  }

  async delete(id: string, userId: string): Promise<Department> {
    const dept = await this.deptRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException({ message: { vi: 'Không tìm thấy Phòng ban', en: 'Department not found' } });

    await this.assertBusinessMember(dept.businessId, userId);

    if (dept.isRoot) {
      throw new BadRequestException({ message: { vi: 'Không thể xoá Phòng ban gốc', en: 'Cannot delete root department' } });
    }

    const childCount = await this.deptRepo.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new BadRequestException({ message: { vi: 'Không thể xoá Phòng ban còn Phòng con', en: 'Cannot delete department with children' } });
    }

    await this.deptRepo.delete(id);
    return dept;
  }

  /** Owner-only: persist positions for multiple departments at once. */
  async updatePositions(
    businessId: string,
    userId: string,
    positions: DepartmentPositionInput[],
  ): Promise<Department[]> {
    const member = await this.assertBusinessMember(businessId, userId);
    if (member.role !== 'owner') {
      throw new ForbiddenException({ message: { vi: 'Chỉ Chủ Doanh nghiệp mới được sửa vị trí sơ đồ', en: 'Only the business owner can edit chart positions' } });
    }
    if (!positions.length) return [];

    // Sanity bound — anything beyond this is a client bug or abuse.
    const MAX_COORD = 100000;
    for (const p of positions) {
      if (
        !Number.isFinite(p.positionX) ||
        !Number.isFinite(p.positionY) ||
        Math.abs(p.positionX) > MAX_COORD ||
        Math.abs(p.positionY) > MAX_COORD
      ) {
        throw new BadRequestException('Position coordinates out of range');
      }
    }

    const ids = positions.map((p) => p.id);
    const depts = await this.deptRepo.find({ where: { id: In(ids) } });
    const wrong = depts.find((d) => d.businessId !== businessId);
    if (wrong || depts.length !== ids.length) {
      throw new BadRequestException('All departments must belong to the business');
    }

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Department);
      const updated: Department[] = [];
      for (const p of positions) {
        await repo.update(p.id, { positionX: p.positionX, positionY: p.positionY });
        const fresh = await repo.findOne({ where: { id: p.id } });
        if (fresh) updated.push(fresh);
      }
      return updated;
    });
  }

  /** Returns the current user's role within a business, or null if not a member. */
  async findMyRole(businessId: string, userId: string): Promise<string | null> {
    const member = await this.bizMemberRepo.findOne({ where: { businessId, userId } });
    return member?.role ?? null;
  }

  /** Verify user is a member of the business */
  async assertBusinessMember(businessId: string, userId: string): Promise<BusinessMember> {
    const member = await this.bizMemberRepo.findOne({
      where: { businessId, userId },
    });
    if (!member) throw new ForbiddenException({ message: { vi: 'Không phải thành viên Doanh nghiệp', en: 'Not a member of this business' } });
    return member;
  }

  private async validateParent(
    parentId: string,
    businessId: string,
    excludeId?: string,
  ): Promise<void> {
    const parent = await this.deptRepo.findOne({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('Parent department not found');
    if (parent.businessId !== businessId) {
      throw new BadRequestException('Parent must belong to the same business');
    }
    if (excludeId) await this.assertNotDescendant(parentId, excludeId);

    const depth = await this.computeDepth(parentId);
    if (depth + 1 >= MAX_DEPTH) {
      throw new BadRequestException(`Department nesting cannot exceed ${MAX_DEPTH} levels`);
    }
  }

  private async computeDepth(nodeId: string): Promise<number> {
    let depth = 0;
    let currentId: string | null = nodeId;
    while (currentId) {
      const node = await this.deptRepo.findOne({
        where: { id: currentId },
        select: ['id', 'parentId'],
      });
      if (!node || !node.parentId) break;
      depth++;
      currentId = node.parentId;
      if (depth >= MAX_DEPTH) break;
    }
    return depth;
  }

  private async assertNotDescendant(targetId: string, ancestorId: string): Promise<void> {
    let currentId: string | null = targetId;
    const visited = new Set<string>();
    while (currentId) {
      if (currentId === ancestorId) {
        throw new BadRequestException('Cannot create circular department hierarchy');
      }
      if (visited.has(currentId)) break;
      visited.add(currentId);
      const node = await this.deptRepo.findOne({
        where: { id: currentId },
        select: ['id', 'parentId'],
      });
      if (!node) break;
      currentId = node.parentId;
    }
  }
}
