import React from 'react';
import { Card, Col, Row, Spin, Statistic, Typography } from 'antd';
import {
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  PlusCircleOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '../../components/layout/admin-layout';
import { useAdminMetrics } from '../../hooks/use-admin-metrics';

const { Title } = Typography;

interface IStatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}

function StatCard({ title, value, icon, color }: IStatCardProps) {
  return (
    <Card className="h-full">
      <Statistic
        title={
          <span className="flex items-center gap-2 text-gray-600">
            <span style={{ color: color ?? '#0079EE' }}>{icon}</span>
            {title}
          </span>
        }
        value={value}
        valueStyle={{ fontWeight: 700, fontSize: 28 }}
      />
    </Card>
  );
}

/** Admin dashboard — 6 platform stat cards. SRS §5.17 */
export default function AdminDashboardPage() {
  const { metrics, loading } = useAdminMetrics();
  const { t } = useTranslation('admin');

  const statCards: IStatCardProps[] = [
    {
      title: t('metric_total_businesses'),
      value: metrics?.totalBusinesses ?? 0,
      icon: <ShopOutlined />,
      color: '#0079EE',
    },
    {
      title: t('metric_active_businesses'),
      value: metrics?.activeBusinesses ?? 0,
      icon: <CheckCircleOutlined />,
      color: '#22C55E',
    },
    {
      title: t('metric_inactive_businesses'),
      value: metrics?.inactiveBusinesses ?? 0,
      icon: <CloseCircleOutlined />,
      color: '#EF4444',
    },
    {
      title: t('metric_total_users'),
      value: metrics?.totalUsers ?? 0,
      icon: <TeamOutlined />,
      color: '#0079EE',
    },
    {
      title: t('metric_new_businesses_30d'),
      value: metrics?.newBusinessesLast30d ?? 0,
      icon: <PlusCircleOutlined />,
      color: '#F97316',
    },
    {
      title: t('metric_new_users_30d'),
      value: metrics?.newUsersLast30d ?? 0,
      icon: <UserAddOutlined />,
      color: '#F97316',
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <Title level={4} className="!mb-0">
          {t('dashboard_title')}
        </Title>
      </div>

      {loading && !metrics ? (
        <div className="flex items-center justify-center h-48">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {statCards.map((card) => (
            <Col key={card.title} xs={24} sm={12} md={8}>
              <StatCard {...card} />
            </Col>
          ))}
        </Row>
      )}
    </AdminLayout>
  );
}
