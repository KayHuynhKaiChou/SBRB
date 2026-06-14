import { Spin, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAdminMetrics } from '../../hooks/use-admin-metrics';
import { useAdminDashboardCharts } from '../../hooks/use-admin-dashboard-charts';
import { StatCards } from '../../components/admin/dashboard/stat-cards';
import { DashboardCharts } from '../../components/admin/dashboard/dashboard-charts';

const { Title } = Typography;

/** Admin dashboard — platform KPIs + analytics charts. SRS §5.17 */
export default function AdminDashboardPage() {
  const { metrics, loading: metricsLoading } = useAdminMetrics();
  const { charts, loading: chartsLoading } = useAdminDashboardCharts();
  const { t } = useTranslation('admin');

  return (
    <>
      <div className="mb-6">
        <Title level={4} className="!mb-0">
          {t('dashboard_title')}
        </Title>
      </div>

      {metricsLoading && !metrics ? (
        <div className="flex items-center justify-center h-48">
          <Spin size="large" />
        </div>
      ) : (
        <StatCards metrics={metrics} />
      )}

      <div className="mt-6">
        <DashboardCharts charts={charts} loading={chartsLoading && !charts} />
      </div>
    </>
  );
}
