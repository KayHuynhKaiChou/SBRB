import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { IWidgetDto } from '@sbrb/shared-types';
import { IconButton } from '@sbrb/ui';
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
  const { t } = useTranslation(['widget', 'common']);
  const [modalOpen, setModalOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { chartData, loading } = useChartData(widget.id);

  const handleEditClick = () => {
    setModalOpen(true);
    onEdit(widget.id);
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
        {/* boxShadow is dynamic (hovered state) — kept as inline */}
        <div
          style={{
            boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.06)',
          }}
          className="w-full h-full bg-white rounded-xl flex flex-col overflow-hidden transition-shadow duration-200 relative"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Hover action buttons — top-right corner */}
          {hovered && (
            <div className="absolute top-2 right-2 flex gap-1 z-[5]">
              <IconButton
                icon={<EditOutlined />}
                tooltip={t('common:edit')}
                size="small"
                onClick={handleEditClick}
              />
              <IconButton
                icon={<DeleteOutlined />}
                tooltip={t('widget:delete_tooltip')}
                size="small"
                onClick={() => onDelete(widget.id)}
              />
            </div>
          )}

          <WidgetHeader
            widget={widget}
            chartData={chartData}
          />

          {/* Chart body */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
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
