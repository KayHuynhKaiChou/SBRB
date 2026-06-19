import React from 'react';
import { Card, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { IGuideFeature } from '@sbrb/shared-types';
import { UsageButton } from './usage-button';

const { Text, Paragraph } = Typography;

const STATUS_TAG: Record<IGuideFeature['status'], { color: string; key: string }> = {
  done: { color: 'green', key: 'status_done' },
  partial: { color: 'gold', key: 'status_partial' },
  'coming-soon': { color: 'default', key: 'status_coming_soon' },
};

/** A single feature card: title, business-rule blurb, status tag, Usage button (or coming-soon). */
export function GuideFeatureCard({ feature }: { feature: IGuideFeature }) {
  const { t } = useTranslation('guide');
  const tag = STATUS_TAG[feature.status];
  const isComingSoon = feature.status === 'coming-soon';

  return (
    <Card
      size="small"
      className="h-full"
      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 8, height: '100%' } }}
    >
      <div className="flex items-start justify-between gap-2">
        <Text strong className="!text-[14px]">
          {t(`feat_${feature.key}_title`)}
        </Text>
        <Tag color={tag.color} className="!mr-0 shrink-0">
          {t(tag.key)}
        </Tag>
      </div>

      <Paragraph type="secondary" className="!mb-0 !text-[13px] flex-1">
        {t(`feat_${feature.key}_desc`)}
      </Paragraph>

      <div className="mt-1">
        {isComingSoon ? (
          <Text type="secondary" className="!text-[12px] italic">
            {t('coming_soon_hint')}
          </Text>
        ) : (
          <UsageButton feature={feature} />
        )}
      </div>
    </Card>
  );
}
