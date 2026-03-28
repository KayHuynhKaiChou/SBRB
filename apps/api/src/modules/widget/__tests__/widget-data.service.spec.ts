import 'reflect-metadata';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSheet } from '../../datasheet/entities/data-sheet.entity';
import { DataSeries } from '../../datasheet/entities/data-series.entity';
import { Tab } from '../../tab/entities/tab.entity';
import { Widget } from '../entities/widget.entity';
import { WidgetDataService } from '../widget-data.service';

/** Build a mock TypeORM repository */
function mockRepo(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn((e: any) => Promise.resolve(e)),
    ...overrides,
  } as unknown as any;
}

/** Build a mock WidgetAuthService */
function mockWidgetAuth(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    assertMemberByWidgetId: jest.fn(),
    assertManagerByWidgetId: jest.fn(),
    ...overrides,
  } as unknown as any;
}

function makeWidget(partial: Partial<Widget> = {}): Widget {
  return Object.assign(new Widget(), {
    id: 'w1',
    tabId: 'tab1',
    dataSheetId: null,
    selectedSeries: [],
    selectedPeriods: null,
    config: {},
    ...partial,
  });
}

function makeTab(businessId = 'biz1'): Tab {
  return Object.assign(new Tab(), { id: 'tab1', businessId });
}

function makeDataSheet(partial: Partial<DataSheet> = {}): DataSheet {
  return Object.assign(new DataSheet(), {
    id: 'ds1',
    businessId: 'biz1',
    periodHeaders: ['2024-01', '2024-02', '2024-03'],
    ...partial,
  });
}

function makeDataSeries(partial: Partial<DataSeries> = {}): DataSeries {
  return Object.assign(new DataSeries(), {
    id: 'ser1',
    dataSheetId: 'ds1',
    seriesName: 'Revenue',
    rowIndex: 0,
    values: { '2024-01': 100, '2024-02': 200, '2024-03': 300 },
    ...partial,
  });
}

function buildService(
  widgetMock?: any,
  dataSheetMock?: any,
  dataSeriesMock?: any,
  widgetAuthMock?: any,
): WidgetDataService {
  return new WidgetDataService(
    widgetMock ?? mockRepo(),
    dataSheetMock ?? mockRepo(),
    dataSeriesMock ?? mockRepo(),
    widgetAuthMock ?? mockWidgetAuth(),
  );
}

