import React, { useEffect } from 'react';
import { Form, Input, Select, Switch } from 'antd';
import type { ITabDto } from '@sbrb/shared-types';
import type { IUpdateTabInput } from '../../hooks/use-tabs';
import { TAB_PRESET_COLORS, TAB_ICON_OPTIONS } from '../../constants/tab-config';
import { FormModal } from '@sbrb/ui';

interface IEditTabModalProps {
  open: boolean;
  tab: ITabDto | null;
  onClose: () => void;
  onSubmit: (id: string, input: IUpdateTabInput) => Promise<void>;
}

export function EditTabModal({ open, tab, onClose, onSubmit }: IEditTabModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (tab && open) {
      form.setFieldsValue({
        name: tab.name,
        iconColor: tab.iconColor,
        iconName: tab.iconName,
        isPinned: tab.isPinned,
      });
    }
  }, [tab, open, form]);

  const handleSubmit = async (values: IUpdateTabInput) => {
    if (!tab) return;
    await onSubmit(tab.id, values);
  };

  return (
    <FormModal<IUpdateTabInput>
      title="Sửa tab"
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      okText="Lưu"
      cancelText="Hủy"
      width={480}
      form={form}
    >
      <Form.Item name="name" label="Tên tab" rules={[{ required: true, message: 'Vui lòng nhập tên tab', max: 30 }]}>
        <Input placeholder="Nhập tên tab (tối đa 30 ký tự)" maxLength={30} showCount />
      </Form.Item>

      <Form.Item name="iconColor" label="Màu sắc">
        <Select className="w-full">
          {TAB_PRESET_COLORS.map((c) => (
            <Select.Option key={c} value={c}>
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: c }} />
                {c}
              </span>
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="iconName" label="Biểu tượng">
        <Select options={TAB_ICON_OPTIONS} />
      </Form.Item>

      <Form.Item name="isPinned" label="Ghim tab" valuePropName="checked">
        <Switch />
      </Form.Item>
    </FormModal>
  );
}
