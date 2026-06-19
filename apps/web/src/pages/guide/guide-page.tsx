import React from 'react';
import { Card, Col, Collapse, Row, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { GUIDE_AREAS } from './guide-catalog';
import { GuideFeatureCard } from '../../components/guide/guide-feature-card';
import { RolesMatrix } from '../../components/guide/roles-matrix';
import { BusinessLifecycle } from '../../components/guide/business-lifecycle';

const { Title, Paragraph } = Typography;

/** In-app User Guide / Help hub. Accessible to every logged-in role. */
export default function GuidePage() {
  const { t } = useTranslation('guide');

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-5">
        <div>
          <Title level={3} className="!mb-1">
            {t('page_title')}
          </Title>
          <Paragraph type="secondary" className="!mb-0">
            {t('page_subtitle')}
          </Paragraph>
        </div>

        <Card title={t('section_roles')} size="small">
          <RolesMatrix />
        </Card>

        <Card title={t('section_lifecycle')} size="small">
          <BusinessLifecycle />
        </Card>

        <Collapse
          defaultActiveKey={GUIDE_AREAS.map((a) => a.key)}
          items={GUIDE_AREAS.map((area) => ({
            key: area.key,
            label: t(`area_${area.key}`),
            children: (
              <Row gutter={[16, 16]}>
                {area.features.map((feature) => (
                  <Col key={feature.key} xs={24} sm={12} lg={8}>
                    <GuideFeatureCard feature={feature} />
                  </Col>
                ))}
              </Row>
            ),
          }))}
        />
      </div>
    </div>
  );
}
