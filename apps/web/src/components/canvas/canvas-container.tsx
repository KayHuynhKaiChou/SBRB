import React from 'react';
import { Typography } from 'antd';
import { CANVAS_DEFAULT_WIDTH, CANVAS_DEFAULT_HEIGHT } from '@sbrb/shared-constants';
import { useCanvas } from '../../hooks/use-canvas';
import { useCanvasStore } from '../../store/canvas.store';
import { WidgetCard } from './widget-card';

const { Text } = Typography;

interface ICanvasContainerProps {
  tabId: string;
  onAddWidget: () => void;
  onEditWidget: (id: string) => void;
  onDeleteWidget: (id: string) => void;
  onOpenDataSelector?: (widgetId: string) => void;
}

export function CanvasContainer({
  tabId,
  onAddWidget,
  onEditWidget,
  onDeleteWidget,
  onOpenDataSelector,
}: ICanvasContainerProps) {
  const { widgets, snapEnabled, handleDragStop, handleResizeStop } = useCanvas(tabId);
  const { zoom } = useCanvasStore();

  return (
    <div data-canvas-scroll className="relative flex-1 overflow-auto bg-[#EEF2FF]">
      {/* Scrollable canvas area — width/height are dynamic (zoom-computed), kept as inline */}
      <div
        style={{
          width: CANVAS_DEFAULT_WIDTH * (zoom / 100),
          height: CANVAS_DEFAULT_HEIGHT * (zoom / 100),
        }}
        className="relative min-w-full min-h-full"
      >
        {/* Canvas surface with zoom transform — transform/size/bg-image are dynamic, kept as inline */}
        <div
          style={{
            width: CANVAS_DEFAULT_WIDTH,
            height: CANVAS_DEFAULT_HEIGHT,
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            backgroundImage: snapEnabled
              ? 'radial-gradient(circle, #c5cef0 1px, transparent 1px)'
              : 'none',
            backgroundSize: '20px 20px',
          }}
          className="absolute top-0 left-0 bg-[#EEF2FF]"
        >
          {widgets.map((w) => (
            <WidgetCard
              key={w.id}
              widget={w}
              snapEnabled={snapEnabled}
              onEdit={onEditWidget}
              onDelete={onDeleteWidget}
              onDragStop={handleDragStop}
              onResizeStop={handleResizeStop}
              onOpenDataSelector={onOpenDataSelector}
            />
          ))}

          {widgets.length === 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <Text type="secondary" className="!text-sm">
                Chưa có widget nào. Nhấn "+ Widget" để thêm mới.
              </Text>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
