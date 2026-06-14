import React, { useState } from 'react';
import { Drawer, Descriptions, Avatar, Button, Space, Spin, Typography, Tag, Image, Form, Input, Alert } from 'antd';
import { RiFileTextLine } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import { FormModal } from '@sbrb/ui';
import { EBusinessStatus } from '@sbrb/shared-constants';
import { useAdminBusinessDetail } from '../../../hooks/use-admin-business-review';
import { BusinessStatusTag } from './business-status-tag';

interface IBusinessReviewDrawerProps {
  businessId: string | null;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onInactivate: (id: string, reason: string) => void;
  onReactivate: (id: string) => void;
  approveLoading: boolean;
  rejectLoading: boolean;
  inactivateLoading: boolean;
  reactivateLoading: boolean;
}

const { Text } = Typography;

/**
 * Admin drawer: owner info + full KYB + licence. Status transitions happen here —
 * the available action(s) depend on the current status (state machine):
 *   pending → Approve | Reject · rejected → Approve · approved → Inactivate · inactive → Reactivate
 */
export function BusinessReviewDrawer({
  businessId,
  open,
  onClose,
  onApprove,
  onReject,
  onInactivate,
  onReactivate,
  approveLoading,
  rejectLoading,
  inactivateLoading,
  reactivateLoading,
}: IBusinessReviewDrawerProps) {
  const { t } = useTranslation('admin');
  const { detail, loading } = useAdminBusinessDetail(open ? businessId : null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [inactivateOpen, setInactivateOpen] = useState(false);

  const status = detail?.status as EBusinessStatus | undefined;

  /** Action buttons for the current status — drives the state machine. */
  const renderActions = () => {
    if (!detail || !status) return null;
    switch (status) {
      case EBusinessStatus.PENDING:
      case EBusinessStatus.RESUBMITTED:
        return (
          <Space className="!w-full !justify-end">
            <Button danger onClick={() => setRejectOpen(true)} loading={rejectLoading}>
              {t('action_reject')}
            </Button>
            <Button
              type="primary"
              onClick={() => onApprove(detail.id)}
              loading={approveLoading}
              className="!bg-[#D72A44] !border-[#D72A44]"
            >
              {t('action_approve')}
            </Button>
          </Space>
        );
      // Rejected → NO actions: the owner must amend it first (→ resubmitted) before re-review.
      case EBusinessStatus.REJECTED:
        return null;
      case EBusinessStatus.APPROVED:
        return (
          <Space className="!w-full !justify-end">
            <Button danger onClick={() => setInactivateOpen(true)} loading={inactivateLoading}>
              {t('action_inactivate')}
            </Button>
          </Space>
        );
      case EBusinessStatus.INACTIVE:
        return (
          <Space className="!w-full !justify-end">
            <Button
              type="primary"
              onClick={() => onReactivate(detail.id)}
              loading={reactivateLoading}
              className="!bg-[#D72A44] !border-[#D72A44]"
            >
              {t('action_reactivate')}
            </Button>
          </Space>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Drawer
        title={t('review_title')}
        open={open}
        onClose={onClose}
        width={560}
        extra={detail && <BusinessStatusTag status={detail.status} />}
        footer={renderActions()}
      >
        {loading && !detail ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : detail ? (
          <div className="flex flex-col gap-5">
            {status === EBusinessStatus.REJECTED && (
              <Alert type="warning" showIcon message={t('review_rejected_waiting')} />
            )}
            {detail.bannerUrl && (
              <Image src={detail.bannerUrl} alt="banner" className="!rounded-lg !object-cover" height={120} />
            )}

            <div>
              <Text strong className="!block !mb-2">{t('review_owner')}</Text>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Avatar size={44} src={detail.owner.avatarUrl}>
                  {detail.owner.fullName?.[0]}
                </Avatar>
                <div>
                  <div className="font-semibold">{detail.owner.fullName}</div>
                  <div className="text-gray-500 text-sm">{detail.owner.email}</div>
                  {detail.owner.phone && <div className="text-gray-500 text-sm">{detail.owner.phone}</div>}
                </div>
              </div>
            </div>

            <div>
              <Text strong className="!block !mb-2">{t('review_business_info')}</Text>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Tên">{detail.name}</Descriptions.Item>
                <Descriptions.Item label="Tên pháp lý">{detail.legalName || '—'}</Descriptions.Item>
                <Descriptions.Item label="MST">{detail.taxCode || '—'}</Descriptions.Item>
                <Descriptions.Item label="Loại hình">{detail.businessType || '—'}</Descriptions.Item>
                <Descriptions.Item label="Ngành">{detail.industry || '—'}</Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">{detail.address || '—'}</Descriptions.Item>
                <Descriptions.Item label="SĐT">{detail.contactPhone || '—'}</Descriptions.Item>
                <Descriptions.Item label="Email DN">{detail.contactEmail || '—'}</Descriptions.Item>
                <Descriptions.Item label="Website">{detail.website || '—'}</Descriptions.Item>
                <Descriptions.Item label="Quy mô">{detail.companySize || '—'}</Descriptions.Item>
                <Descriptions.Item label="Mô tả">{detail.description || '—'}</Descriptions.Item>
              </Descriptions>
            </div>

            <div>
              <Text strong className="!block !mb-2">{t('review_license')}</Text>
              {detail.licenseSignedUrl ? (
                <Button
                  icon={<RiFileTextLine />}
                  href={detail.licenseSignedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="!rounded-lg"
                >
                  {t('review_view_license')}
                </Button>
              ) : (
                <Tag>{t('review_no_license')}</Tag>
              )}
            </div>

            {detail.rejectionReason && (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Lý do từ chối gần nhất">
                  {detail.rejectionReason}
                </Descriptions.Item>
              </Descriptions>
            )}
          </div>
        ) : null}
      </Drawer>

      {rejectOpen && detail && (
        <FormModal<{ reason: string }>
          title={t('reject_modal_title')}
          open={rejectOpen}
          onClose={() => setRejectOpen(false)}
          onSubmit={async (v) => {
            onReject(detail.id, v.reason);
            setRejectOpen(false);
          }}
          okText={t('reject_modal_ok')}
          cancelText={t('common:cancel', 'Cancel')}
        >
          <Form.Item
            name="reason"
            label={t('reject_modal_reason_label')}
            rules={[{ required: true, whitespace: true, message: t('reject_modal_reason_required') }]}
          >
            <Input.TextArea rows={4} maxLength={500} showCount placeholder={t('reject_modal_reason_ph')} />
          </Form.Item>
        </FormModal>
      )}

      {inactivateOpen && detail && (
        <FormModal<{ reason: string }>
          title={t('inactivate_modal_title')}
          open={inactivateOpen}
          onClose={() => setInactivateOpen(false)}
          onSubmit={async (v) => {
            onInactivate(detail.id, v.reason);
            setInactivateOpen(false);
          }}
          okText={t('inactivate_modal_ok')}
          cancelText={t('common:cancel', 'Cancel')}
        >
          <Form.Item
            name="reason"
            label={t('inactivate_modal_reason_label')}
            rules={[{ required: true, whitespace: true, message: t('inactivate_modal_reason_required') }]}
          >
            <Input.TextArea rows={4} maxLength={500} showCount placeholder={t('inactivate_modal_reason_ph')} />
          </Form.Item>
        </FormModal>
      )}
    </>
  );
}
