import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import {
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  PlusCircleOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { IAdminMetrics } from '@sbrb/shared-types';

interface IStatItem {
  key: string;
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

/** Compact platform KPI row built on antd Statistic. SRS §5.17 */
export function StatCards({ metrics }: { metrics: IAdminMetrics | null }) {
  const { t } = useTranslation('admin');

  const items: IStatItem[] = [
    {
      key: 'total_businesses',
      title: t('metric_total_businesses'),
      value: metrics?.totalBusinesses ?? 0,
      icon: <ShopOutlined />,
      color: '#0079EE',
    },
    {
      key: 'active_businesses',
      title: t('metric_active_businesses'),
      value: metrics?.activeBusinesses ?? 0,
      icon: <CheckCircleOutlined />,
      color: '#22C55E',
    },
    {
      key: 'inactive_businesses',
      title: t('metric_inactive_businesses'),
      value: metrics?.inactiveBusinesses ?? 0,
      icon: <CloseCircleOutlined />,
      color: '#EF4444',
    },
    {
      key: 'total_users',
      title: t('metric_total_users'),
      value: metrics?.totalUsers ?? 0,
      icon: <TeamOutlined />,
      color: '#0079EE',
    },
    {
      key: 'new_businesses_30d',
      title: t('metric_new_businesses_30d'),
      value: metrics?.newBusinessesLast30d ?? 0,
      icon: <PlusCircleOutlined />,
      color: '#F97316',
    },
    {
      key: 'new_users_30d',
      title: t('metric_new_users_30d'),
      value: metrics?.newUsersLast30d ?? 0,
      icon: <UserAddOutlined />,
      color: '#F97316',
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col key={item.key} xs={12} sm={8} lg={4}>
          <Card className="h-full" styles={{ body: { padding: 16 } }}>
            <Statistic
              title={
                <span className="flex items-center gap-2 text-gray-600 text-13">
                  <span style={{ color: item.color }}>{item.icon}</span>
                  {item.title}
                </span>
              }
              value={item.value}
              valueStyle={{ fontWeight: 700, fontSize: 24 }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