describe('WidgetDataService', () => {
  // ── getChartData ────────────────────────────────────────────────────────────

  it('getChartData: returns empty when no dataSheetId', async () => {
    const widget = makeWidget({ dataSheetId: null });

    const svc = buildService(
      mockRepo(),
      mockRepo(),
      mockRepo(),
      mockWidgetAuth({
        assertMemberByWidgetId: jest.fn().mockResolvedValue({ widget, businessId: 'biz1' }),
      }),
    );

    const result = await svc.getChartData('w1', 'u1');
    expect(result).toEqual({ labels: [], datasets: [], trend: null });
  });

  it('getChartData: returns correct labels/datasets when linked', async () => {
    const widget = makeWidget({ dataSheetId: 'ds1', selectedSeries: [], selectedPeriods: null });
    const ds = makeDataSheet();
    const series = [makeDataSeries()];

    const svc = buildService(
      mockRepo(),
      mockRepo({ findOne: jest.fn().mockResolvedValue(ds) }),
      mockRepo({ find: jest.fn().mockResolvedValue(series) }),
      mockWidgetAuth({
        assertMemberByWidgetId: jest.fn().mockResolvedValue({ widget, businessId: 'biz1' }),
      }),
    );

    const result = await svc.getChartData('w1', 'u1');
    expect(result.labels).toEqual(['2024-01', '2024-02', '2024-03']);
    expect(result.datasets).toHaveLength(1);
    expect(result.datasets[0].label).toBe('Revenue');
    expect(result.datasets[0].data).toEqual([100, 200, 300]);
  });

  it('getChartData: filters periods correctly when selectedPeriods set', async () => {
    const widget = makeWidget({ dataSheetId: 'ds1', selectedSeries: [], selectedPeriods: ['2024-02', '2024-03'] });
    const ds = makeDataSheet();
    const series = [makeDataSeries()];

    const svc = buildService(
      mockRepo(),
      mockRepo({ findOne: jest.fn().mockResolvedValue(ds) }),
      mockRepo({ find: jest.fn().mockResolvedValue(series) }),
      mockWidgetAuth({
        assertMemberByWidgetId: jest.fn().mockResolvedValue({ widget, businessId: 'biz1' }),
      }),
    );

    const result = await svc.getChartData('w1', 'u1');
    expect(result.labels).toEqual(['2024-02', '2024-03']);
    expect(result.datasets[0].data).toEqual([200, 300]);
  });

  it('getChartData: trend calculates up correctly', async () => {
    // 100 → 200 = +100%
    const series = [makeDataSeries({ values: { '2024-01': 100, '2024-02': 200 } })];
    const widget = makeWidget({ dataSheetId: 'ds1', selectedSeries: [], selectedPeriods: null });
    const ds = makeDataSheet({ periodHeaders: ['2024-01', '2024-02'] });

    const svc = buildService(
      mockRepo(),
      mockRepo({ findOne: jest.fn().mockResolvedValue(ds) }),
      mockRepo({ find: jest.fn().mockResolvedValue(series) }),
      mockWidgetAuth({
        assertMemberByWidgetId: jest.fn().mockResolvedValue({ widget, businessId: 'biz1' }),
      }),
    );

    const result = await svc.getChartData('w1', 'u1');
    expect(result.trend?.direction).toBe('up');
    expect(result.trend?.value).toBe(100);
    expect(result.trend?.vsLabel).toBe('2024-01');
  });

  it('getChartData: trend calculates down correctly', async () => {
    // 200 → 100 = -50%
    const series = [makeDataSeries({ values: { '2024-01': 200, '2024-02': 100 } })];
    const widget = makeWidget({ dataSheetId: 'ds1', selectedSeries: [], selectedPeriods: null });
    const ds = makeDataSheet({ periodHeaders: ['2024-01', '2024-02'] });

    const svc = buildService(
      mockRepo(),
      mockRepo({ findOne: jest.fn().mockResolvedValue(ds) }),
      mockRepo({ find: jest.fn().mockResolvedValue(series) }),
      mockWidgetAuth({
        assertMemberByWidgetId: jest.fn().mockResolvedValue({ widget, businessId: 'biz1' }),
      }),
    );

    const result = await svc.getChartData('w1', 'u1');
    expect(result.trend?.direction).toBe('down');
    expect(result.trend?.value).toBe(-50);
  });

  // ── updateConfig ────────────────────────────────────────────────────────────

  it('updateConfig: saves config JSONB', async () => {
    const widget = makeWidget();
    const saved = { ...widget, config: { chartType: 'bar' } };

    const widgetMock = mockRepo({ save: jest.fn().mockResolvedValue(saved) });

    const svc = buildService(
      widgetMock,
      mockRepo(),
      mockRepo(),
      mockWidgetAuth({
        assertManagerByWidgetId: jest.fn().mockResolvedValue({ widget, businessId: 'biz1', business: {} }),
      }),
    );

    const result = await svc.updateConfig('w1', 'u1', { chartType: 'bar' });
    expect(widgetMock.save).toHaveBeenCalled();
    expect(result.config).toEqual({ chartType: 'bar' });
  });

  // ── updateDataLink ──────────────────────────────────────────────────────────

  it('updateDataLink: throws if DataSheet does not belong to business', async () => {
    const widget = makeWidget();
    const ds = makeDataSheet({ businessId: 'other-biz' }); // different business

    const svc = buildService(
      mockRepo(),
      mockRepo({ findOne: jest.fn().mockResolvedValue(ds) }),
      mockRepo(),
      mockWidgetAuth({
        assertManagerByWidgetId: jest.fn().mockResolvedValue({ widget, businessId: 'biz1', business: {} }),
      }),
    );

    await expect(
      svc.updateDataLink('w1', 'u1', { dataSheetId: 'ds1', selectedSeries: [], selectedPeriods: null }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateDataLink: throws if selectedSeries IDs are invalid', async () => {
    const widget = makeWidget();
    const ds = makeDataSheet();

    // Only 0 series returned but 1 requested → mismatch
    const svc = buildService(
      mockRepo(),
      mockRepo({ findOne: jest.fn().mockResolvedValue(ds) }),
      mockRepo({ find: jest.fn().mockResolvedValue([]) }),
      mockWidgetAuth({
        assertManagerByWidgetId: jest.fn().mockResolvedValue({ widget, businessId: 'biz1', business: {} }),
      }),
    );

    await expect(
      svc.updateDataLink('w1', 'u1', { dataSheetId: 'ds1', selectedSeries: ['bad-id'], selectedPeriods: null }),
    ).rejects.toThrow(BadRequestException);
  });

  // ── removeDataLink ──────────────────────────────────────────────────────────

  it('removeDataLink: clears all data link fields', async () => {
    const widget = makeWidget({ dataSheetId: 'ds1', selectedSeries: ['ser1'], selectedPeriods: ['2024-01'] });

    const widgetMock = mockRepo({
      save: jest.fn().mockImplementation((w) => Promise.resolve(w)),
    });

    const svc = buildService(
      widgetMock,
      mockRepo(),
      mockRepo(),
      mockWidgetAuth({
        assertManagerByWidgetId: jest.fn().mockResolvedValue({ widget, businessId: 'biz1', business: {} }),
      }),
    );

    const result = await svc.removeDataLink('w1', 'u1');
    expect(result.dataSheetId).toBeNull();
    expect(result.selectedSeries).toEqual([]);
    expect(result.selectedPeriods).toBeNull();
  });

  it('getChartData: throws ForbiddenException for non-member', async () => {
    const svc = buildService(
      mockRepo(),
      mockRepo(),
      mockRepo(),
      mockWidgetAuth({
        assertMemberByWidgetId: jest.fn().mockRejectedValue(new ForbiddenException('Not a member')),
      }),
    );

    await expect(svc.getChartData('w1', 'u1')).rejects.toThrow(ForbiddenException);
  });

  it('getChartData: returns empty when dataSheet not found', async () => {
    const widget = makeWidget({ dataSheetId: 'ds1' });

    const svc = buildService(
      mockRepo(),
      mockRepo({ findOne: jest.fn().mockResolvedValue(null) }), // DS not found
      mockRepo({ find: jest.fn().mockResolvedValue([]) }),
      mockWidgetAuth({
        assertMemberByWidgetId: jest.fn().mockResolvedValue({ widget, businessId: 'biz1' }),
      }),
    );

    const result = await svc.getChartData('w1', 'u1');
    expect(result).toEqual({ labels: [], datasets: [], trend: null });
  });

  it('updateDataLink: throws NotFoundException if DataSheet not found', async () => {
    const widget = makeWidget();

    const svc = buildService(
      mockRepo(),
      mockRepo({ findOne: jest.fn().mockResolvedValue(null) }), // DS not found
      mockRepo(),
      mockWidgetAuth({
        assertManagerByWidgetId: jest.fn().mockResolvedValue({ widget, businessId: 'biz1', business: {} }),
      }),
    );

    await expect(
      svc.updateDataLink('w1', 'u1', { dataSheetId: 'ds1', selectedSeries: [], selectedPeriods: null }),
    ).rejects.toThrow(NotFoundException);
  });
});
