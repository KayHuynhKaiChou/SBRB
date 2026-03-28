import React from 'react';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import type { ICreateTabInput } from '../../hooks/use-tabs';
import { TAB_PRESET_COLORS, TAB_ICON_OPTIONS } from '../../constants/tab-config';
import { FormModal } from '../common/form-modal';

interface IAddTabModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<ICreateTabInput, 'businessId'>) => Promise<void>;
}

export function AddTabModal({ open, onClose, onSubmit }: IAddTabModalProps) {
  return (
    <FormModal<Omit<ICreateTabInput, 'businessId'>>
      title="Tạo tab mới"
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      okText="Tạo"
      cancelText="Hủy"
      width={480}
      initialValues={{ iconColor: '#1677ff', iconName: 'chart-bar', isPinned: false }}
    >
      <Form.Item name="name" label="Tên tab" rules={[{ required: true, message: 'Vui lòng nhập tên tab', max: 30 }]}>
        <Input placeholder="Nhập tên tab (tối đa 30 ký tự)" maxLength={30} showCount />
      </Form.Item>

      <Form.Item name="iconColor" label="Màu sắc">
        <Row gutter={8}>
          <Col>
            <Form.Item name="iconColor" noStyle>
              <Select style={{ width: 120 }}>
                {TAB_PRESET_COLORS.map((c) => (
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
        <Select options={TAB_ICON_OPTIONS} />
      </Form.Item>

      <Form.Item name="isPinned" label="Ghim tab" valuePropName="checked">
        <Switch />
      </Form.Item>
    </FormModal>
  );
}
