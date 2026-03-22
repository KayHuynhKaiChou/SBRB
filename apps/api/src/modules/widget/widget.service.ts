import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { detectCollision, findFirstEmptyPosition, snapPosition, validatePosition } from '@sbrb/shared-utils';
import { MAX_WIDGETS_PER_TAB } from '@sbrb/shared-constants';
import { BusinessMember } from '../business/entities/business-member.entity';
import { Business } from '../business/entities/business.entity';
import { Tab } from '../tab/entities/tab.entity';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { UpdateWidgetPositionDto } from './dto/update-widget-position.dto';
import { AlertThreshold } from './entities/alert-threshold.entity';
import { Widget } from './entities/widget.entity';

/** Widget CRUD + position update with collision detection — SRS 4.4 / 4.5 */
@Injectable()
export class WidgetService {
  constructor(
    @InjectRepository(Widget)
    private readonly widgetRepo: Repository<Widget>,
    @InjectRepository(AlertThreshold)
    private readonly alertRepo: Repository<AlertThreshold>,
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
    @InjectRepository(Tab)
    private readonly tabRepo: Repository<Tab>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
  ) {}

  /** Verify user is Manager+ in the business that owns the tab */
  private async assertManagerRole(tabId: string, userId: string): Promise<{ tab: Tab; business: Business }> {
    const tab = await this.tabRepo.findOne({ where: { id: tabId } });
    if (!tab) throw new NotFoundException('Tab not found');

    const business = await this.businessRepo.findOne({ where: { id: tab.businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const member = await this.memberRepo.findOne({ where: { businessId: tab.businessId, userId } });
    if (!member || !['owner', 'manager'].includes(member.role)) {
      throw new ForbiddenException('Manager or above role required');
    }

    return { tab, business };
  }

  /** Verify user is a member (any role) in the business that owns the tab */
  private async assertMemberAccess(tabId: string, userId: string): Promise<Tab> {
    const tab = await this.tabRepo.findOne({ where: { id: tabId } });
    if (!tab) throw new NotFoundException('Tab not found');

    const member = await this.memberRepo.findOne({ where: { businessId: tab.businessId, userId } });
    if (!member) throw new ForbiddenException('Not a member of this business');

    return tab;
  }

  /** Verify user has Manager+ access by widgetId */
  private async assertManagerByWidgetId(widgetId: string, userId: string): Promise<{ widget: Widget; business: Business }> {
    const widget = await this.widgetRepo.findOne({ where: { id: widgetId } });
    if (!widget) throw new NotFoundException('Widget not found');

    const tab = await this.tabRepo.findOne({ where: { id: widget.tabId } });
    if (!tab) throw new NotFoundException('Tab not found');

    const business = await this.businessRepo.findOne({ where: { id: tab.businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const member = await this.memberRepo.findOne({ where: { businessId: tab.businessId, userId } });
    if (!member || !['owner', 'manager'].includes(member.role)) {
      throw new ForbiddenException('Manager or above role required');
    }

    return { widget, business };
  }

  async findByTab(tabId: string, userId: string): Promise<Widget[]> {
    await this.assertMemberAccess(tabId, userId);
    return this.widgetRepo.find({ where: { tabId } });
  }

  async findById(id: string, userId: string): Promise<Widget> {
    const widget = await this.widgetRepo.findOne({ where: { id } });
    if (!widget) throw new NotFoundException('Widget not found');

    const tab = await this.tabRepo.findOne({ where: { id: widget.tabId } });
    if (!tab) throw new NotFoundException('Tab not found');

    const member = await this.memberRepo.findOne({ where: { businessId: tab.businessId, userId } });
    if (!member) throw new ForbiddenException('Not a member of this business');

    return widget;
  }

  async create(tabId: string, userId: string, dto: CreateWidgetDto): Promise<Widget> {
    const { business } = await this.assertManagerRole(tabId, userId);

    const count = await this.widgetRepo.count({ where: { tabId } });
    if (count >= MAX_WIDGETS_PER_TAB) {
      throw new BadRequestException(`Maximum ${MAX_WIDGETS_PER_TAB} widgets per tab reached`);
    }

    // Find first empty position to avoid overlap on creation
    const existing = await this.widgetRepo.find({ where: { tabId } });
    const existingPositions = existing.map((w) => ({
      id: w.id,
      position: { x: w.x, y: w.y, w: w.w, h: w.h },
    }));

    const defaultSize = { w: 1000, h: 500 };
    const position = findFirstEmptyPosition(existingPositions, defaultSize, business.canvasWidth);

    const widget = this.widgetRepo.create({
      tabId,
      createdBy: userId,
      name: dto.name,
      metricName: dto.metric_name ?? null,
      unit: dto.unit ?? null,
      config: dto.config ?? {},
      isRestricted: dto.is_restricted ?? false,
      dataSheetId: dto.data_sheet_id ?? null,
      x: position.x,
      y: position.y,
      w: position.w,
      h: position.h,
    });

    return this.widgetRepo.save(widget);
  }

  async update(id: string, userId: string, dto: UpdateWidgetDto): Promise<Widget> {
    const { widget } = await this.assertManagerByWidgetId(id, userId);

    if (dto.name !== undefined) widget.name = dto.name;
    if (dto.metric_name !== undefined) widget.metricName = dto.metric_name ?? null;
    if (dto.unit !== undefined) widget.unit = dto.unit ?? null;
    if (dto.config !== undefined) widget.config = dto.config;
    if (dto.is_restricted !== undefined) widget.isRestricted = dto.is_restricted;

    return this.widgetRepo.save(widget);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { widget } = await this.assertManagerByWidgetId(id, userId);

    // Cascade delete alert thresholds first (FK has CASCADE but we ensure it explicitly)
    await this.alertRepo.delete({ widgetId: widget.id });
    await this.widgetRepo.delete(widget.id);
  }

  /**
   * Update widget position with snap + collision detection — SRS 4.4.3/4.4.4
   * REST: PATCH /api/v1/widgets/:id/position (debounced 300ms client-side)
   */
  async updatePosition(id: string, userId: string, dto: UpdateWidgetPositionDto): Promise<Widget> {
    const { widget, business } = await this.assertManagerByWidgetId(id, userId);

    const snapped = snapPosition(dto);
    const newPosition = { x: snapped.x, y: snapped.y, w: snapped.w, h: snapped.h };

    // Validate bounds and size constraints
    const errors = validatePosition(newPosition, business.canvasWidth, business.canvasHeight);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    // Load sibling widgets for collision check
    const siblings = await this.widgetRepo.find({ where: { tabId: widget.tabId, id: Not(id) } });
    const siblingPositions = siblings.map((w) => ({
      id: w.id,
      position: { x: w.x, y: w.y, w: w.w, h: w.h },
    }));

    const conflictIds = detectCollision(newPosition, siblingPositions);
    if (conflictIds.length > 0) {
      const conflictWidgets = siblings.filter((w) => conflictIds.includes(w.id));
      throw new ConflictException({
        conflicts: conflictWidgets.map((w) => ({
          id: w.id,
          name: w.name,
          x: w.x,
          y: w.y,
          w: w.w,
          h: w.h,
        })),
      });
    }

    widget.x = newPosition.x;
    widget.y = newPosition.y;
    widget.w = newPosition.w;
    widget.h = newPosition.h;

    return this.widgetRepo.save(widget);
  }
}
