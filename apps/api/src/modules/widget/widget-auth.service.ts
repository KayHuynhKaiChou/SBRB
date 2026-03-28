import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity';
import { BusinessMember } from '../business/entities/business-member.entity';
import { Tab } from '../tab/entities/tab.entity';
import { Widget } from './entities/widget.entity';

/** Shared widget authorization helpers — SRS 4.4 / 4.5 */
@Injectable()
export class WidgetAuthService {
  constructor(
    @InjectRepository(Widget)
    private readonly widgetRepo: Repository<Widget>,
    @InjectRepository(Tab)
    private readonly tabRepo: Repository<Tab>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
  ) {}

  /** Verify user is a member (any role) — returns widget + businessId */
  async assertMemberByWidgetId(widgetId: string, userId: string): Promise<{ widget: Widget; businessId: string }> {
    const widget = await this.widgetRepo.findOne({ where: { id: widgetId } });
    if (!widget) throw new NotFoundException('Widget not found');

    const tab = await this.tabRepo.findOne({ where: { id: widget.tabId } });
    if (!tab) throw new NotFoundException('Tab not found');

    const member = await this.memberRepo.findOne({ where: { businessId: tab.businessId, userId } });
    if (!member) throw new ForbiddenException('Not a member of this business');

    return { widget, businessId: tab.businessId };
  }

  /** Verify user is Manager+ — returns widget, businessId, and business entity */
  async assertManagerByWidgetId(
    widgetId: string,
    userId: string,
  ): Promise<{ widget: Widget; businessId: string; business: Business }> {
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

    return { widget, businessId: tab.businessId, business };
  }
}
