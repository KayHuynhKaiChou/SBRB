import React, { useState } from 'react';
import { Form, Input, Button, Select, Typography, Card } from 'antd';
import { ShopOutlined, TeamOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useAuthStore } from '../../store/auth.store';
import {
  CREATE_BUSINESS_MUTATION,
  ACCEPT_INVITATION_MUTATION,
} from '../../graphql/auth.operations';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const BRAND = '#D72A44';

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

/** Form for creating a new business */
function CreateBusinessForm({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const setCurrentBusiness = useAuthStore((s) => s.setCurrentBusiness);
  const [form] = Form.useForm<CreateBusinessValues>();
  const [createBusiness, { loading }] = useMutation(CREATE_BUSINESS_MUTATION);

  const onFinish = async (values: CreateBusinessValues) => {
    const { data } = await createBusiness({ variables: { input: values } });
    const businessId: string = data.createBusiness.id;
    setCurrentBusiness(businessId);
    navigate('/dashboard');
  };

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        style={{ marginBottom: 20, color: '#666', padding: 0 }}
      >
        Quay lại
      </Button>
      <Title level={4} style={{ marginBottom: 20, color: '#1a1a2e' }}>
        Tạo Business mới
      </Title>
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
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            style={{ background: BRAND, borderColor: BRAND, height: 44 }}
          >
            Tạo Business
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

/** Form for joining via invite code */
function JoinBusinessForm({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const setCurrentBusiness = useAuthStore((s) => s.setCurrentBusiness);
  const [form] = Form.useForm<JoinBusinessValues>();
  const [acceptInvitation, { loading }] = useMutation(ACCEPT_INVITATION_MUTATION);

  const onFinish = async (values: JoinBusinessValues) => {
    const { data } = await acceptInvitation({ variables: { token: values.code } });
    const businessId: string = data.acceptInvitation.id;
    setCurrentBusiness(businessId);
    navigate('/dashboard');
  };

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        style={{ marginBottom: 20, color: '#666', padding: 0 }}
      >
        Quay lại
      </Button>
      <Title level={4} style={{ marginBottom: 8, color: '#1a1a2e' }}>
        Tôi có mã mời
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Nhập mã mời 6 ký tự bạn nhận được
      </Paragraph>

      <Form form={form} layout="vertical" onFinish={onFinish} size="large">
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
            style={{
              textTransform: 'uppercase',
              letterSpacing: 6,
              fontSize: 22,
              textAlign: 'center',
              fontWeight: 600,
            }}
            onChange={(e) => {
              form.setFieldValue('code', e.target.value.toUpperCase());
            }}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            style={{ background: BRAND, borderColor: BRAND, height: 44 }}
          >
            Tham gia
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

type Step = 'choose' | 'create' | 'join';

interface IOptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

/** Big clickable option card for the choice screen */
function OptionCard({ icon, title, description, onClick }: IOptionCardProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <Card
      hoverable
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12,
        border: hovered ? `2px solid ${BRAND}` : '2px solid #e8e8e8',
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: hovered ? '0 4px 16px rgba(215,42,68,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
        padding: '8px 0',
      }}
      bodyStyle={{ padding: '20px 24px', textAlign: 'center' }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: hovered ? BRAND : '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: 24,
          color: hovered ? '#fff' : '#666',
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        {icon}
      </div>
      <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 6, color: '#1a1a2e' }}>
        {title}
      </Text>
      <Text type="secondary" style={{ fontSize: 13 }}>
        {description}
      </Text>
    </Card>
  );
}

/** Onboarding page — choose path then fill in details */
export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('choose');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 5,
                height: 24,
                background: BRAND,
                borderRadius: 2,
              }}
            />
            <Text
              strong
              style={{ fontSize: 22, color: '#1a1a2e', letterSpacing: 1.5 }}
            >
              SBRB
            </Text>
          </div>
          {step === 'choose' && (
            <>
              <Title level={3} style={{ margin: '0 0 6px', color: '#1a1a2e' }}>
                Bắt đầu
              </Title>
              <Text type="secondary" style={{ fontSize: 14 }}>
                Thiết lập không gian làm việc của bạn
              </Text>
            </>
          )}
        </div>

        {/* Card container */}
        <Card
          style={{
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            border: '1px solid #e8e8e8',
          }}
          bodyStyle={{ padding: '28px 32px' }}
        >
          {step === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <OptionCard
                icon={<ShopOutlined />}
                title="Tạo Business mới"
                description="Bắt đầu từ đầu, thiết lập business của bạn"
                onClick={() => setStep('create')}
              />
              <OptionCard
                icon={<TeamOutlined />}
                title="Tôi có mã mời"
                description="Tham gia business bằng mã mời từ người quản lý"
                onClick={() => setStep('join')}
              />
            </div>
          )}

          {step === 'create' && <CreateBusinessForm onBack={() => setStep('choose')} />}
          {step === 'join' && <JoinBusinessForm onBack={() => setStep('choose')} />}
        </Card>
      </div>
    </div>
  );
}
