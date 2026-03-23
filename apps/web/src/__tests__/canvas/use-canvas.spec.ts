import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasStore } from '../../store/canvas.store';
import type { IWidgetDto } from '@sbrb/shared-types';

// Mock Apollo
vi.mock('@apollo/client', () => ({
  useQuery: vi.fn(() => ({ data: undefined, loading: false })),
  useMutation: vi.fn(() => [vi.fn(), {}]),
  gql: (strings: TemplateStringsArray) => strings[0],
}));

// Mock detectCollision
vi.mock('@sbrb/shared-utils', () => ({
  detectCollision: vi.fn(() => []),
}));

// Mock antd message
vi.mock('antd', () => ({
  message: { error: vi.fn(), success: vi.fn() },
}));

// Mock auth store
vi.mock('../../store/auth.store', () => ({
  useAuthStore: {
    getState: () => ({ accessToken: 'test-token' }),
  },
}));

// Mock canvas operations
vi.mock('../../graphql/canvas.operations', () => ({
  WIDGETS_QUERY: 'WIDGETS_QUERY',
  UPDATE_WIDGET_MUTATION: 'UPDATE_WIDGET_MUTATION',
}));

import { useCanvas } from '../../hooks/use-canvas';
import { detectCollision } from '@sbrb/shared-utils';
import { message } from 'antd';

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

describe('useCanvas', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    useCanvasStore.setState({
      widgets: [makeWidget('w1', 0, 0), makeWidget('w2', 900, 0)],
      activeTabId: 'tab-1',
      tabs: [],
      zoom: 100,
      snapEnabled: true,
    });
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handleDragStop with no collision updates position', async () => {
    vi.mocked(detectCollision).mockReturnValue([]);
    const { result } = renderHook(() => useCanvas('tab-1'));

    act(() => {
      result.current.handleDragStop('w1', 50, 50);
    });

    const widget = useCanvasStore.getState().widgets.find((w) => w.id === 'w1');
    expect(widget?.position.x).toBe(50);
    expect(widget?.position.y).toBe(50);
  });

  it('handleDragStop with collision reverts position and shows error', () => {
    vi.mocked(detectCollision).mockReturnValue(['w2']);
    const { result } = renderHook(() => useCanvas('tab-1'));

    act(() => {
      result.current.handleDragStop('w1', 900, 0); // collides with w2
    });

    // Position should revert to original
    const widget = useCanvasStore.getState().widgets.find((w) => w.id === 'w1');
    expect(widget?.position.x).toBe(0);
    expect(message.error).toHaveBeenCalledWith('Vị trí đã có widget khác');
  });

  it('debounce: fetch PATCH only called once after 300ms', async () => {
    vi.mocked(detectCollision).mockReturnValue([]);
    const { result } = renderHook(() => useCanvas('tab-1'));

    act(() => {
      result.current.handleDragStop('w1', 50, 50);
      result.current.handleDragStop('w1', 60, 60);
      result.current.handleDragStop('w1', 70, 70);
    });

    // Before timer fires — no fetch yet
    expect(global.fetch).not.toHaveBeenCalled();

    // After 300ms
    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/widgets/w1/position',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('handleResizeStop with no collision updates position', () => {
    vi.mocked(detectCollision).mockReturnValue([]);
    const { result } = renderHook(() => useCanvas('tab-1'));

    act(() => {
      result.current.handleResizeStop('w1', { x: 0, y: 0 }, { w: 1000, h: 500 });
    });

    const widget = useCanvasStore.getState().widgets.find((w) => w.id === 'w1');
    expect(widget?.position.w).toBe(1000);
    expect(widget?.position.h).toBe(500);
  });

  it('server 409 on PATCH reverts to last valid position', async () => {
    vi.mocked(detectCollision).mockReturnValue([]);
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 409 });

    const { result } = renderHook(() => useCanvas('tab-1'));

    act(() => {
      result.current.handleDragStop('w1', 50, 50);
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(message.error).toHaveBeenCalledWith('Vị trí đã có widget khác (server)');
  });
});
