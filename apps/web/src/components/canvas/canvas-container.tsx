import React from 'react';
import { Typography } from 'antd';
import { useCanvas } from '../../hooks/use-canvas';
import { useCanvasStore } from '../../store/canvas.store';
import { WidgetCard } from './widget-card';
import { CanvasControls } from './canvas-controls';

const { Text } = Typography;

const CANVAS_WIDTH = 3200;
const CANVAS_HEIGHT = 4800;

interface ICanvasContainerProps {
  tabId: string;
  onAddWidget: () => void;
  onEditWidget: (id: string) => void;
  onDeleteWidget: (id: string) => void;
}

export function CanvasContainer({
  tabId,
  onAddWidget,
  onEditWidget,
  onDeleteWidget,
}: ICanvasContainerProps) {
  const { widgets, snapEnabled, handleDragStop, handleResizeStop } = useCanvas(tabId);
  const { zoom } = useCanvasStore();

  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        overflow: 'auto',
        background: '#f5f5f5',
      }}
    >
      {/* Scrollable canvas area */}
      <div
        style={{
          width: CANVAS_WIDTH * (zoom / 100),
          height: CANVAS_HEIGHT * (zoom / 100),
          position: 'relative',
          minWidth: '100%',
          minHeight: '100%',
        }}
      >
        {/* Canvas surface with zoom transform */}
        <div
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
            background: '#fff',
            backgroundImage: snapEnabled
              ? 'radial-gradient(circle, #d9d9d9 1px, transparent 1px)'
              : 'none',
            backgroundSize: '20px 20px',
          }}
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
            />
          ))}

          {widgets.length === 0 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <Text type="secondary" style={{ fontSize: 14 }}>
                Chưa có widget nào. Nhấn "+ Widget" để thêm mới.
              </Text>
            </div>
          )}
        </div>
      </div>

      <CanvasControls onAddWidget={onAddWidget} />
    </div>
  );
}
