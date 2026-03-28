import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BusinessMember } from '../business/entities/business-member.entity';
import { CreateTabDto } from './dto/create-tab.dto';
import { TabOrderItemDto } from './dto/reorder-tabs.dto';
import { UpdateTabDto } from './dto/update-tab.dto';
import { Tab } from './entities/tab.entity';

const MAX_TABS_PER_BUSINESS = 20;
const MANAGER_ROLES = ['owner', 'manager'];

/** Tab CRUD service — SRS 4.3 */
@Injectable()
export class TabService {
  constructor(
    @InjectRepository(Tab)
    private readonly tabRepo: Repository<Tab>,
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
    private readonly dataSource: DataSource,
  ) {}

  /** Get all tabs for a business sorted: pinned first, then by position */
  async findByBusiness(businessId: string, userId: string): Promise<Array<Tab & { iconColor: string; iconName: string; order: number }>> {
    await this.requireMember(businessId, userId);
    const tabs = await this.tabRepo
      .createQueryBuilder('t')
      .where('t.businessId = :businessId', { businessId })
      .orderBy('t.isPinned', 'DESC')
      .addOrderBy('t.position', 'ASC')
      .getMany();
    return tabs.map(this.mapTab);
  }

  /** Create a new tab — Manager+ only; max 20 tabs/business */
  async create(businessId: string, userId: string, dto: CreateTabDto): Promise<Tab & { iconColor: string; iconName: string; order: number }> {
    const member = await this.requireMember(businessId, userId);
    if (!MANAGER_ROLES.includes(member.role)) {
      throw new ForbiddenException('Manager or higher required to create tabs');
    }

    const count = await this.tabRepo.count({ where: { businessId } });
    if (count >= MAX_TABS_PER_BUSINESS) {
      throw new BadRequestException(`Maximum ${MAX_TABS_PER_BUSINESS} tabs per business`);
    }

    const maxPosition = await this.tabRepo
      .createQueryBuilder('t')
      .select('MAX(t.position)', 'max')
      .where('t.businessId = :businessId', { businessId })
      .getRawOne<{ max: number | null }>();

    const nextPosition = (maxPosition?.max ?? -1) + 1;

    const tab = this.tabRepo.create({
      businessId,
      createdBy: userId,
      name: dto.name,
      color: dto.iconColor ?? '#D72A44',
      icon: dto.iconName ?? 'chart-bar',
      position: nextPosition,
      isPinned: dto.isPinned ?? false,
      isProtected: dto.isProtected ?? false,
    });

    const saved = await this.tabRepo.save(tab);
    return this.mapTab(saved);
  }

  /** Update tab — Manager+ required; only Owner can modify protected tabs */
  async update(id: string, userId: string, dto: UpdateTabDto): Promise<Tab & { iconColor: string; iconName: string; order: number }> {
    const tab = await this.findTabOrFail(id);
    const member = await this.requireMember(tab.businessId, userId);

    if (!MANAGER_ROLES.includes(member.role)) {
      throw new ForbiddenException('Manager or higher required to update tabs');
    }
    if (tab.isProtected && member.role !== 'owner') {
      throw new ForbiddenException('Only the business owner can modify protected tabs');
    }

    if (dto.name !== undefined) tab.name = dto.name;
    if (dto.iconColor !== undefined) tab.color = dto.iconColor;
    if (dto.iconName !== undefined) tab.icon = dto.iconName;
    if (dto.isPinned !== undefined) tab.isPinned = dto.isPinned;
    if (dto.isProtected !== undefined) {
      if (dto.isProtected && member.role !== 'owner') {
        throw new ForbiddenException('Only the business owner can set a tab as protected');
      }
      tab.isProtected = dto.isProtected;
    }

    const saved = await this.tabRepo.save(tab);
    return this.mapTab(saved);
  }

  /** Delete tab — Manager+; only Owner can delete protected tabs; cascades widgets */
  async delete(id: string, userId: string): Promise<void> {
    const tab = await this.findTabOrFail(id);
    const member = await this.requireMember(tab.businessId, userId);

    if (!MANAGER_ROLES.includes(member.role)) {
      throw new ForbiddenException('Manager or higher required to delete tabs');
    }
    if (tab.isProtected && member.role !== 'owner') {
      throw new ForbiddenException('Only the business owner can delete protected tabs');
    }

    // Widget cascade handled via DB onDelete: 'CASCADE' on widget.tabId
    await this.tabRepo.delete(id);
  }

  /**
   * Reorder tabs — Manager+; accepts [{id, order}] array;
   * updates all in a single transaction
   */
  async reorder(
    userId: string,
    orders: TabOrderItemDto[],
  ): Promise<void> {
    if (orders.length === 0) return;

    // Verify user is a member with manager+ on the first tab's business
    const firstTab = await this.findTabOrFail(orders[0].id);
    const member = await this.requireMember(firstTab.businessId, userId);
    if (!MANAGER_ROLES.includes(member.role)) {
      throw new ForbiddenException('Manager or higher required to reorder tabs');
    }

    await this.dataSource.transaction(async (em) => {
      for (const item of orders) {
        await em.update(Tab, { id: item.id }, { position: item.order });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async requireMember(businessId: string, userId: string): Promise<BusinessMember> {
    const member = await this.memberRepo.findOne({
      where: { businessId, userId, status: 'active' },
    });
    if (!member) throw new NotFoundException('Business not found or access denied');
    return member;
  }

  private async findTabOrFail(id: string): Promise<Tab> {
    const tab = await this.tabRepo.findOne({ where: { id } });
    if (!tab) throw new NotFoundException(`Tab ${id} not found`);
    return tab;
  }

  /** Map DB entity fields to GraphQL contract field names */
  private mapTab(tab: Tab): Tab & { iconColor: string; iconName: string; order: number } {
    return Object.assign(tab, {
      iconColor: tab.color,
      iconName: tab.icon,
      order: tab.position,
    });
  }
}
