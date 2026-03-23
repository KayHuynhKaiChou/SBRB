import React from 'react';
import { Modal, Form, Input, Select, Switch, Row, Col } from 'antd';
import type { ICreateTabInput } from '../../hooks/use-tabs';

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

interface IAddTabModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<ICreateTabInput, 'businessId'>) => Promise<void>;
}

export function AddTabModal({ open, onClose, onSubmit }: IAddTabModalProps) {
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
      title="Tạo tab mới"
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onClose(); }}
      okText="Tạo"
      cancelText="Hủy"
      width={480}
    >
      <Form form={form} layout="vertical" initialValues={{ iconColor: '#1677ff', iconName: 'chart-bar', isPinned: false }}>
        <Form.Item name="name" label="Tên tab" rules={[{ required: true, message: 'Vui lòng nhập tên tab', max: 30 }]}>
          <Input placeholder="Nhập tên tab (tối đa 30 ký tự)" maxLength={30} showCount />
        </Form.Item>

        <Form.Item name="iconColor" label="Màu sắc">
          <Row gutter={8}>
            <Col>
              <Form.Item name="iconColor" noStyle>
                <Select style={{ width: 120 }}>
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
            </Col>
          </Row>
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
