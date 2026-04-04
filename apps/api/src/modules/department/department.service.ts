import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessMember } from '../business/entities/business-member.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';

const MAX_DEPTH = 3;

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
  ) {}

  async create(userId: string, dto: CreateDepartmentDto): Promise<Department> {
    await this.assertMember(dto.businessId, userId);

    if (dto.parentId) {
      await this.validateParent(dto.parentId, dto.businessId);
    }

    const dept = this.deptRepo.create({
      businessId: dto.businessId,
      name: dto.name,
      parentId: dto.parentId ?? null,
    });
    return this.deptRepo.save(dept);
  }

  async findByBusiness(businessId: string, userId: string): Promise<Department[]> {
    await this.assertMember(businessId, userId);
    return this.deptRepo.find({
      where: { businessId },
      order: { name: 'ASC' },
    });
  }

  async update(id: string, userId: string, dto: UpdateDepartmentDto): Promise<Department> {
    const dept = await this.deptRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found');

    await this.assertMember(dept.businessId, userId);

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('Department cannot be its own parent');
      }
      if (dto.parentId) {
        await this.validateParent(dto.parentId, dept.businessId, id);
      }
      dept.parentId = dto.parentId;
    }

    if (dto.name !== undefined) {
      dept.name = dto.name;
    }

    return this.deptRepo.save(dept);
  }

  async delete(id: string, userId: string): Promise<void> {
    const dept = await this.deptRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found');

    await this.assertMember(dept.businessId, userId);

    const childCount = await this.deptRepo.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new BadRequestException('Cannot delete department with children');
    }

    await this.deptRepo.delete(id);
  }

  /** Verify user is a member of the business */
  private async assertMember(businessId: string, userId: string): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { businessId, userId },
    });
    if (!member) throw new ForbiddenException('Not a member of this business');
  }

  /** Validate parentId: exists, same business, depth <= MAX_DEPTH */
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

    // Check if the proposed parent is a descendant of excludeId (circular ref)
    if (excludeId) {
      await this.assertNotDescendant(parentId, excludeId);
    }

    // Compute depth: walk up from parent to root
    const depth = await this.computeDepth(parentId);
    if (depth + 1 >= MAX_DEPTH) {
      throw new BadRequestException(`Department nesting cannot exceed ${MAX_DEPTH} levels`);
    }
  }

  /** Walk up the tree from nodeId and count depth (root = 0) */
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

  /** Ensure targetId is not a descendant of ancestorId (prevents circular refs on update) */
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
