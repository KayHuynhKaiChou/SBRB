import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Department } from '../department/entities/department.entity';
import { DepartmentMember } from '../department/entities/department-member.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from './entities/business.entity';
import { BusinessMember } from './entities/business-member.entity';

const BOD_DEFAULT_NAME = 'Ban giám đốc';

/** Business CRUD operations — SRS 4.2 */
@Injectable()
export class BusinessCrudService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    @InjectRepository(DepartmentMember)
    private readonly deptMemberRepo: Repository<DepartmentMember>,
    private readonly auditService: AuditService,
  ) {}

  async create(userId: string, dto: CreateBusinessDto): Promise<Business> {
    const ownerCount = await this.memberRepo.count({
      where: { userId, role: 'owner' },
    });
    if (ownerCount >= 3) {
      throw new BadRequestException('You can own at most 3 businesses');
    }

    const business = this.businessRepo.create({
      name: dto.name,
      industry: dto.industry ?? 'Other',
      timezone: dto.timezone ?? 'Asia/Ho_Chi_Minh',
      currency: dto.currency ?? 'VND',
      primaryColor: dto.primary_color ?? '#D72A44',
      ownerId: userId,
    });
    const saved = await this.businessRepo.save(business);

    const member = this.memberRepo.create({
      businessId: saved.id,
      userId,
      role: 'owner',
      status: 'active',
    });
    await this.memberRepo.save(member);

    // Auto-seed BOD root department + assign owner as manager (B12, SRS §4.1)
    const bod = await this.deptRepo.save({
      businessId: saved.id,
      parentId: null,
      name: BOD_DEFAULT_NAME,
      isRoot: true,
    });
    await this.deptMemberRepo.save({
      departmentId: bod.id,
      userId,
      isManager: true,
    });

    await this.auditService.log({
      businessId: saved.id,
      actorId: userId,
      action: 'create_business',
      targetType: 'business',
      targetId: saved.id,
      targetName: saved.name,
    });

    return saved;
  }

  async findById(id: string, userId: string): Promise<Business> {
    const member = await this.memberRepo.findOne({
      where: { businessId: id, userId },
    });
    if (!member) throw new NotFoundException('Business not found or access denied');

    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async findMyBusinesses(userId: string): Promise<Business[]> {
    const members = await this.memberRepo.find({ where: { userId } });
    if (!members.length) return [];
    const ids = members.map((m) => m.businessId);
    return this.businessRepo
      .createQueryBuilder('b')
      .where('b.id IN (:...ids)', { ids })
      .getMany();
  }

  async update(id: string, userId: string, dto: UpdateBusinessDto): Promise<Business> {
    const member = await this.memberRepo.findOne({
      where: { businessId: id, userId, role: 'owner' },
    });
    if (!member) throw new NotFoundException('Business not found or insufficient permissions');

    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');

    if (dto.name !== undefined) business.name = dto.name;
    if (dto.industry !== undefined) business.industry = dto.industry;
    if (dto.timezone !== undefined) business.timezone = dto.timezone;
    if (dto.currency !== undefined) business.currency = dto.currency;
    if (dto.primary_color !== undefined) business.primaryColor = dto.primary_color;
    if (dto.canvas_width !== undefined) business.canvasWidth = dto.canvas_width;
    if (dto.canvas_height !== undefined) business.canvasHeight = dto.canvas_height;
    if (dto.snap_grid !== undefined) business.snapGrid = dto.snap_grid ? 20 : 0;

    const updated = await this.businessRepo.save(business);

    await this.auditService.log({
      businessId: id,
      actorId: userId,
      action: 'update_business',
      targetType: 'business',
      targetId: id,
      targetName: updated.name,
    });

    return updated;
  }

  async delete(id: string, userId: string, confirmName: string): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { businessId: id, userId, role: 'owner' },
    });
    if (!member) throw new NotFoundException('Business not found or insufficient permissions');

    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');

    if (confirmName !== business.name) {
      throw new BadRequestException('Name confirmation does not match');
    }

    await this.auditService.log({
      businessId: id,
      actorId: userId,
      action: 'delete_business',
      targetType: 'business',
      targetId: id,
      targetName: business.name,
    });

    await this.businessRepo.delete(id);
  }
}
