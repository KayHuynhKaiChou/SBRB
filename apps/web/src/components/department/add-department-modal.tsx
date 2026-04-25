import { Form, Input, Select } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FormModal } from '@sbrb/ui';
import { useCreateDepartment } from '../../hooks/use-department-mutations';

export interface IParentOption {
  id: string;
  name: string;
  depth: number;
}

interface IFormValues {
  name: string;
  parentId?: string | null;
}

interface IProps {
  open: boolean;
  businessId: string;
  parentId?: string | null;
  parentOptions: IParentOption[];
  onClose: () => void;
}

export function AddDepartmentModal({
  open,
  businessId,
  parentId,
  parentOptions,
  onClose,
}: IProps) {
  const { t } = useTranslation(['department', 'common']);
  const { mutate } = useCreateDepartment();

  const initialValues = useMemo(
    () => ({ parentId: parentId ?? undefined }),
    [parentId],
  );

  const options = useMemo(
    () =>
      parentOptions.map((p) => ({
        value: p.id,
        label: `${'\u00A0\u00A0'.repeat(p.depth)}${p.depth > 0 ? '— ' : ''}${p.name}`,
      })),
    [parentOptions],
  );

  const handleSubmit = async (values: IFormValues) => {
    await mutate({
      variables: {
        input: {
          businessId,
          name: values.name,
          parentId: parentId ?? values.parentId ?? null,
        },
      },
    });
  };

  return (
    <FormModal<IFormValues>
      title={t('department:add_department_title')}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      okText={t('department:submit')}
      cancelText={t('department:cancel')}
      width={440}
      destroyOnClose
      initialValues={initialValues}
    >
      <Form.Item
        name="name"
        label={t('department:dept_name')}
        rules={[
          { required: true, message: t('department:name_required') },
          { min: 2, message: t('department:name_min_length') },
          { max: 100 },
        ]}
      >
        <Input autoFocus maxLength={100} />
      </Form.Item>

      <Form.Item name="parentId" label={t('department:parent_dept')}>
        <Select
          allowClear
          disabled={!!parentId}
          placeholder={t('department:parent_placeholder')}
          options={options}
        />
      </Form.Item>
    </FormModal>
  );
}
