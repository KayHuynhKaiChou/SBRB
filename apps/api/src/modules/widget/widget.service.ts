import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { detectCollision, findFirstEmptyPosition, snapPosition, validatePosition } from '@sbrb/shared-utils';
import { MAX_WIDGETS_PER_TAB } from '@sbrb/shared-constants';
import { Business } from '../business/entities/business.entity';
import { Tab } from '../tab/entities/tab.entity';
import { AuthorizationService } from '../../common/services/authorization.service';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { UpdateWidgetPositionDto } from './dto/update-widget-position.dto';
import { WidgetType } from './dto/widget.type';
import { AlertThreshold } from './entities/alert-threshold.entity';
import { Widget } from './entities/widget.entity';
import { WidgetAuthService } from './widget-auth.service';

/** Widget CRUD + position update with collision detection — SRS 4.4 / 4.5 */
@Injectable()
export class WidgetService {
  constructor(
    @InjectRepository(Widget)
    private readonly widgetRepo: Repository<Widget>,
    @InjectRepository(AlertThreshold)
    private readonly alertRepo: Repository<AlertThreshold>,
    @InjectRepository(Tab)
    private readonly tabRepo: Repository<Tab>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    private readonly widgetAuth: WidgetAuthService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  /** Verify user is Manager+ in the business that owns the tab */
  private async assertManagerRole(tabId: string, userId: string): Promise<{ tab: Tab; business: Business }> {
    const tab = await this.tabRepo.findOne({ where: { id: tabId } });
    if (!tab) throw new NotFoundException('Tab not found');

    const business = await this.businessRepo.findOne({ where: { id: tab.businessId } });
    if (!business) throw new NotFoundException('Business not found');

    await this.authorizationService.requireManager(tab.businessId, userId);

    return { tab, business };
  }

  /** Verify user is a member (any role) in the business that owns the tab */
  private async assertMemberAccess(tabId: string, userId: string): Promise<Tab> {
    const tab = await this.tabRepo.findOne({ where: { id: tabId } });
    if (!tab) throw new NotFoundException('Tab not found');

    await this.authorizationService.requireMember(tab.businessId, userId);

    return tab;
  }

  async findByTab(tabId: string, userId: string): Promise<WidgetType[]> {
    const tab = await this.assertMemberAccess(tabId, userId);
    const widgets = await this.widgetRepo.find({ where: { tabId } });
    return widgets.map((w) => this.mapWidget(w, tab.businessId));
  }

  async findById(id: string, userId: string): Promise<WidgetType> {
    const widget = await this.widgetRepo.findOne({ where: { id } });
    if (!widget) throw new NotFoundException('Widget not found');

    const tab = await this.tabRepo.findOne({ where: { id: widget.tabId } });
    if (!tab) throw new NotFoundException('Tab not found');

    await this.authorizationService.requireMember(tab.businessId, userId);

    return this.mapWidget(widget, tab.businessId);
  }

  async create(tabId: string, userId: string, dto: CreateWidgetDto): Promise<WidgetType> {
    const { tab, business } = await this.assertManagerRole(tabId, userId);

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

    const defaultSize = { w: dto.position?.w ?? 1000, h: dto.position?.h ?? 500 };
    const position = dto.position
      ? { x: dto.position.x ?? 20, y: dto.position.y ?? 20, ...defaultSize }
      : findFirstEmptyPosition(existingPositions, defaultSize, business.canvasWidth);

    const widget = this.widgetRepo.create({
      tabId,
      createdBy: userId,
      name: dto.name,
      metricName: dto.metricName ?? null,
      unit: dto.unit ?? null,
      config: {},
      isRestricted: dto.isRestricted ?? false,
      dataSheetId: null,
      x: position.x,
      y: position.y,
      w: position.w,
      h: position.h,
    });

    const saved = await this.widgetRepo.save(widget);
    return this.mapWidget(saved, tab.businessId);
  }

  async update(id: string, userId: string, dto: UpdateWidgetDto): Promise<WidgetType> {
    const { widget, businessId } = await this.widgetAuth.assertManagerByWidgetId(id, userId);

    if (dto.name !== undefined) widget.name = dto.name;
    if (dto.metricName !== undefined) widget.metricName = dto.metricName ?? null;
    if (dto.unit !== undefined) widget.unit = dto.unit ?? null;
    if (dto.isRestricted !== undefined) widget.isRestricted = dto.isRestricted;

    const saved = await this.widgetRepo.save(widget);
    return this.mapWidget(saved, businessId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { widget } = await this.widgetAuth.assertManagerByWidgetId(id, userId);

    // Cascade delete alert thresholds first (FK has CASCADE but we ensure it explicitly)
    await this.alertRepo.delete({ widgetId: widget.id });
    await this.widgetRepo.delete(widget.id);
  }

  /**
   * Update widget position with snap + collision detection — SRS 4.4.3/4.4.4
   * REST: PATCH /api/v1/widgets/:id/position (debounced 300ms client-side)
   */
  async updatePosition(id: string, userId: string, dto: UpdateWidgetPositionDto): Promise<Widget> {
    const { widget, business } = await this.widgetAuth.assertManagerByWidgetId(id, userId);

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

  /** Map Widget entity to GraphQL response contract (nested position, chartConfig, businessId) */
  private mapWidget(widget: Widget, businessId: string): WidgetType {
    const config = widget.config as Record<string, unknown> | null ?? {};
    return {
      id: widget.id,
      tabId: widget.tabId,
      businessId,
      createdBy: widget.createdBy,
      name: widget.name,
      metricName: widget.metricName,
      unit: widget.unit,
      position: {
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h,
      },
      chartConfig: {
        type: (config['type'] as string) ?? null,
        colorIndex: (config['colorIndex'] as number) ?? null,
        showLabels: (config['showLabels'] as boolean) ?? null,
        yAxisFromZero: (config['yAxisFromZero'] as boolean) ?? null,
        showLegend: (config['showLegend'] as boolean) ?? null,
      },
      config: widget.config as Record<string, unknown> | null,
      dataSheetId: widget.dataSheetId,
      selectedSeries: widget.selectedSeries,
      selectedPeriods: widget.selectedPeriods,
      isRestricted: widget.isRestricted,
      createdAt: widget.createdAt,
      updatedAt: widget.updatedAt,
    };
  }
}
