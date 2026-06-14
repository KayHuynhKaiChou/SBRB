import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { CHART_COLORS } from './register-charts';
import type { IIndustryCountPoint } from '@sbrb/shared-types';

/** Horizontal bar of top industries by business count. */
export function TopIndustriesChart({ data }: { data: IIndustryCountPoint[] }) {
  const chartData: ChartData<'bar'> = useMemo(
    () => ({
      labels: data.map((p) => p.industry),
      datasets: [
        {
          data: data.map((p) => p.count),
          backgroundColor: CHART_COLORS.bar,
          borderRadius: 4,
          barThickness: 'flex',
          maxBarThickness: 28,
        },
      ],
    }),
    [data],
  );

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
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
      x: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
      y: { grid: { display: false } },
    },
  };

  return <Bar data={chartData} options={options} />;
}
