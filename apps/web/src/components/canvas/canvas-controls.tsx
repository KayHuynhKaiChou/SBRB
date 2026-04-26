import React from 'react';
import { Button, Tooltip } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { useEventListener } from '../../hooks/use-event-listener';
import type { ZoomLevel } from '@sbrb/shared-types';
import { useCanvasStore } from '../../store/canvas.store';

const ZOOM_LEVELS: ZoomLevel[] = [50, 75, 100, 125];

interface ICanvasControlsProps {
  onAddWidget: () => void;
}

export function CanvasControls({ onAddWidget }: ICanvasControlsProps) {
  const { zoom, setZoom, snapEnabled, toggleSnap } = useCanvasStore();

  // Alt key toggles snap
  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Alt') {
      e.preventDefault();
      toggleSnap();
    }
  });

  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
      {/* Zoom controls */}
      <div className="bg-white border border-gray-100 rounded-lg px-[10px] py-[6px] flex items-center gap-1 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
        {ZOOM_LEVELS.map((level) => (
          <Button
            key={level}
            type={zoom === level ? 'primary' : 'text'}
            size="small"
            onClick={() => setZoom(level)}
            style={{
              minWidth: 40,
              fontWeight: zoom === level ? 600 : 400,
              background: zoom === level ? '#D72A44' : undefined,
              borderColor: zoom === level ? '#D72A44' : undefined,
            }}
          >
            {level}%
          </Button>
        ))}
      </div>

      {/* Snap toggle */}
      <Tooltip title={`Lưới snap: ${snapEnabled ? 'Bật' : 'Tắt'} (Alt)`} placement="left">
        <Button
          type={snapEnabled ? 'primary' : 'default'}
          icon={<AppstoreOutlined />}
          onClick={toggleSnap}
          className="!rounded-lg !shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
        />
      </Tooltip>

      {/* Add widget */}
      <Button
        type="primary"
        onClick={onAddWidget}
        className="!rounded-lg !shadow-[0_2px_8px_rgba(215,42,68,0.35)] !bg-[#D72A44] !border-[#D72A44] !font-semibold"
      >
        + Widget
      </Button>
    </div>
  );
}
