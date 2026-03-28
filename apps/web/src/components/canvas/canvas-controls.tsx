import React, { useEffect } from 'react';
import { Button, Space, Tooltip, Typography } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import type { ZoomLevel } from '@sbrb/shared-types';
import { useCanvasStore } from '../../store/canvas.store';

const { Text } = Typography;
const ZOOM_LEVELS: ZoomLevel[] = [50, 75, 100, 125];

interface ICanvasControlsProps {
  onAddWidget: () => void;
}

export function CanvasControls({ onAddWidget }: ICanvasControlsProps) {
  const { zoom, setZoom, snapEnabled, toggleSnap } = useCanvasStore();

  // Alt key toggles snap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        toggleSnap();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSnap]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 10,
      }}
    >
      {/* Zoom controls */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #f0f0f0',
          borderRadius: 8,
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
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
          style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        />
      </Tooltip>

      {/* Add widget */}
      <Button
        type="primary"
        onClick={onAddWidget}
        style={{
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(215,42,68,0.35)',
          background: '#D72A44',
          borderColor: '#D72A44',
          fontWeight: 600,
        }}
      >
        + Widget
      </Button>
    </div>
  );
}
