import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../../store/canvas.store';
import type { ITabDto, IWidgetDto } from '@sbrb/shared-types';

const makeWidget = (id: string, x = 0, y = 0, w = 800, h = 400): IWidgetDto => ({
  id,
  tabId: 'tab-1',
  businessId: 'biz-1',
  name: `Widget ${id}`,
  metricName: '',
  unit: '',
  position: { x, y, w, h },
  chartConfig: { type: 'bar', colorIndex: 0, showLabels: false, yAxisFromZero: true, showLegend: false },
  dataLink: null,
  isRestricted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const makeTab = (id: string): ITabDto => ({
  id,
  businessId: 'biz-1',
  name: `Tab ${id}`,
  iconColor: '#1677ff',
  iconName: 'chart-bar',
  order: 0,
  isPinned: false,
  isProtected: false,
  createdAt: new Date().toISOString(),
});

describe('useCanvasStore', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      tabs: [],
      activeTabId: null,
      widgets: [],
      zoom: 100,
      snapEnabled: true,
    });
  });

  it('setTabs replaces tabs array', () => {
    const tabs = [makeTab('t1'), makeTab('t2')];
    useCanvasStore.getState().setTabs(tabs);
    expect(useCanvasStore.getState().tabs).toHaveLength(2);
    expect(useCanvasStore.getState().tabs[0].id).toBe('t1');
  });

  it('setActiveTab updates activeTabId', () => {
    useCanvasStore.getState().setActiveTab('tab-xyz');
    expect(useCanvasStore.getState().activeTabId).toBe('tab-xyz');
  });

  it('setActiveTab accepts null', () => {
    useCanvasStore.getState().setActiveTab('tab-xyz');
    useCanvasStore.getState().setActiveTab(null);
    expect(useCanvasStore.getState().activeTabId).toBeNull();
  });

  it('setWidgets replaces widgets array', () => {
    const widgets = [makeWidget('w1'), makeWidget('w2')];
    useCanvasStore.getState().setWidgets(widgets);
    expect(useCanvasStore.getState().widgets).toHaveLength(2);
  });

  it('updateWidgetPosition updates only matching widget', () => {
    useCanvasStore.getState().setWidgets([makeWidget('w1', 0, 0), makeWidget('w2', 100, 100)]);
    useCanvasStore.getState().updateWidgetPosition('w1', { x: 200, y: 300, w: 900, h: 500 });

    const updated = useCanvasStore.getState().widgets;
    expect(updated.find((w) => w.id === 'w1')?.position).toEqual({ x: 200, y: 300, w: 900, h: 500 });
    expect(updated.find((w) => w.id === 'w2')?.position).toEqual({ x: 100, y: 100, w: 800, h: 400 });
  });

  it('updateWidgetPosition does nothing for unknown id', () => {
    useCanvasStore.getState().setWidgets([makeWidget('w1')]);
    useCanvasStore.getState().updateWidgetPosition('unknown', { x: 999, y: 999, w: 800, h: 400 });
    expect(useCanvasStore.getState().widgets[0].position.x).toBe(0);
  });

  it('setZoom updates zoom level', () => {
    useCanvasStore.getState().setZoom(50);
    expect(useCanvasStore.getState().zoom).toBe(50);
    useCanvasStore.getState().setZoom(125);
    expect(useCanvasStore.getState().zoom).toBe(125);
  });

  it('toggleSnap flips snapEnabled', () => {
    expect(useCanvasStore.getState().snapEnabled).toBe(true);
    useCanvasStore.getState().toggleSnap();
    expect(useCanvasStore.getState().snapEnabled).toBe(false);
    useCanvasStore.getState().toggleSnap();
    expect(useCanvasStore.getState().snapEnabled).toBe(true);
  });
});
