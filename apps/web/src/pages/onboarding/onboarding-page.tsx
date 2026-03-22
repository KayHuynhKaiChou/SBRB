import React, { useState } from 'react';
import { Tabs, Form, Input, Button, Select, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { AuthLayout } from '../../components/auth/auth-layout';
import { useAuthStore } from '../../store/auth.store';
import {
  CREATE_BUSINESS_MUTATION,
  ACCEPT_INVITATION_MUTATION,
} from '../../graphql/auth.operations';

const { Option } = Select;

interface CreateBusinessValues {
  name: string;
  industry: string;
  timezone: string;
  currency: string;
}

interface JoinBusinessValues {
  code: string;
}

const INDUSTRIES = [
  'Bán lẻ', 'Nhà hàng / F&B', 'Dịch vụ', 'Sản xuất',
  'Công nghệ', 'Giáo dục', 'Y tế', 'Khác',
];

const TIMEZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Hà Nội / TP.HCM (UTC+7)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (UTC+7)' },
  { value: 'Asia/Singapore', label: 'Singapore (UTC+8)' },
  { value: 'UTC', label: 'UTC' },
];

const CURRENCIES = [
  { value: 'VND', label: 'VND — Đồng Việt Nam' },
  { value: 'USD', label: 'USD — Đô la Mỹ' },
  { value: 'EUR', label: 'EUR — Euro' },
];

function CreateBusinessTab() {
  const navigate = useNavigate();
  const setCurrentBusiness = useAuthStore((s) => s.setCurrentBusiness);
  const [form] = Form.useForm<CreateBusinessValues>();
  const [createBusiness, { loading }] = useMutation(CREATE_BUSINESS_MUTATION);

  const onFinish = async (values: CreateBusinessValues) => {
    const { data } = await createBusiness({ variables: { input: values } });
    const businessId: string = data.createBusiness.id;
    setCurrentBusiness(businessId);
    navigate(`/dashboard/${businessId}`);
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} size="large">
      <Form.Item
        name="name"
        label="Tên business"
        rules={[{ required: true, message: 'Vui lòng nhập tên business' }]}
      >
        <Input placeholder="Cửa hàng của tôi" />
      </Form.Item>

      <Form.Item
        name="industry"
        label="Ngành nghề"
        rules={[{ required: true, message: 'Vui lòng chọn ngành nghề' }]}
      >
        <Select placeholder="Chọn ngành nghề">
          {INDUSTRIES.map((ind) => (
            <Option key={ind} value={ind}>{ind}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="timezone"
        label="Múi giờ"
        initialValue="Asia/Ho_Chi_Minh"
        rules={[{ required: true, message: 'Vui lòng chọn múi giờ' }]}
      >
        <Select>
          {TIMEZONES.map((tz) => (
            <Option key={tz.value} value={tz.value}>{tz.label}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="currency"
        label="Đơn vị tiền tệ"
        initialValue="VND"
        rules={[{ required: true, message: 'Vui lòng chọn tiền tệ' }]}
      >
        <Select>
          {CURRENCIES.map((c) => (
            <Option key={c.value} value={c.value}>{c.label}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Tạo Business
        </Button>
      </Form.Item>
    </Form>
  );
}

function JoinBusinessTab() {
  const navigate = useNavigate();
  const setCurrentBusiness = useAuthStore((s) => s.setCurrentBusiness);
  const [form] = Form.useForm<JoinBusinessValues>();
  const [acceptInvitation, { loading }] = useMutation(ACCEPT_INVITATION_MUTATION);

  const onFinish = async (values: JoinBusinessValues) => {
    const { data } = await acceptInvitation({ variables: { token: values.code } });
    const businessId: string = data.acceptInvitation.id;
    setCurrentBusiness(businessId);
    navigate(`/dashboard/${businessId}`);
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} size="large">
      <Typography.Paragraph type="secondary">
        Nhập mã mời 6 ký tự bạn nhận được
      </Typography.Paragraph>

      <Form.Item
        name="code"
        label="Mã mời"
        rules={[
          { required: true, message: 'Vui lòng nhập mã mời' },
          { len: 6, message: 'Mã mời phải đúng 6 ký tự' },
        ]}
      >
        <Input
          placeholder="ABC123"
          maxLength={6}
          style={{ textTransform: 'uppercase', letterSpacing: 4, fontSize: 20, textAlign: 'center' }}
          onChange={(e) => {
            form.setFieldValue('code', e.target.value.toUpperCase());
          }}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Tham gia
        </Button>
      </Form.Item>
    </Form>
  );
}

const TAB_ITEMS = [
  { key: 'create', label: 'Tạo Business mới', children: <CreateBusinessTab /> },
  { key: 'join', label: 'Tôi có mã mời', children: <JoinBusinessTab /> },
];

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <AuthLayout title="Bắt đầu" subtitle="Thiết lập không gian làm việc của bạn">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={TAB_ITEMS}
        centered
      />
    </AuthLayout>
  );
}
