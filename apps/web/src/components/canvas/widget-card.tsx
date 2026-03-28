import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import type { IWidgetDto } from '@sbrb/shared-types';
import { useChartData } from '../../hooks/use-chart-data';
import { InlineChartPreview } from '../widget/inline-chart-preview';
import { WidgetHeader } from './widget-header';
import { WidgetModal } from '../widget/widget-modal';

interface IWidgetCardProps {
  widget: IWidgetDto;
  snapEnabled: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStop: (widgetId: string, x: number, y: number) => void;
  onResizeStop: (widgetId: string, pos: { x: number; y: number }, size: { w: number; h: number }) => void;
  /** Optional: called when user clicks "Chọn dữ liệu" in the widget modal */
  onOpenDataSelector?: (widgetId: string) => void;
}

export function WidgetCard({
  widget,
  snapEnabled,
  onEdit,
  onDelete,
  onDragStop,
  onResizeStop,
  onOpenDataSelector,
}: IWidgetCardProps) {
  const { position } = widget;
  const [modalOpen, setModalOpen] = useState(false);
  const { chartData, loading } = useChartData(widget.id);

  const handleEditClick = (id: string) => {
    setModalOpen(true);
    onEdit(id);
  };

  const handleOpenDataSelector = () => {
    setModalOpen(false);
    onOpenDataSelector?.(widget.id);
  };

  return (
    <>
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
        minWidth={400}
        maxWidth={1600}
        minHeight={280}
        maxHeight={800}
        style={{ zIndex: 1 }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#ffffff',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
          }}
        >
          <WidgetHeader
            widget={widget}
            onEdit={handleEditClick}
            onDelete={onDelete}
            chartData={chartData}
          />

          {/* Chart body */}
          <div style={{ flex: 1, padding: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <InlineChartPreview
              chartData={chartData}
              loading={loading}
              chartType={widget.chartConfig.type}
              config={widget.chartConfig}
            />
          </div>
        </div>
      </Rnd>

      {modalOpen && (
        <WidgetModal
          widget={widget}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onOpenDataSelector={handleOpenDataSelector}
        />
      )}
    </>
  );
}
