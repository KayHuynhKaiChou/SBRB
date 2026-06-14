import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { useTranslation } from 'react-i18next';
import { CHART_COLORS } from './register-charts';
import type { IMonthlyGrowthPoint } from '@sbrb/shared-types';

/** Formats a YYYY-MM key into a short localized month label (e.g. "Jun 26"). */
function formatMonth(month: string, locale: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, (m ?? 1) - 1, 1));
  return new Intl.DateTimeFormat(locale, { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(d);
}

/** 12-month new-business vs new-user growth line chart. */
export function GrowthTrendChart({ data }: { data: IMonthlyGrowthPoint[] }) {
  const { t, i18n } = useTranslation('admin');

  const chartData: ChartData<'line'> = useMemo(
    () => ({
      labels: data.map((p) => formatMonth(p.month, i18n.language)),
      datasets: [
        {
          label: t('chart_growth_businesses'),
          data: data.map((p) => p.newBusinesses),
          borderColor: CHART_COLORS.business,
          backgroundColor: `${CHART_COLORS.business}22`,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
        {
          label: t('chart_growth_users'),
          data: data.map((p) => p.newUsers),
          borderColor: CHART_COLORS.user,
          backgroundColor: `${CHART_COLORS.user}22`,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    }),
    [data, t, i18n.language],
  );

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: true } },
      datalabels: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: { grid: { display: false } },
    },
  };

  return <Line data={chartData} options={options} />;
}
