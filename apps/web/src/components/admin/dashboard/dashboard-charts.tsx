import React from 'react';
import { Col, Row } from 'antd';
import { useTranslation } from 'react-i18next';
import './register-charts';
import { ChartCard } from './chart-card';
import { GrowthTrendChart } from './growth-trend-chart';
import { StatusBreakdownChart } from './status-breakdown-chart';
import { TopIndustriesChart } from './top-industries-chart';
import { CompanySizeChart } from './company-size-chart';
import { UserActivityChart } from './user-activity-chart';
import type { IAdminDashboardCharts } from '@sbrb/shared-types';

interface IDashboardChartsProps {
  charts: IAdminDashboardCharts | null;
  loading: boolean;
}

/** Admin dashboard chart grid: growth, status mix, industries, sizes, activity. */
export function DashboardCharts({ charts, loading }: IDashboardChartsProps) {
  const { t } = useTranslation('admin');
  const noData = t('chart_no_data');

  const hasGrowth = !!charts?.monthlyGrowth.some((p) => p.newBusinesses > 0 || p.newUsers > 0);
  const hasStatus = !!charts?.statusBreakdown.some((p) => p.count > 0);
  const hasIndustries = !!charts?.topIndustries.length;
  const hasSizes = !!charts?.companySizes.length;
  const activity = charts?.userActivity;
  const hasActivity = !!activity && (activity.active > 0 || activity.disabled > 0);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>
        <ChartCard title={t('chart_growth_title')} loading={loading} hasData={hasGrowth} emptyText={noData}>
          {charts && <GrowthTrendChart data={charts.monthlyGrowth} />}
        </ChartCard>
      </Col>
      <Col xs={24} lg={8}>
        <ChartCard title={t('chart_status_title')} loading={loading} hasData={hasStatus} emptyText={noData}>
          {charts && <StatusBreakdownChart data={charts.statusBreakdown} />}
        </ChartCard>
      </Col>

      <Col xs={24} lg={8}>
        <ChartCard title={t('chart_industries_title')} loading={loading} hasData={hasIndustries} emptyText={noData}>
          {charts && <TopIndustriesChart data={charts.topIndustries} />}
        </ChartCard>
      </Col>
      <Col xs={24} lg={8}>
        <ChartCard title={t('chart_company_size_title')} loading={loading} hasData={hasSizes} emptyText={noData}>
          {charts && <CompanySizeChart data={charts.companySizes} />}
        </ChartCard>
      </Col>
      <Col xs={24} lg={8}>
        <ChartCard title={t('chart_user_activity_title')} loading={loading} hasData={hasActivity} emptyText={noData}>
          {activity && <UserActivityChart data={activity} />}
        </ChartCard>
      </Col>
    </Row>
  );
}
