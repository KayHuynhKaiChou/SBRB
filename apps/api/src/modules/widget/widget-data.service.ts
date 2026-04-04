import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DataSheet } from '../datasheet/entities/data-sheet.entity';
import { DataSeries } from '../datasheet/entities/data-series.entity';
import { Widget } from './entities/widget.entity';
import { ChartData, ChartDataset, TrendBadge } from './dto/chart-data.dto';
import { UpdateDataLinkDto } from './dto/update-data-link.dto';
import { WidgetType } from './dto/widget.type';
import { AvailableSeriesType } from './dto/available-series.type';
import { WidgetAuthService } from './widget-auth.service';

/** 20-color standard chart palette */
const CHART_COLORS = [
  '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
  '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac',
  '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#ee5a24',
  '#009432', '#0652dd', '#833471', '#ea2027', '#006266',
];

/** Widget chart data retrieval + data-link management — SRS 4.5 */
@Injectable()
export class WidgetDataService {
  constructor(
    @InjectRepository(Widget)
    private readonly widgetRepo: Repository<Widget>,
    @InjectRepository(DataSheet)
    private readonly dataSheetRepo: Repository<DataSheet>,
    @InjectRepository(DataSeries)
    private readonly dataSeriesRepo: Repository<DataSeries>,
    private readonly widgetAuth: WidgetAuthService,
  ) {}

  /** Compute trend badge comparing last vs second-to-last period totals */
  private computeTrend(series: DataSeries[], periods: string[]): TrendBadge | null {
    if (periods.length < 2) return null;

    const lastPeriod = periods[periods.length - 1];
    const prevPeriod = periods[periods.length - 2];

    const sumPeriod = (label: string): number =>
      series.reduce((acc, s) => acc + (s.values[label] ?? 0), 0);

    const last = sumPeriod(lastPeriod);
    const prev = sumPeriod(prevPeriod);

    if (prev === 0) {
      return { value: 0, direction: 'neutral', vsLabel: prevPeriod };
    }

    const pct = ((last - prev) / Math.abs(prev)) * 100;
    const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral';

    return { value: Math.round(pct * 100) / 100, direction, vsLabel: prevPeriod };
  }

  /** Retrieve chart data for a widget — SRS 4.5.2 */
  async getChartData(widgetId: string, userId: string): Promise<ChartData> {
    const { widget } = await this.widgetAuth.assertMemberByWidgetId(widgetId, userId);

    if (!widget.dataSheetId) {
      return { labels: [], datasets: [], trend: null };
    }

    const dataSheet = await this.dataSheetRepo.findOne({ where: { id: widget.dataSheetId } });
    if (!dataSheet) {
      return { labels: [], datasets: [], trend: null };
    }

    // Always load ALL series — frontend handles filtering by selectedSeries
    const allSeries = await this.dataSeriesRepo.find({
      where: { dataSheetId: widget.dataSheetId },
      order: { rowIndex: 'ASC' },
    });

    // Determine active period labels
    const labels: string[] =
      widget.selectedPeriods && widget.selectedPeriods.length > 0
        ? widget.selectedPeriods
        : dataSheet.periodHeaders;

    const datasets: ChartDataset[] = allSeries.map((s, i) => ({
      label: s.seriesName,
      data: labels.map((p) => s.values[p] ?? 0),
      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
      borderColor: CHART_COLORS[i % CHART_COLORS.length],
    }));

    const trend = this.computeTrend(allSeries, labels);

    return { labels, datasets, trend };
  }

  /** Map Widget entity to GraphQL WidgetType contract */
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
      position: { x: widget.x, y: widget.y, w: widget.w, h: widget.h },
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

  /** Update widget chart config JSONB — SRS 4.5.3 */
  async updateConfig(widgetId: string, userId: string, config: Record<string, unknown>): Promise<WidgetType> {
    const { widget, businessId } = await this.widgetAuth.assertManagerByWidgetId(widgetId, userId);
    // Extract name (separate column) from config payload
    if (config.name !== undefined) {
      widget.name = config.name as string;
      const { name: _, ...chartConfig } = config;
      widget.config = chartConfig;
    } else {
      widget.config = config;
    }
    const saved = await this.widgetRepo.save(widget);
    return this.mapWidget(saved, businessId);
  }

  /** Link a widget to a DataSheet with series/period filters — SRS 4.5.4 */
  async updateDataLink(widgetId: string, userId: string, dto: UpdateDataLinkDto): Promise<WidgetType> {
    const { widget, businessId } = await this.widgetAuth.assertManagerByWidgetId(widgetId, userId);

    const dataSheet = await this.dataSheetRepo.findOne({ where: { id: dto.dataSheetId } });
    if (!dataSheet) throw new NotFoundException('DataSheet not found');
    if (dataSheet.businessId !== businessId) {
      throw new BadRequestException('DataSheet does not belong to this business');
    }

    // Validate selected series belong to the datasheet
    if (dto.selectedSeries.length > 0) {
      const seriesList = await this.dataSeriesRepo.find({
        where: { dataSheetId: dto.dataSheetId, id: In(dto.selectedSeries) },
      });
      if (seriesList.length !== dto.selectedSeries.length) {
        throw new BadRequestException('One or more selectedSeries IDs are invalid for this datasheet');
      }
    }

    // Validate selected periods are subset of datasheet period headers
    if (dto.selectedPeriods && dto.selectedPeriods.length > 0) {
      const invalid = dto.selectedPeriods.filter((p) => !dataSheet.periodHeaders.includes(p));
      if (invalid.length > 0) {
        throw new BadRequestException(`Invalid period(s): ${invalid.join(', ')}`);
      }
    }

    widget.dataSheetId = dto.dataSheetId;
    widget.selectedSeries = dto.selectedSeries;
    widget.selectedPeriods = dto.selectedPeriods ?? null;

    const saved = await this.widgetRepo.save(widget);
    return this.mapWidget(saved, businessId);
  }

  /** Fetch all series for the widget's linked datasheet (for settings panel checkboxes) */
  async getAvailableSeries(widgetId: string, userId: string): Promise<AvailableSeriesType[]> {
    const { widget } = await this.widgetAuth.assertMemberByWidgetId(widgetId, userId);
    if (!widget.dataSheetId) return [];
    const series = await this.dataSeriesRepo.find({
      where: { dataSheetId: widget.dataSheetId },
      order: { rowIndex: 'ASC' },
      select: ['id', 'seriesName'],
    });
    return series.map(s => ({ id: s.id, name: s.seriesName }));
  }

  /** Clear all data link fields from a widget — SRS 4.5.5 */
  async removeDataLink(widgetId: string, userId: string): Promise<WidgetType> {
    const { widget, businessId } = await this.widgetAuth.assertManagerByWidgetId(widgetId, userId);

    widget.dataSheetId = null;
    widget.selectedSeries = [];
    widget.selectedPeriods = null;

    const saved = await this.widgetRepo.save(widget);
    return this.mapWidget(saved, businessId);
  }
}
