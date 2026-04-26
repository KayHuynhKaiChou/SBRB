import React, { useMemo, useState } from 'react';
import { Rnd } from 'react-rnd';
import { Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { IWidgetDto } from '@sbrb/shared-types';
import { IconButton } from '@sbrb/ui';
import { useChartData, useAvailableSeries } from '../../hooks/use-chart-data';
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
  const { chartData: rawChartData, loading } = useChartData(widget.id);
  const { series: availableSeries } = useAvailableSeries(widget.dataLink?.datasheetId ? widget.id : null);

  // Filter datasets by selectedSeriesIds (backend returns all, FE filters)
  const chartData = useMemo(() => {
    if (!rawChartData) return null;
    const ids = widget.dataLink?.selectedSeriesIds ?? [];
    if (ids.length === 0) return rawChartData; // empty = all
    const selectedNames = new Set(
      availableSeries.filter((s) => ids.includes(s.id)).map((s) => s.name),
    );
    if (selectedNames.size === 0) return rawChartData; // fallback if series not loaded yet
    return { ...rawChartData, datasets: rawChartData.datasets.filter((ds) => selectedNames.has(ds.label)) };
  }, [rawChartData, widget.dataLink?.selectedSeriesIds, availableSeries]);

  const handleEditClick = () => {
    setModalOpen(true);
    onEdit(widget.id);
  };

  const handleOpenDataSelector = () => {
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
          onResizeStop(widget.id, { x: Math.round(pos.x), y: Math.round(pos.y) }, {
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
        {/*
          Use CSS hover (group-hover) instead of JS state so the Popconfirm
          trigger stays mounted across the whole interaction. Conditional
          render unmounted the trigger when the mouse left the card to reach
          the popup, which dropped the click → onConfirm chain.
        */}
        <div className="group w-full h-full bg-white rounded-xl flex flex-col overflow-hidden relative shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-shadow duration-200">
          {/* Hover action buttons — top-right corner. Always mounted; opacity reveals on hover. */}
          <div className="absolute top-2 right-2 flex gap-1 z-[5] opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
            <IconButton
              icon={<EditOutlined />}
              tooltip={t('common:edit')}
              size="small"
              onClick={handleEditClick}
            />
            <Popconfirm
              title={t('common:confirm_delete_title')}
              description={t('widget:delete_confirm')}
              okText={t('common:delete')}
              cancelText={t('common:cancel')}
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(widget.id)}
            >
              <IconButton
                icon={<DeleteOutlined />}
                tooltip={t('widget:delete_tooltip')}
                size="small"
              />
            </Popconfirm>
          </div>

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
              unit={widget.unit}
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
