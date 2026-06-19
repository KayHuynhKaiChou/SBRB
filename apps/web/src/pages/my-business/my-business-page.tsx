import React from 'react';
import { Card, Form, Button, Tag, Typography, Spin, Empty, Alert, message } from 'antd';
import { useQuery, useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import {
  EBusinessStatus,
  EBusinessRole,
  BUSINESS_STATUS_TAG_COLOR,
  type TBusinessStatus,
} from '@sbrb/shared-constants';
import { useAuthStore } from '../../store/auth.store';
import {
  MY_BUSINESS_DETAIL_QUERY,
  MY_OPEN_CHANGE_REQUEST_QUERY,
  UPDATE_BUSINESS_MUTATION,
  REQUEST_BUSINESS_CHANGE_MUTATION,
} from '../../graphql/business.operations';
import { BusinessKybFields } from '../../components/business/business-kyb-fields';
import { FeatureTour } from '../../components/guide/feature-tour';
import { myBusinessTourSteps } from './my-business-tour-steps';

const { Title, Text } = Typography;

/** KYB fields submitted from the form (strip empties before sending). */
const KYB_KEYS = [
  'name', 'legalName', 'taxCode', 'businessType', 'industry', 'currency',
  'address', 'contactPhone', 'contactEmail', 'website', 'description',
  'foundedYear', 'companySize', 'logoUrl', 'bannerUrl', 'licenseFileUrl',
];

function cleanInput(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of KYB_KEYS) {
    const v = values[k];
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export default function MyBusinessPage() {
  const { t } = useTranslation('business');
  const { t: tg } = useTranslation('guide');
  const businessId = useAuthStore((s) => s.currentBusinessId);
  const [form] = Form.useForm();

  const { data, loading, refetch } = useQuery(MY_BUSINESS_DETAIL_QUERY, {
    variables: { id: businessId ?? '' },
    skip: !businessId,
    fetchPolicy: 'cache-and-network',
  });
  const { data: crData, refetch: refetchCr } = useQuery(MY_OPEN_CHANGE_REQUEST_QUERY, {
    variables: { businessId: businessId ?? '' },
    skip: !businessId,
    fetchPolicy: 'cache-and-network',
  });

  const [updateBusiness, { loading: updating }] = useMutation(UPDATE_BUSINESS_MUTATION);
  const [requestChange, { loading: requesting }] = useMutation(REQUEST_BUSINESS_CHANGE_MUTATION);

  const renderBody = () => {
    if (!businessId) return <Empty description={t('my_business_title')} className="!mt-20" />;
    if (loading && !data) {
      return (
        <div className="flex items-center justify-center py-20">
          <Spin size="large" />
        </div>
      );
    }

    const biz = data?.business;
    if (!biz) return <Empty className="!mt-20" />;

    const status = biz.status as TBusinessStatus;
    const isApproved = status === EBusinessStatus.APPROVED;
    const isRejected = status === EBusinessStatus.REJECTED;
    const isOwner = data?.myMembership?.role === EBusinessRole.OWNER;
    const openChange = crData?.myOpenChangeRequest;

    // Only the owner edits. An open change-request locks the form until admin acts.
    const canEdit = isOwner && !openChange;
    const saving = updating || requesting;

    const STATUS_LABEL_KEY: Record<TBusinessStatus, string> = {
      [EBusinessStatus.PENDING]: 'status_pending',
      [EBusinessStatus.APPROVED]: 'status_approved',
      [EBusinessStatus.REJECTED]: 'status_rejected',
      [EBusinessStatus.RESUBMITTED]: 'status_resubmitted',
      [EBusinessStatus.INACTIVE]: 'status_inactive',
    };
    const statusLabel = t(STATUS_LABEL_KEY[status] ?? 'status_pending');

    // Rejected → saving counts as "fix & resubmit" (BE flips it to resubmitted).
    const submitLabel = isRejected ? t('my_business_resubmit') : t('my_business_save');

    const handleSubmit = async (values: Record<string, unknown>) => {
      const input = cleanInput(values);
      try {
        if (isApproved) {
          // Approved → KYB edits go through an admin-approved change request.
          await requestChange({ variables: { id: businessId, input } });
          void message.success(t('my_business_change_submitted'));
          await refetchCr();
        } else {
          // Pending/resubmitted → live edit. Rejected → BE auto-moves to resubmitted.
          await updateBusiness({ variables: { id: businessId, input } });
          void message.success(t('my_business_save_success'));
          await refetch();
        }
      } catch (err) {
        void message.error(err instanceof Error ? err.message : 'Error');
      }
    };

    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Header — title + status, like the profile page */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <Title level={3} className="!m-0">{t('my_business_title')}</Title>
            <Text type="secondary">{biz.name}</Text>
          </div>
          <Tag color={BUSINESS_STATUS_TAG_COLOR[status]} className="!m-0" data-testid="tour-my-business-status">
            {statusLabel}
          </Tag>
        </div>

        {isRejected && biz.rejectionReason && (
          <Alert
            type="error"
            showIcon
            message={t('rejected_reason_label')}
            description={<span className="whitespace-pre-line">{biz.rejectionReason}</span>}
          />
        )}
        {openChange && <Alert type="warning" showIcon message={t('change_pending_banner')} />}
        {!isOwner && <Alert type="info" showIcon message={t('my_business_view_only')} />}

        <Card title={t('my_business_info')} data-testid="tour-my-business-form">
          <Form
            form={form}
            layout="vertical"
            size="large"
            requiredMark={false}
            initialValues={biz}
            onFinish={handleSubmit}
          >
            <BusinessKybFields businessId={businessId} columns={2} readOnly={!canEdit} />

            {canEdit && (
              <div className="flex justify-end gap-2">
                <Button onClick={() => form.resetFields()} className="!rounded-lg">
                  {t('my_business_cancel')}
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  className="!rounded-lg !bg-[#D72A44] !border-[#D72A44] !font-semibold"
                >
                  {submitLabel}
                </Button>
              </div>
            )}
          </Form>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      {renderBody()}
      <FeatureTour tourId="my-business" steps={myBusinessTourSteps(tg)} />
    </div>
  );
}
