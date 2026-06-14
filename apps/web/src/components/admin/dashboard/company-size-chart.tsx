import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { useTranslation } from 'react-i18next';
import { CHART_COLORS } from './register-charts';
import type { ICompanySizeCountPoint } from '@sbrb/shared-types';

/** Vertical bar of businesses grouped by company-size bucket. */
export function CompanySizeChart({ data }: { data: ICompanySizeCountPoint[] }) {
  const { t } = useTranslation('admin');

  const chartData: ChartData<'bar'> = useMemo(
    () => ({
      labels: data.map((p) => (p.size === 'unknown' ? t('chart_company_size_unknown') : p.size)),
      datasets: [
        {
          data: data.map((p) => p.count),
          backgroundColor: CHART_COLORS.user,
          borderRadius: 4,
          maxBarThickness: 56,
        },
      ],
    }),
    [data, t],
  );

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        anchor: 'end',
        align: 'end',
        color: '#595959',
        font: { weight: 'bold', size: 11 },
        formatter: (value: number) => (value > 0 ? value : ''),
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: { grid: { display: false } },
    },
  };

  return <Bar data={chartData} options={options} />;
}
