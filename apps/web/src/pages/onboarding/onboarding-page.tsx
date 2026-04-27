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

import {
  BRAND_COLOR,
  CURRENCIES,
  INDUSTRIES,
  TIMEZONES,
} from '@sbrb/shared-constants';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

interface CreateBusinessValues {
  name: string;
  industry: string;
  timezone: string;
  currency: string;
}

interface JoinBusinessValues {
  code: string;
}

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
        className="!mb-5 !text-gray-500 !p-0"
      >
        Quay lại
      </Button>
      <Title level={4} className="!mb-5 !text-[#1a1a2e]">
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
            className="!bg-[#D72A44] !border-[#D72A44] !h-11"
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
        className="!mb-5 !text-gray-500 !p-0"
      >
        Quay lại
      </Button>
      <Title level={4} className="!mb-2 !text-[#1a1a2e]">
        Tôi có mã mời
      </Title>
      <Paragraph type="secondary" className="!mb-6">
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
            className="!uppercase !tracking-widest !text-[22px] !text-center !font-semibold"
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
            className="!bg-[#D72A44] !border-[#D72A44] !h-11"
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
      className="!rounded-xl !cursor-pointer"
      style={{
        border: hovered ? `2px solid ${BRAND_COLOR}` : '2px solid #e8e8e8',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: hovered ? '0 4px 16px rgba(215,42,68,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
        padding: '8px 0',
      }}
      bodyStyle={{ padding: '20px 24px', textAlign: 'center' }}
    >
      <div
        className="w-14 h-14 rounded-[14px] flex items-center justify-center mx-auto mb-4 text-2xl"
        style={{
          background: hovered ? BRAND_COLOR : '#f5f5f5',
          color: hovered ? '#fff' : '#666',
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        {icon}
      </div>
      <Text strong className="!text-[15px] !block !mb-1.5 !text-[#1a1a2e]">
        {title}
      </Text>
      <Text type="secondary" className="!text-[13px]">
        {description}
      </Text>
    </Card>
  );
}

/** Onboarding page — choose path then fill in details */
export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('choose');

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-[480px]">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="inline-block w-[5px] h-6 bg-[#D72A44] rounded-sm" />
            <Text strong className="!text-[22px] !text-[#1a1a2e] !tracking-widest">
              SBRB
            </Text>
          </div>
          {step === 'choose' && (
            <>
              <Title level={3} className="!mt-0 !mb-1.5 !text-[#1a1a2e]">
                Bắt đầu
              </Title>
              <Text type="secondary" className="!text-sm">
                Thiết lập không gian làm việc của bạn
              </Text>
            </>
          )}
        </div>

        {/* Card container */}
        <Card
          className="!rounded-2xl !border !border-[#e8e8e8]"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
          bodyStyle={{ padding: '28px 32px' }}
        >
          {step === 'choose' && (
            <div className="flex flex-col gap-4">
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
