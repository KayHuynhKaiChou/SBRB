import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

/**
 * Registers the Chart.js building blocks used by the admin dashboard charts.
 * ChartJS.register is idempotent, so importing this from multiple chart modules
 * is safe. Datalabels are opt-in per chart via `options.plugins.datalabels`.
 */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
  ChartDataLabels,
);

/** Brand-aligned palette for categorical charts. */
export const CHART_COLORS = {
  business: '#D72A44',
  user: '#0079EE',
  pending: '#FAAD14',
  approved: '#22C55E',
  rejected: '#EF4444',
  resubmitted: '#06B6D4',
  inactive: '#9CA3AF',
  bar: '#D72A44',
  active: '#22C55E',
  disabled: '#9CA3AF',
  activeRecent: '#0079EE',
} as const;
