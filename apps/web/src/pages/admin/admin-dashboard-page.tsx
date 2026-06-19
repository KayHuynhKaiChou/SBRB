import { Spin, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAdminMetrics } from '../../hooks/use-admin-metrics';
import { useAdminDashboardCharts } from '../../hooks/use-admin-dashboard-charts';
import { StatCards } from '../../components/admin/dashboard/stat-cards';
import { DashboardCharts } from '../../components/admin/dashboard/dashboard-charts';
import { FeatureTour } from '../../components/guide/feature-tour';
import { adminDashboardTourSteps } from './admin-dashboard-tour-steps';

const { Title } = Typography;

/** Admin dashboard — platform KPIs + analytics charts. SRS §5.17 */
export default function AdminDashboardPage() {
  const { metrics, loading: metricsLoading } = useAdminMetrics();
  const { charts, loading: chartsLoading } = useAdminDashboardCharts();
  const { t } = useTranslation(['admin', 'guide']);

  return (
    <>
      <div className="mb-6">
        <Title level={4} className="!mb-0">
          {t('dashboard_title')}
        </Title>
      </div>

      <div data-testid="tour-admin-dashboard-stats">
        {metricsLoading && !metrics ? (
          <div className="flex items-center justify-center h-48">
            <Spin size="large" />
          </div>
        ) : (
          <StatCards metrics={metrics} />
        )}
      </div>

      <div className="mt-6" data-testid="tour-admin-dashboard-charts">
        <DashboardCharts charts={charts} loading={chartsLoading && !charts} />
      </div>

      <FeatureTour tourId="admin-dashboard" steps={adminDashboardTourSteps(t)} />
    </>
  );
}
