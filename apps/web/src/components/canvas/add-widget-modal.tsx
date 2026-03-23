import React from 'react';
import { Modal, Form, Input } from 'antd';

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
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
      onClose();
    } catch {
      // validation errors shown inline
    }
  };

  return (
    <Modal
      title="Thêm widget mới"
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onClose(); }}
      okText="Thêm"
      cancelText="Hủy"
      width={440}
    >
      <Form form={form} layout="vertical">
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
      </Form>
    </Modal>
  );
}
