import React from 'react';
import { Form, Input } from 'antd';
import { FormModal } from '@sbrb/ui';

interface IAddWidgetInput {
  name: string;
  metricName?: string;
  unit?: string;
}

interface IAddWidgetModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: IAddWidgetInput) => Promise<void>;
}

export function AddWidgetModal({ open, onClose, onSubmit }: IAddWidgetModalProps) {
  return (
    <FormModal<IAddWidgetInput>
      title="Thêm widget mới"
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      okText="Thêm"
      cancelText="Hủy"
      width={440}
    >
      <Form.Item
        name="name"
        label="Tên widget"
        rules={[{ required: true, message: 'Vui lòng nhập tên widget' }]}
      >
        <Input placeholder="Nhập tên widget" />
      </Form.Item>
      <Form.Item name="metricName" label="Chỉ số đo lường">
        <Input placeholder="Ví dụ: Doanh thu, Chi phí..." />
      </Form.Item>
      <Form.Item name="unit" label="Đơn vị">
        <Input placeholder="Ví dụ: VND, USD, %" />
      </Form.Item>
    </FormModal>
  );
}
