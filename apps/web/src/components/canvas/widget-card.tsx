import React from 'react';
import { Rnd } from 'react-rnd';
import { Typography } from 'antd';
import type { IWidgetDto } from '@sbrb/shared-types';
import { WidgetHeader } from './widget-header';

const { Text } = Typography;

interface IWidgetCardProps {
  widget: IWidgetDto;
  snapEnabled: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStop: (widgetId: string, x: number, y: number) => void;
  onResizeStop: (widgetId: string, pos: { x: number; y: number }, size: { w: number; h: number }) => void;
}

export function WidgetCard({
  widget,
  snapEnabled,
  onEdit,
  onDelete,
  onDragStop,
  onResizeStop,
}: IWidgetCardProps) {
  const { position } = widget;

  return (
    <Rnd
      data-testid={`widget-card-${widget.id}`}
      position={{ x: position.x, y: position.y }}
      size={{ width: position.w, height: position.h }}
      dragGrid={snapEnabled ? [20, 20] : [1, 1]}
      resizeGrid={snapEnabled ? [20, 20] : [1, 1]}
      bounds="parent"
      dragHandleClassName="widget-drag-handle"
      onDragStop={(_e, d) => onDragStop(widget.id, d.x, d.y)}
      onResizeStop={(_e, _dir, ref, _delta, pos) =>
        onResizeStop(widget.id, pos, {
          w: parseInt(ref.style.width, 10),
          h: parseInt(ref.style.height, 10),
        })
      }
      minWidth={800}
      maxWidth={1600}
      minHeight={400}
      maxHeight={800}
      style={{ zIndex: 1 }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          border: '1px solid #f0f0f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <WidgetHeader widget={widget} onEdit={onEdit} onDelete={onDelete} />
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#bfbfbf',
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            {widget.metricName || widget.name}
          </Text>
        </div>
      </div>
    </Rnd>
  );
}
