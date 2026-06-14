import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { useTranslation } from 'react-i18next';
import { EBusinessStatus } from '@sbrb/shared-constants';
import { CHART_COLORS } from './register-charts';
import type { IStatusBreakdownPoint } from '@sbrb/shared-types';

const STATUS_COLOR: Record<string, string> = {
  [EBusinessStatus.PENDING]: CHART_COLORS.pending,
  [EBusinessStatus.APPROVED]: CHART_COLORS.approved,
  [EBusinessStatus.REJECTED]: CHART_COLORS.rejected,
  [EBusinessStatus.RESUBMITTED]: CHART_COLORS.resubmitted,
  [EBusinessStatus.INACTIVE]: CHART_COLORS.inactive,
};

/** Doughnut of business lifecycle status distribution. */
export function StatusBreakdownChart({ data }: { data: IStatusBreakdownPoint[] }) {
  const { t } = useTranslation('admin');

  const chartData: ChartData<'doughnut'> = useMemo(
    () => ({
      labels: data.map((p) => t(`status_${p.status}`)),
      datasets: [
        {
          data: data.map((p) => p.count),
          backgroundColor: data.map((p) => STATUS_COLOR[p.status] ?? CHART_COLORS.inactive),
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    }),
    [data, t],
  );

  const total = data.reduce((sum, p) => sum + p.count, 0);

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 12, usePointStyle: true } },
      datalabels: {
        color: '#fff',
        font: { weight: 'bold', size: 12 },
        formatter: (value: number) =>
          total > 0 && value > 0 ? `${Math.round((value / total) * 100)}%` : '',
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
}
