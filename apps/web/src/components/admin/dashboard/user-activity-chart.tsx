import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { useTranslation } from 'react-i18next';
import { CHART_COLORS } from './register-charts';
import type { IUserActivity } from '@sbrb/shared-types';

/** Bar of user activity: active vs disabled vs logged-in-last-30d. */
export function UserActivityChart({ data }: { data: IUserActivity }) {
  const { t } = useTranslation('admin');

  const chartData: ChartData<'bar'> = useMemo(
    () => ({
      labels: [
        t('chart_user_active'),
        t('chart_user_disabled'),
        t('chart_user_active_30d'),
      ],
      datasets: [
        {
          data: [data.active, data.disabled, data.activeLast30d],
          backgroundColor: [CHART_COLORS.active, CHART_COLORS.disabled, CHART_COLORS.activeRecent],
          borderRadius: 4,
          maxBarThickness: 64,
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
