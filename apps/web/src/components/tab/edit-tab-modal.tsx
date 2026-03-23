import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch } from 'antd';
import type { ITabDto } from '@sbrb/shared-types';
import type { IUpdateTabInput } from '../../hooks/use-tabs';

const PRESET_COLORS = [
  '#1677ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1',
  '#13c2c2', '#eb2f96', '#faad14', '#2f54eb', '#a0d911',
];

const ICON_OPTIONS = [
  { value: 'chart-bar', label: 'Biểu đồ cột' },
  { value: 'table', label: 'Bảng' },
  { value: 'stats', label: 'Thống kê' },
  { value: 'trending', label: 'Xu hướng' },
  { value: 'report', label: 'Báo cáo' },
];

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

  const handleOk = async () => {
    if (!tab) return;
    try {
      const values = await form.validateFields();
      await onSubmit(tab.id, values);
      onClose();
    } catch {
      // validation errors shown inline
    }
  };

  return (
    <Modal
      title="Sửa tab"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Lưu"
      cancelText="Hủy"
      width={480}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Tên tab" rules={[{ required: true, message: 'Vui lòng nhập tên tab', max: 30 }]}>
          <Input placeholder="Nhập tên tab (tối đa 30 ký tự)" maxLength={30} showCount />
        </Form.Item>

        <Form.Item name="iconColor" label="Màu sắc">
          <Select style={{ width: '100%' }}>
            {PRESET_COLORS.map((c) => (
              <Select.Option key={c} value={c}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: c, display: 'inline-block' }} />
                  {c}
                </span>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="iconName" label="Biểu tượng">
          <Select options={ICON_OPTIONS} />
        </Form.Item>

        <Form.Item name="isPinned" label="Ghim tab" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
