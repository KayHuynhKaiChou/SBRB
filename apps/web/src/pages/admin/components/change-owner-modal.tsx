import React, { useEffect, useState } from 'react';
import { Empty, Form, Select, Spin, Tag, Typography } from 'antd';
import { useLazyQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { FormModal } from '@sbrb/ui';
import { ADMIN_BUSINESS_MEMBERS_QUERY } from '../../../graphql/admin.operations';

const { Text } = Typography;

interface IAdminBusinessMember {
  userId: string;
  fullName: string;
  email: string;
  role: string;
}

interface IAdminBusinessMembersQueryResult {
  adminBusinessMembers: IAdminBusinessMember[];
}

interface IChangeOwnerFormValues {
  newOwnerUserId: string;
}

interface IChangeOwnerModalProps {
  open: boolean;
  businessId: string | null;
  businessName: string;
  currentOwnerUserId?: string | null;
  changeOwnerLoading?: boolean;
  onClose: () => void;
  onSubmit: (businessId: string, newOwnerUserId: string) => Promise<unknown>;
}

/**
 * Modal for transferring business ownership to another member.
 * - Lazily fetches members when opened.
 * - Excludes the current owner from the candidate list.
 * - Calls onSubmit with (businessId, newOwnerUserId) on confirm.
 */
export function ChangeOwnerModal({
  open,
  businessId,
  businessName,
  currentOwnerUserId,
  changeOwnerLoading,
  onClose,
  onSubmit,
}: IChangeOwnerModalProps) {
  const { t } = useTranslation('admin');
  const [submitting, setSubmitting] = useState(false);
  const isBlocked = submitting || changeOwnerLoading;

  const [loadMembers, { data, loading: membersLoading }] =
    useLazyQuery<IAdminBusinessMembersQueryResult>(ADMIN_BUSINESS_MEMBERS_QUERY);

  // Fetch members whenever the modal opens with a valid businessId
  useEffect(() => {
    if (open && businessId) {
      void loadMembers({ variables: { businessId } });
    }
  }, [open, businessId, loadMembers]);

  // Filter out the current owner so they cannot be re-selected
  const candidates = (data?.adminBusinessMembers ?? []).filter(
    (m) => m.userId !== currentOwnerUserId,
  );

  const handleSubmit = async (values: IChangeOwnerFormValues) => {
    if (!businessId || isBlocked) return;
    setSubmitting(true);
    try {
      await onSubmit(businessId, values.newOwnerUserId);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal<IChangeOwnerFormValues>
      title={t('change_owner_title', { name: businessName })}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      okText={t('change_owner_confirm')}
      cancelText={t('common:cancel', 'Cancel')}
      width={480}
      destroyOnClose
    >
      <Spin spinning={membersLoading}>
        {!membersLoading && candidates.length === 0 ? (
          <Empty
            description={t('change_owner_empty')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Form.Item
            name="newOwnerUserId"
            label={t('change_owner_select_label')}
            rules={[{ required: true, message: t('change_owner_select_required') }]}
          >
            <Select
              placeholder={t('change_owner_select_label')}
              disabled={isBlocked || membersLoading}
              showSearch
              optionFilterProp="label"
              options={candidates.map((m) => ({
                value: m.userId,
                label: m.fullName,
                member: m,
              }))}
              optionRender={(option) => {
                const m = option.data.member as IAdminBusinessMember;
                return (
                  <div className="flex items-center gap-2 py-0.5">
                    <div className="flex-1 min-w-0">
                      <Text strong className="block truncate">
                        {m.fullName}
                      </Text>
                      <Text type="secondary" className="block truncate text-xs">
                        {m.email}
                      </Text>
                    </div>
                    <Tag color="blue" className="shrink-0 capitalize">
                      {m.role}
                    </Tag>
                  </div>
                );
              }}
            />
          </Form.Item>
        )}
      </Spin>
    </FormModal>
  );
}
